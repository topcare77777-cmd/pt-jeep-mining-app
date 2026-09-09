'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface DocumentLog {
    id: string
    created_at: string
    agenda_no: string
    title: string
    sender: string
    category: string
    status: string
}

const ALL_MODULES = [
    { key: 'manager-site', label: 'Pit Produksi', icon: '⛏️', href: '/manager-site' },
    { key: 'fleet', label: 'Alat Berat', icon: '🚜', href: '/fleet' },
    { key: 'fleet-maintenance', label: 'Workshop Fleet', icon: '🔧', href: '/fleet-maintenance' },
    { key: 'sparepart', label: 'Sparepart', icon: '📦', href: '/sparepart' },
    { key: 'safety', label: 'Inspeksi K3', icon: '⛑️', href: '/safety' },
    { key: 'ritase', label: 'Ritase', icon: '🚛', href: '/ritase' },
    { key: 'jetty', label: 'Jetty Port', icon: '🚢', href: '/jetty' },
    { key: 'environment', label: 'Lingkungan', icon: '🌱', href: '/environment' },
    { key: 'lingkungan', label: 'Kanal Sedimen', icon: '🏞️', href: '/lingkungan' },
    { key: 'bbm', label: 'BBM Solar', icon: '⛽', href: '/bbm' },
    { key: 'finance', label: 'Keuangan', icon: '💰', href: '/finance' },
    { key: 'adm', label: 'ADM & Surat', icon: '📋', href: '/adm' },
    { key: 'hrd', label: 'HRD & K3', icon: '👷‍♂️', href: '/hrd' },
    { key: 'ga', label: 'GA & Fasilitas', icon: '🚙', href: '/ga' },
    { key: 'mess', label: 'Mess Camp', icon: '🏠', href: '/mess' },
    { key: 'catering', label: 'Katering', icon: '🍱', href: '/catering' },
    { key: 'clinic', label: 'Klinik Site', icon: '🏥', href: '/clinic' },
    { key: 'security', label: 'Security', icon: '🛡️', href: '/security' },
    { key: 'radio', label: 'Radio Dispatch', icon: '📻', href: '/radio' },
    { key: 'legal', label: 'Legalitas IUP', icon: '⚖️', href: '/legal' },
    { key: 'csr', label: 'CSR Masyarakat', icon: '🤝', href: '/csr' },
    { key: 'vendor', label: 'Vendor', icon: '🏬', href: '/vendor' },
    { key: 'transport', label: 'Transport Kru', icon: '🚌', href: '/transport' },
    { key: 'training', label: 'Training K3', icon: '🎓', href: '/training' },
    { key: 'performance', label: 'Kinerja KPI', icon: '📈', href: '/performance' },
    { key: 'it-helpdesk', label: 'IT Helpdesk', icon: '💻', href: '/it-helpdesk' },
    { key: 'helpdesk', label: 'Helpdesk GA', icon: '🛠️', href: '/helpdesk' },
    { key: 'investor', label: 'Investor', icon: '📊', href: '/investor' },
    { key: 'direktur', label: 'Eksekutif BOD', icon: '🏛️', href: '/direktur' },
    { key: 'laporan', label: 'Cetak Laporan', icon: '📄', href: '/laporan' },
]

export default function AdmDashboard() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas ADM')
    const [userRole, setUserRole] = useState('ADM')
    const [userId, setUserId] = useState<string | null>(null)
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState('surat')
    const [documents, setDocuments] = useState<DocumentLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [agendaNo, setAgendaNo] = useState('')
    const [title, setTitle] = useState('')
    const [sender, setSender] = useState('')
    const [category, setCategory] = useState('Surat Jalan')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initAdm() {
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

                setUserId(session.user.id)

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, status')
                    .eq('id', session.user.id)
                    .maybeSingle()

                const statusClean = (profile?.status || '').toLowerCase().trim()
                if (statusClean === 'nonaktif' || statusClean === 'non-aktif' || statusClean === 'banned') {
                    alert('Akun Anda dinonaktifkan.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                if (isMounted) {
                    setUserName(profile?.full_name || 'Petugas ADM & Legal Site')
                    const division = (profile?.role || 'ADM').trim()
                    setUserRole(division)

                    const isSuperAdmin = ['admin', 'administrator', 'superadmin'].includes(division.toLowerCase())

                    let grantedKeys: string[] = []
                    if (isSuperAdmin) {
                        grantedKeys = ALL_MODULES.map((m) => m.key)
                    } else {
                        const { data: allPerms } = await supabase
                            .from('division_permissions')
                            .select('division_name, allowed_modules')

                        if (allPerms && allPerms.length > 0) {
                            const cleanDiv = division.toLowerCase()

                            const matched = allPerms.find((p) => {
                                const target = (p.division_name || '').toLowerCase().trim()
                                return (
                                    target === cleanDiv ||
                                    target.includes(cleanDiv) ||
                                    cleanDiv.includes(target) ||
                                    (cleanDiv === 'adm' && (target.includes('administrasi') || target.includes('adm')))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['adm']
                            }
                        } else {
                            grantedKeys = ['adm']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('adm')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Administrasi & Surat.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    const { data: docData } = await supabase
                        .from('adm_documents')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (docData && docData.length > 0) {
                        setDocuments(docData)
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error in ADM init:', err)
                if (isMounted) setLoading(false)
            }
        }

        initAdm()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !sender) return

        setSubmitting(true)
        const generatedNo = agendaNo || `ADM/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`

        const payload: Record<string, any> = {
            agenda_no: generatedNo,
            title,
            sender,
            category,
            status: 'Tervalidasi',
        }

        if (userId) {
            payload.created_by = userId
        }

        const { data, error } = await supabase
            .from('adm_documents')
            .insert([payload])
            .select()

        if (!error && data) {
            setDocuments([data[0], ...documents])
            setShowModal(false)
            setTitle('')
            setSender('')
            setAgendaNo('')
        } else {
            alert('Gagal menyimpan dokumen: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const filteredDocs = documents.filter((doc) =>
        (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.agenda_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.sender || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">Sinkronisasi Dokumen ADM Nikel...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">📋</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Dashboard Administrasi (ADM) PT. Jangkar Energi Eka Perkasa
                            </h1>
                            <p className="text-xs text-sky-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                                <span>Live Sync Dokumen & Surat Jalan Tambang Nikel</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    {userRole}
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

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {authorizedNavItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                        ? 'bg-[#162d47] text-white border-sky-400/80 shadow-sm'
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

            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'surat', label: 'SURAT MASUK & KELUAR', badge: `${documents.length} BERKAS` },
                    { id: 'suratjalan', label: 'SURAT JALAN & RITASE NIKEL' },
                    { id: 'po', label: 'PURCHASE ORDER (PO)' },
                    { id: 'simp', label: 'BUKU TAMU & SIMP SITE' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${activeTab === tab.id
                                ? 'bg-[#1b3b5f] border-sky-400 text-white shadow-lg shadow-sky-950/50'
                                : 'bg-[#0c1a2d] border-[#1b2e46] text-slate-400 hover:text-white hover:bg-[#12243d]'
                            }`}
                    >
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded font-black">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-sky-500/50 bg-sky-950/20 hover:bg-sky-900/30 text-sky-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Catat Dokumen Baru</div>
                            <div className="text-[10px] text-slate-400">Surat Jalan, Memo, atau SIMP</div>
                        </div>
                    </div>

                    <Link
                        href="/ritase"
                        className="p-4 rounded-xl border border-[#1b2e46] bg-[#0c1a2d] hover:bg-[#12243d] hover:border-sky-500/50 text-slate-200 transition flex items-center gap-3 block"
                    >
                        <span className="text-xl">⚖️</span>
                        <div>
                            <div className="text-xs font-bold text-sky-400">Rekap Timbangan & Ritase</div>
                            <div className="text-[10px] text-slate-400">Verifikasi Muatan Surat Jalan</div>
                        </div>
                    </Link>

                    <div className="p-4 rounded-xl border border-[#16273c] bg-[#0a1625] text-slate-400 space-y-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Database ADM</span>
                        <div className="text-[11px] flex justify-between">
                            <span>Tabel Terhubung</span>
                            <span className="text-emerald-400 font-semibold">adm_documents</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Total Berkas</span>
                            <span className="text-slate-200 font-bold">{documents.length} baris</span>
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-9 space-y-6">
                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                            <div className="w-full md:w-72">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari no. agenda, perihal, pengirim..."
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                />
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer"
                            >
                                + Dokumen Baru
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">No. Agenda</th>
                                        <th className="pb-2">Perihal / Berkas</th>
                                        <th className="pb-2">Pengirim</th>
                                        <th className="pb-2">Kategori</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {filteredDocs.length > 0 ? (
                                        filteredDocs.map((doc) => (
                                            <tr key={doc.id}>
                                                <td className="py-2.5 font-mono text-[11px] text-sky-400 font-bold">{doc.agenda_no}</td>
                                                <td className="font-semibold text-white">{doc.title}</td>
                                                <td className="text-slate-400">{doc.sender}</td>
                                                <td>
                                                    <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                        {doc.category}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
                                                        {doc.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                                                Belum ada dokumen yang cocok dengan pencarian.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Dokumen / Surat Masuk</h2>
                        <form onSubmit={handleAddDocument} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nomor Agenda (Opsional)</label>
                                <input
                                    type="text"
                                    value={agendaNo}
                                    onChange={(e) => setAgendaNo(e.target.value)}
                                    placeholder="Otomatis jika dikosongkan"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Perihal Dokumen / Surat</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Contoh: Surat Jalan Solar 16.000L"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Pengirim / Vendor / Divisi</label>
                                <input
                                    type="text"
                                    required
                                    value={sender}
                                    onChange={(e) => setSender(e.target.value)}
                                    placeholder="Contoh: PT Surya Jaya Transport"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Kategori Dokumen</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                >
                                    <option value="Surat Jalan">Surat Jalan (Delivery Order)</option>
                                    <option value="SIMP">Izin Masuk Site (SIMP)</option>
                                    <option value="Surat Dinas">Surat Masuk / Memo Internal</option>
                                    <option value="PO & Invoice">PO & Administrasi Vendor</option>
                                </select>
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
                                    className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Berkas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}