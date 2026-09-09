'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface VendorItem {
    id: string
    created_at?: string
    vendor_name: string
    service_category: string
    contract_number: string
    project_manager: string
    phone_contact?: string
    contract_start: string
    contract_end: string
    performance_score: number
    status: string
}

export default function VendorManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Procurement & Vendor Control')
    const [vendors, setVendors] = useState<VendorItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Kontraktor Baru
    const [showModal, setShowModal] = useState(false)
    const [vendorName, setVendorName] = useState('')
    const [serviceCategory, setServiceCategory] = useState('Hauling Contractor')
    const [contractNumber, setContractNumber] = useState('')
    const [projectManager, setProjectManager] = useState('')
    const [phoneContact, setPhoneContact] = useState('')
    const [contractStart, setContractStart] = useState('2026-01-01')
    const [contractEnd, setContractEnd] = useState('2026-12-31')
    const [performanceScore, setPerformanceScore] = useState('88.5')
    const [status, setStatus] = useState('Aktif')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initVendor() {
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
                    setUserName(profile?.full_name || 'Procurement Superintendent')

                    const { data, error } = await supabase
                        .from('site_vendors')
                        .select('*')
                        .order('vendor_name', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setVendors(data)
                    } else {
                        setVendors([
                            {
                                id: '1',
                                vendor_name: 'PT Surya Jaya Transport',
                                service_category: 'Hauling Contractor',
                                contract_number: 'SPK/JEEP/01/2026-012',
                                project_manager: 'Hendra Gunawan',
                                phone_contact: '081298765432',
                                contract_start: '2026-01-10',
                                contract_end: '2026-12-31',
                                performance_score: 91.5,
                                status: 'Aktif',
                            },
                            {
                                id: '2',
                                vendor_name: 'PT United Tractors Tbk',
                                service_category: 'Heavy Equipment Rental',
                                contract_number: 'SPK/JEEP/02/2026-008',
                                project_manager: 'Irwan Setiawan',
                                phone_contact: '082112345678',
                                contract_start: '2026-02-01',
                                contract_end: '2026-11-30',
                                performance_score: 94.0,
                                status: 'Aktif',
                            },
                            {
                                id: '3',
                                vendor_name: 'PT Solar Pasifik Energi',
                                service_category: 'General Supplier (BBM)',
                                contract_number: 'SPK/JEEP/03/2026-003',
                                project_manager: 'Rahmat Hidayat',
                                phone_contact: '081345678901',
                                contract_start: '2026-01-01',
                                contract_end: '2026-06-30',
                                performance_score: 88.0,
                                status: 'Aktif',
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

        initVendor()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddVendor = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!vendorName || !contractNumber) return

        setSubmitting(true)

        const payload = {
            vendor_name: vendorName,
            service_category: serviceCategory,
            contract_number: contractNumber.toUpperCase(),
            project_manager: projectManager,
            phone_contact: phoneContact,
            contract_start: contractStart,
            contract_end: contractEnd,
            performance_score: parseFloat(performanceScore) || 85.0,
            status,
        }

        const { data, error } = await supabase
            .from('site_vendors')
            .insert([payload])
            .select()

        if (!error && data) {
            setVendors([...vendors, data[0]])
            setShowModal(false)
            setVendorName('')
            setContractNumber('')
            setProjectManager('')
            setPhoneContact('')
        } else {
            alert('Gagal menyimpan data vendor: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalVendors = vendors.length
    const activeVendors = vendors.filter((v) => v.status === 'Aktif').length
    const avgPerformance = totalVendors > 0
        ? (vendors.reduce((acc, curr) => acc + Number(curr.performance_score || 0), 0) / totalVendors).toFixed(1)
        : '0.0'

    const filteredVendors = vendors.filter((item) =>
        item.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.service_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project_manager.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/mess', label: 'Mess & Camp', icon: '🏠' },
        { href: '/vendor', label: 'Kontraktor & Vendor', icon: '🤝' },
        { href: '/ritase', label: 'Ritase', icon: '🚛' },
        { href: '/jetty', label: 'Jetty Port', icon: '🚢' },
        { href: '/lingkungan', label: 'Lingkungan', icon: '🌱' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/adm', label: 'ADM & Surat', icon: '📋' },
        { href: '/hrd', label: 'HRD & K3', icon: '👷‍♂️' },
        { href: '/ga', label: 'GA & Fasilitas', icon: '🚙' },
        { href: '/direktur', label: 'Eksekutif', icon: '🏛️' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Data Kontraktor & Vendor Site...</p>
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
                                Kendali Kontraktor & Vendor Tambang PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Manajemen Kontrak Kerja Sama, Kinerja Mitra, & Pengawasan Operasional</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Procurement Dept
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

            {/* KPI Vendor */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Mitra Kontraktor</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalVendors} Perusahaan</div>
                    <p className="mt-2 text-[11px] text-slate-400">Mitra Pendukung Operasional Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kontrak Aktif</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{activeVendors} Kontrak</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Berjalan Normal di Lapangan</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-Rata Skor Kinerja</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{avgPerformance} / 100</div>
                    <p className="mt-2 text-[11px] text-slate-400">Evaluasi Produktivitas & K3</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kepatuhan SLA Kontrak</h3>
                    <div className="text-2xl font-black text-sky-400 font-mono">100% Patuh</div>
                    <p className="mt-2 text-[11px] text-sky-400 font-medium">✓ Sesuai Perjanjian Kerja Sama</p>
                </div>
            </div>

            {/* Grid Tabel Vendor */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama vendor, bidang, atau SPK..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Daftarkan Kontraktor Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nama Perusahaan Vendor</th>
                                <th className="pb-2">Bidang Layanan</th>
                                <th className="pb-2">No. Kontrak / SPK</th>
                                <th className="pb-2">Project Manager (PIC)</th>
                                <th className="pb-2">Masa Berlaku Kontrak</th>
                                <th className="pb-2 text-right">Skor Kinerja</th>
                                <th className="pb-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredVendors.length > 0 ? (
                                filteredVendors.map((v) => (
                                    <tr key={v.id}>
                                        <td className="py-2.5 font-bold text-white">{v.vendor_name}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {v.service_category}
                                            </span>
                                        </td>
                                        <td className="font-mono text-amber-400 text-[11px]">{v.contract_number}</td>
                                        <td>
                                            <div>{v.project_manager}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{v.phone_contact || '-'}</div>
                                        </td>
                                        <td className="font-mono text-slate-300 text-[11px]">
                                            {v.contract_start} s/d {v.contract_end}
                                        </td>
                                        <td className="text-right font-mono font-bold text-emerald-400">
                                            {Number(v.performance_score).toFixed(1)}
                                        </td>
                                        <td className="text-center">
                                            <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                                                {v.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data kontraktor yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Vendor */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Registrasi Kontraktor & Vendor Baru</h2>
                        <form onSubmit={handleAddVendor} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Perusahaan Kontraktor</label>
                                <input
                                    type="text"
                                    required
                                    value={vendorName}
                                    onChange={(e) => setVendorName(e.target.value)}
                                    placeholder="Contoh: PT Mitra Tambang Sejahtera"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Bidang Layanan</label>
                                    <select
                                        value={serviceCategory}
                                        onChange={(e) => setServiceCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Hauling Contractor">Hauling Contractor</option>
                                        <option value="Heavy Equipment Rental">Heavy Equipment Rental</option>
                                        <option value="General Supplier (BBM)">General Supplier (BBM)</option>
                                        <option value="Drilling & Blasting">Drilling & Blasting</option>
                                        <option value="Civil Work & Road">Civil Work & Road</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Kontrak / SPK</label>
                                    <input
                                        type="text"
                                        required
                                        value={contractNumber}
                                        onChange={(e) => setContractNumber(e.target.value)}
                                        placeholder="SPK/JEEP/01/2026-XXX"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Project Manager (PIC)</label>
                                    <input
                                        type="text"
                                        required
                                        value={projectManager}
                                        onChange={(e) => setProjectManager(e.target.value)}
                                        placeholder="Nama Pimpinan Proyek"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Kontak / WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={phoneContact}
                                        onChange={(e) => setPhoneContact(e.target.value)}
                                        placeholder="0812xxxxxxxx"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Mulai Kontrak</label>
                                    <input
                                        type="date"
                                        required
                                        value={contractStart}
                                        onChange={(e) => setContractStart(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Berakhir Kontrak</label>
                                    <input
                                        type="date"
                                        required
                                        value={contractEnd}
                                        onChange={(e) => setContractEnd(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Skor Kinerja (0-100)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={performanceScore}
                                        onChange={(e) => setPerformanceScore(e.target.value)}
                                        placeholder="90.0"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Kontrak</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Aktif">Aktif Berjalan</option>
                                        <option value="Evaluasi">Dalam Evaluasi</option>
                                        <option value="Selesai">Kontrak Selesai</option>
                                    </select>
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Kontraktor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}