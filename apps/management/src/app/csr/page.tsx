'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface CsrItem {
    id: string
    created_at?: string
    program_name: string
    category: string
    target_village: string
    budget_allocated_idr: number
    realization_status: string
    community_leader: string
    pic_csr: string
}

export default function CsrManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('CSR & External Relations Officer')
    const [csrPrograms, setCsrPrograms] = useState<CsrItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Program CSR Baru
    const [showModal, setShowModal] = useState(false)
    const [programName, setProgramName] = useState('')
    const [category, setCategory] = useState('Infrastruktur Desa')
    const [targetVillage, setTargetVillage] = useState('')
    const [budgetAllocatedIdr, setBudgetAllocatedIdr] = useState('50000000')
    const [realizationStatus, setRealizationStatus] = useState('Berjalan')
    const [communityLeader, setCommunityLeader] = useState('')
    const [picCsr, setPicCsr] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initCsr() {
            try {
                if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
                    const hashClean = window.location.hash.startsWith('#')
                        ? window.location.hash.substring(1)
                        : window.location.hash
                    const hashParams = new URLSearchParams(hashClean)
                    const accessToken = hashParams.get('access_token')
                    const refreshToken = hashParams.get('refresh_token')

                    if (accessToken) {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                        })
                        window.history.replaceState(null, '', window.location.pathname)
                    }
                }

                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, status')
                    .eq('id', session.user.id)
                    .maybeSingle()

                const statusClean = (profile?.status || '').toLowerCase().trim()
                if (statusClean === 'nonaktif' || statusClean === 'banned') {
                    alert('Akun Anda dinonaktifkan.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                if (isMounted) {
                    setUserName(profile?.full_name || 'External Relations Superintendent')

                    const { data, error } = await supabase
                        .from('csr_program_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setCsrPrograms(data)
                    } else {
                        setCsrPrograms([
                            {
                                id: '1',
                                program_name: 'Pembangunan Akses Air Bersih & Sanitasi Desa',
                                category: 'Infrastruktur Desa',
                                target_village: 'Desa Suka Makmur (Lingkar Tambang)',
                                budget_allocated_idr: 75000000,
                                realization_status: 'Berjalan',
                                community_leader: 'Bapak Kepala Desa Suka Makmur',
                                pic_csr: 'Ahmad External Relations',
                            },
                            {
                                id: '2',
                                program_name: 'Program Beasiswa Prestasi Pelajar Lingkar Tambang',
                                category: 'Pendidikan',
                                target_village: 'Kecamatan Penambangan Utama',
                                budget_allocated_idr: 45000000,
                                realization_status: 'Selesai',
                                community_leader: 'Ketua Karang Taruna Setempat',
                                pic_csr: 'Siti CSR Officer',
                            },
                        ])
                    }
                    setLoading(false)
                }
            } catch (err) {
                console.error(err)
                if (isMounted) setLoading(false)
            }
        }

        initCsr()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddCsr = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!programName || !targetVillage) return

        setSubmitting(true)

        const payload = {
            program_name: programName,
            category,
            target_village: targetVillage,
            budget_allocated_idr: parseFloat(budgetAllocatedIdr) || 0,
            realization_status: realizationStatus,
            community_leader: communityLeader || 'Kepala Desa Mitra',
            pic_csr: picCsr || userName,
        }

        const { data, error } = await supabase
            .from('csr_program_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setCsrPrograms([data[0], ...csrPrograms])
            setShowModal(false)
            setProgramName('')
            setTargetVillage('')
        } else {
            alert('Gagal menyimpan program CSR: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalPrograms = csrPrograms.length
    const totalBudgetAll = csrPrograms.reduce((acc, curr) => acc + Number(curr.budget_allocated_idr || 0), 0)
    const completedPrograms = csrPrograms.filter((c) => c.realization_status === 'Selesai').length

    const filteredPrograms = csrPrograms.filter((item) =>
        item.program_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.target_village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pic_csr.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/csr', label: 'CSR & Masyarakat', icon: '🤝' },
        { href: '/it-helpdesk', label: 'IT Helpdesk', icon: '💻' },
        { href: '/hrd', label: 'HRD & Payroll', icon: '👷‍♂️' },
        { href: '/fleet-maintenance', label: 'Maintenance', icon: '🔧' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/manager-site', label: 'Pit Penambangan', icon: '⛏️' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/jetty', label: 'Jetty & LCT', icon: '🚢' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal & IUP', icon: '⚖️' },
        { href: '/investor', label: 'Investor', icon: '📈' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Program CSR & Hubungan Masyarakat...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🤝</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Hubungan Masyarakat & CSR PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Pemberdayaan Masyarakat Desa Lingkar Tambang, Alokasi Anggaran, & Realisasi Sosial</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    External Relations Dept
                                </span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        Keluar ke Beranda
                    </button>
                </div>

                {/* Global Module Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {navLinks.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                        ? 'bg-[#162d47] text-white border-amber-400/80 shadow-sm'
                                        : 'bg-[#0a1625] text-slate-400 border-[#1b2e46] hover:text-slate-200 hover:bg-[#0f2137]'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </header>

            {/* KPI CSR */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Program CSR</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalPrograms} Program</div>
                    <p className="mt-2 text-[11px] text-slate-400">Inisiatif Sosial Lingkar Tambang</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Akumulasi Anggaran</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        Rp {(totalBudgetAll / 1000000).toFixed(1)} Juta
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Komitmen Dana Sosial Korporat</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Program Selesai</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{completedPrograms} Program</div>
                    <p className="mt-2 text-[11px] text-slate-400">Realisasi Tuntas Di Desa</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hubungan Masyarakat</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">Harmonis</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Dukungan Penuh Tokoh Lokal</p>
                </div>
            </div>

            {/* Grid Tabel CSR */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari program, desa, kategori, PIC..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Tambah Program CSR Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nama Program CSR</th>
                                <th className="pb-2">Kategori</th>
                                <th className="pb-2">Desa / Wilayah Sasaran</th>
                                <th className="pb-2 text-right">Anggaran (IDR)</th>
                                <th className="pb-2 text-center">Status Realisasi</th>
                                <th className="pb-2">Tokoh Mitra / Kades</th>
                                <th className="pb-2">Officer PIC</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredPrograms.length > 0 ? (
                                filteredPrograms.map((csr) => {
                                    const isCompleted = csr.realization_status === 'Selesai'
                                    return (
                                        <tr key={csr.id}>
                                            <td className="py-2.5 font-bold text-white">{csr.program_name}</td>
                                            <td>
                                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                    {csr.category}
                                                </span>
                                            </td>
                                            <td className="text-slate-300">{csr.target_village}</td>
                                            <td className="text-right font-mono font-bold text-emerald-400">
                                                Rp {Number(csr.budget_allocated_idr).toLocaleString('id-ID')}
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCompleted
                                                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                        }`}
                                                >
                                                    {csr.realization_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-slate-300">{csr.community_leader}</td>
                                            <td className="text-slate-400">{csr.pic_csr}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada program CSR yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Program CSR */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tambah Program CSR & Hubungan Masyarakat</h2>
                        <form onSubmit={handleAddCsr} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Program CSR</label>
                                <input
                                    type="text"
                                    required
                                    value={programName}
                                    onChange={(e) => setProgramName(e.target.value)}
                                    placeholder="Contoh: Bantuan Beasiswa Pelajar Lokal"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori Program</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Infrastruktur Desa">Infrastruktur Desa</option>
                                        <option value="Pendidikan">Pendidikan & Pelatihan</option>
                                        <option value="Kesehatan">Kesehatan & Sanitasi</option>
                                        <option value="Ekonomi Kerakyatan">Ekonomi Kerakyatan & UMKM</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Desa / Wilayah Sasaran</label>
                                    <input
                                        type="text"
                                        required
                                        value={targetVillage}
                                        onChange={(e) => setTargetVillage(e.target.value)}
                                        placeholder="Desa Suka Makmur"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Anggaran (IDR)</label>
                                    <input
                                        type="number"
                                        required
                                        value={budgetAllocatedIdr}
                                        onChange={(e) => setBudgetAllocatedIdr(e.target.value)}
                                        placeholder="50000000"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Realisasi</label>
                                    <select
                                        value={realizationStatus}
                                        onChange={(e) => setRealizationStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="Berjalan">Berjalan (On Progress)</option>
                                        <option value="Selesai">Selesai (Completed)</option>
                                        <option value="Perencanaan">Perencanaan (Planning)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tokoh Mitra / Kades</label>
                                    <input
                                        type="text"
                                        required
                                        value={communityLeader}
                                        onChange={(e) => setCommunityLeader(e.target.value)}
                                        placeholder="Nama Kepala Desa"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Officer CSR (PIC)</label>
                                    <input
                                        type="text"
                                        required
                                        value={picCsr}
                                        onChange={(e) => setPicCsr(e.target.value)}
                                        placeholder="Nama officer CSR"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-[#1b2e46] text-slate-400 hover:text-white text-xs transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Program CSR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}