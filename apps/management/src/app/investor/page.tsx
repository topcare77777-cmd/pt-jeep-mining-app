'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface NickelInvestorReport {
    id: string
    created_at?: string
    report_period: string
    report_title: string
    category: string
    total_revenue_idr: number
    nickel_ore_wmt: number
    average_grade_ni: number
    rkab_compliance_status: string
    author_executive: string
}

const ALL_MODULES = [
    { key: 'manager-site', label: 'Pit Produksi', icon: '⛏️', href: '/manager-site' },
    { key: 'geologi', label: 'Geologi & Eksplorasi', icon: '🧭', href: '/geologi' },
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
    { key: 'investor', label: 'Investor & RKAB', icon: '📊', href: '/investor' },
    { key: 'direktur', label: 'Eksekutif BOD', icon: '🏛️', href: '/direktur' },
    { key: 'laporan', label: 'Cetak Laporan', icon: '📄', href: '/laporan' },
]

export default function InvestorManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Investor Relations Manager')
    const [userRole, setUserRole] = useState('Investor Relations')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [reports, setReports] = useState<NickelInvestorReport[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Laporan Korporat Tambang Nikel
    const [showModal, setShowModal] = useState(false)
    const [reportPeriod, setReportPeriod] = useState('Kuartal II - 2026')
    const [reportTitle, setReportTitle] = useState('')
    const [category, setCategory] = useState('Kinerja Produksi & Pengapalan Ore')
    const [totalRevenueIdr, setTotalRevenueIdr] = useState('68500000000')
    const [nickelOreWmt, setNickelOreWmt] = useState('145000')
    const [averageGradeNi, setAverageGradeNi] = useState('1.78')
    const [rkabComplianceStatus, setRkabComplianceStatus] = useState('Sesuai Kuota RKAB')
    const [authorExecutive, setAuthorExecutive] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initInvestor() {
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
                    setUserName(profile?.full_name || 'Direktur Keuangan & Hubungan Investor')
                    const division = (profile?.role || 'Investor Relations').trim()
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
                                    (cleanDiv.includes('investor') && target.includes('investor')) ||
                                    (cleanDiv.includes('keuangan') && target.includes('keuangan'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['investor']
                            }
                        } else {
                            grantedKeys = ['investor']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('investor')) {
                        alert('Divisi Anda tidak memiliki izin untuk membuka modul Laporan Hubungan Investor.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    const { data, error } = await supabase
                        .from('corporate_investor_reports')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setReports(
                            data.map((item: any) => ({
                                id: item.id,
                                report_period: item.report_period,
                                report_title: item.report_title,
                                category: item.category,
                                total_revenue_idr: Number(item.total_revenue_idr || 0),
                                nickel_ore_wmt: Number(item.nickel_ore_wmt || item.coal_sales_ton || 0),
                                average_grade_ni: Number(item.average_grade_ni || 1.8),
                                rkab_compliance_status: item.rkab_compliance_status || item.status_publication || 'Sesuai Kuota RKAB',
                                author_executive: item.author_executive || 'Direksi PT. Jangkar Energi Eka Perkasa',
                            }))
                        )
                    } else {
                        setReports([
                            {
                                id: '1',
                                report_period: 'Kuartal I - 2026',
                                report_title: 'Laporan Konsolidasi Penjualan Ore Nikel Saprolite & Finansial Q1 2026',
                                category: 'Kinerja Produksi & Pengapalan Ore',
                                total_revenue_idr: 64500000000,
                                nickel_ore_wmt: 135000,
                                average_grade_ni: 1.82,
                                rkab_compliance_status: 'Sesuai Kuota RKAB',
                                author_executive: 'Direktur Utama PT. Jangkar Energi Eka Perkasa',
                            },
                            {
                                id: '2',
                                report_period: 'Tahunan 2025',
                                report_title: 'Laporan Tahunan Realisasi RKAB ESDM, Reklamasi Lahan, & Dividen FY 2025',
                                category: 'Kepatuhan RKAB & ESG Tambang',
                                total_revenue_idr: 248000000000,
                                nickel_ore_wmt: 520000,
                                average_grade_ni: 1.76,
                                rkab_compliance_status: 'Audit Selesai (Clear & Clean)',
                                author_executive: 'Dewan Komisaris & Direksi PT. Jangkar Energi Eka Perkasa',
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

        initInvestor()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddReport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reportTitle) return

        setSubmitting(true)

        const payload = {
            report_period: reportPeriod,
            report_title: reportTitle,
            category,
            total_revenue_idr: parseFloat(totalRevenueIdr) || 0,
            nickel_ore_wmt: parseFloat(nickelOreWmt) || 0,
            average_grade_ni: parseFloat(averageGradeNi) || 1.8,
            rkab_compliance_status: rkabComplianceStatus,
            author_executive: authorExecutive || userName,
        }

        const { data, error } = await supabase
            .from('corporate_investor_reports')
            .insert([payload])
            .select()

        if (!error && data) {
            setReports([data[0], ...reports])
            setShowModal(false)
            setReportTitle('')
        } else {
            setReports([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...reports,
            ])
            setShowModal(false)
            setReportTitle('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalReportsCount = reports.length
    const totalRevenueAll = reports.reduce((acc, curr) => acc + Number(curr.total_revenue_idr || 0), 0)
    const totalOreAll = reports.reduce((acc, curr) => acc + Number(curr.nickel_ore_wmt || 0), 0)
    const avgGradeOverall = reports.length > 0
        ? (reports.reduce((acc, curr) => acc + Number(curr.average_grade_ni || 0), 0) / reports.length).toFixed(2)
        : '1.78'

    const filteredReports = reports.filter((item) =>
        (item?.report_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.report_period || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.author_executive || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.rkab_compliance_status || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">Memuat Laporan Hubungan Investor PT. Jangkar Energi Eka Perkasa...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">📊</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Hubungan Investor & Laporan Korporat PT. Jangkar Energi Eka Perkasa
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Transparansi Kinerja Finansial, Penjualan Ore Nikel, & Kepatuhan RKAB ESDM</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                                    {userRole}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/"
                            className="bg-[#102033] hover:bg-[#162b45] border border-[#1e3757] text-slate-300 text-xs px-3 py-2 rounded-lg transition"
                        >
                            ← Beranda Portal
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                        >
                            Keluar
                        </button>
                    </div>
                </div>

                {authorizedNavItems.length > 1 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        {authorizedNavItems.map((item) => {
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
                ) : (
                    <div className="bg-[#0a1625]/60 border border-[#1b2e46] rounded-lg px-4 py-2 text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>Akses Terbatas: Menampilkan modul berizin untuk divisi Anda.</span>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Publikasi Korporat</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalReportsCount} Laporan</div>
                    <p className="mt-2 text-[11px] text-slate-400">Arsip Resmi Direksi & Investor</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Akumulasi Pendapatan</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        Rp {(totalRevenueAll / 1000000000).toFixed(1)} Miliar
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Total Revenue Penjualan Nikel</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Penjualan Ore Nikel</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                        {totalOreAll.toLocaleString('id-ID')} WMT
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Rata-rata Kadar: <strong className="text-cyan-400">{avgGradeOverall}% Ni</strong></p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kepatuhan Kuota RKAB ESDM</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">Terverifikasi MOMS</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Kuota IUP-OP & Royalti Terpenuhi</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari periode, judul laporan, status RKAB..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Terbitkan Laporan Korporat Nikel
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Periode</th>
                                <th className="pb-2">Judul Publikasi Laporan</th>
                                <th className="pb-2">Kategori Laporan</th>
                                <th className="pb-2 text-right">Pendapatan (IDR)</th>
                                <th className="pb-2 text-right">Penjualan Ore (WMT)</th>
                                <th className="pb-2 text-center">Kadar Ni</th>
                                <th className="pb-2 text-center">Status Kuota RKAB</th>
                                <th className="pb-2">Otorisasi Eksekutif</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((r) => (
                                    <tr key={r.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-3 font-bold font-mono text-amber-400">{r.report_period}</td>
                                        <td className="font-semibold text-white">{r.report_title}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {r.category}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono font-bold text-emerald-400">
                                            Rp {Number(r.total_revenue_idr).toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-right font-mono text-slate-200">
                                            {Number(r.nickel_ore_wmt).toLocaleString('id-ID')} WMT
                                        </td>
                                        <td className="text-center font-mono font-bold text-cyan-400">
                                            {r.average_grade_ni}%
                                        </td>
                                        <td className="text-center">
                                            <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                                                {r.rkab_compliance_status}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{r.author_executive}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada laporan investor tambang nikel yang cocok dengan kata kunci.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Publikasi Laporan Tambang Nikel PT. Jangkar Energi Eka Perkasa
                        </h2>
                        <form onSubmit={handleAddReport} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Periode Laporan</label>
                                    <input
                                        type="text"
                                        required
                                        value={reportPeriod}
                                        onChange={(e) => setReportPeriod(e.target.value)}
                                        placeholder="Contoh: Kuartal II - 2026"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Kinerja Produksi & Pengapalan Ore">Kinerja Produksi & Pengapalan Ore</option>
                                        <option value="Kepatuhan RKAB & ESG Tambang">Kepatuhan RKAB & ESG Tambang</option>
                                        <option value="RUPS & Pembagian Dividen">RUPS & Pembagian Dividen</option>
                                        <option value="Eksplorasi Cadangan Nikel">Eksplorasi Cadangan Nikel</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Judul Publikasi Laporan</label>
                                <input
                                    type="text"
                                    required
                                    value={reportTitle}
                                    onChange={(e) => setReportTitle(e.target.value)}
                                    placeholder="Contoh: Laporan Pengapalan Ore Saprolite & Rekap Keuangan Q2 2026"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Pendapatan (IDR)</label>
                                    <input
                                        type="number"
                                        required
                                        value={totalRevenueIdr}
                                        onChange={(e) => setTotalRevenueIdr(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Volume Ore (WMT)</label>
                                    <input
                                        type="number"
                                        required
                                        value={nickelOreWmt}
                                        onChange={(e) => setNickelOreWmt(e.target.value)}
                                        placeholder="145000"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Rata-rata Kadar Ni (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={averageGradeNi}
                                        onChange={(e) => setAverageGradeNi(e.target.value)}
                                        placeholder="1.78"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Kepatuhan RKAB</label>
                                    <select
                                        value={rkabComplianceStatus}
                                        onChange={(e) => setRkabComplianceStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Sesuai Kuota RKAB">Sesuai Kuota RKAB</option>
                                        <option value="Pengajuan Revisi Kuota">Pengajuan Revisi Kuota</option>
                                        <option value="Verifikasi Inspektur Tambang">Verifikasi Inspektur Tambang</option>
                                        <option value="Audit Selesai (Clear & Clean)">Audit Selesai (Clear & Clean)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 blockนิ">Otorisasi Direksi / IR</label>
                                    <input
                                        type="text"
                                        required
                                        value={authorExecutive}
                                        onChange={(e) => setAuthorExecutive(e.target.value)}
                                        placeholder="Nama Direksi / PIC"
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
                                    {submitting ? 'Memublikasikan...' : 'Publikasikan Laporan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}