'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface InvestorReport {
    id: string
    created_at?: string
    report_period: string
    report_title: string
    category: string
    total_revenue_idr: number
    coal_sales_ton: number
    status_publication: string
    author_executive: string
}

export default function InvestorManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Investor Relations Manager')
    const [reports, setReports] = useState<InvestorReport[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Laporan Korporat Baru
    const [showModal, setShowModal] = useState(false)
    const [reportPeriod, setReportPeriod] = useState('Kuartal II - 2026')
    const [reportTitle, setReportTitle] = useState('')
    const [category, setCategory] = useState('Kinerja Finansial & Produksi')
    const [totalRevenueIdr, setTotalRevenueIdr] = useState('45000000000')
    const [coalSalesTon, setCoalSalesTon] = useState('120500')
    const [statusPublication, setStatusPublication] = useState('Published')
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
                    setUserName(profile?.full_name || 'Direktur Keuangan & Investor Relations')

                    const { data, error } = await supabase
                        .from('corporate_investor_reports')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setReports(data)
                    } else {
                        setReports([
                            {
                                id: '1',
                                report_period: 'Kuartal I - 2026',
                                report_title: 'Laporan Konsolidasi Operasional & Finansial Q1 2026',
                                category: 'Kinerja Finansial & Produksi',
                                total_revenue_idr: 42500000000,
                                coal_sales_ton: 110000,
                                status_publication: 'Published',
                                author_executive: 'Direktur Utama PT. JEEP',
                            },
                            {
                                id: '2',
                                report_period: 'Tahunan 2025',
                                report_title: 'Rapat Umum Pemegang Saham (RUPS) Tahunan & Dividen FY 2025',
                                category: 'RUPS & Korporat',
                                total_revenue_idr: 165000000000,
                                coal_sales_ton: 450000,
                                status_publication: 'Published',
                                author_executive: 'Dewan Komisaris & Direksi',
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
    }, [landingUrl])

    const handleAddReport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reportTitle) return

        setSubmitting(true)

        const payload = {
            report_period: reportPeriod,
            report_title: reportTitle,
            category,
            total_revenue_idr: parseFloat(totalRevenueIdr) || 0,
            coal_sales_ton: parseFloat(coalSalesTon) || 0,
            status_publication: statusPublication,
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
            alert('Gagal menyimpan laporan investor: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalReportsCount = reports.length
    const totalRevenueAll = reports.reduce((acc, curr) => acc + Number(curr.total_revenue_idr || 0), 0)
    const totalSalesAll = reports.reduce((acc, curr) => acc + Number(curr.coal_sales_ton || 0), 0)

    const filteredReports = reports.filter((item) =>
        item.report_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.report_period.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author_executive.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/investor', label: 'Investor Relations', icon: '📈' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal', icon: '⚖️' },
        { href: '/helpdesk', label: 'Helpdesk', icon: '🛠️' },
        { href: '/assets', label: 'Aset', icon: '🏷️' },
        { href: '/mess', label: 'Mess', icon: '🏠' },
        { href: '/vendor', label: 'Vendor', icon: '🤝' },
        { href: '/radio', label: 'Radio', icon: '📻' },
        { href: '/clinic', label: 'Klinik', icon: '🏥' },
        { href: '/security', label: 'Security', icon: '🛡️' },
        { href: '/ritase', label: 'Ritase', icon: '🚛' },
        { href: '/jetty', label: 'Jetty Port', icon: '🚢' },
        { href: '/lingkungan', label: 'Lingkungan', icon: '🌱' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
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
                <p className="text-xs text-slate-400">Sinkronisasi Hubungan Investor & Laporan Korporat...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">📈</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Hubungan Investor & Laporan Korporat PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Transparansi Kinerja Finansial, Penjualan Batubara, & Dokumen RUPS</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Corporate Executive
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
                            <a
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                        ? 'bg-[#162d47] text-white border-amber-400/80 shadow-sm'
                                        : 'bg-[#0a1625] text-slate-400 border-[#1b2e46] hover:text-slate-200 hover:bg-[#0f2137]'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </a>
                        )
                    })}
                </div>
            </header>

            {/* KPI Investor */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Publikasi Korporat</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalReportsCount} Laporan</div>
                    <p className="mt-2 text-[11px] text-slate-400">Arsip Resmi Investor & RUPS</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Akumulasi Pendapatan</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        Rp {(totalRevenueAll / 1000000000).toFixed(1)} Miliar
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Total Revenue Konsolidasi</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Akumulasi Penjualan Batubara</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                        {totalSalesAll.toLocaleString('id-ID')} Ton
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Volume Penjualan Pasar</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status Investor Trust</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">Sangat Tinggi</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Transparansi Laporan Teruji</p>
                </div>
            </div>

            {/* Grid Tabel Investor */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari periode, judul laporan, kategori..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Publikasi Laporan Investor Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Periode Laporan</th>
                                <th className="pb-2">Judul Publikasi Korporat</th>
                                <th className="pb-2">Kategori</th>
                                <th className="pb-2 text-right">Total Pendapatan (IDR)</th>
                                <th className="pb-2 text-right">Penjualan Batubara</th>
                                <th className="pb-2 text-center">Status</th>
                                <th className="pb-2">Penulis / Eksekutif</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((r) => (
                                    <tr key={r.id}>
                                        <td className="py-2.5 font-bold font-mono text-amber-400">{r.report_period}</td>
                                        <td className="font-semibold text-white">{r.report_title}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {r.category}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono font-bold text-emerald-400">
                                            Rp {Number(r.total_revenue_idr).toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-right font-mono text-slate-300">
                                            {Number(r.coal_sales_ton).toLocaleString('id-ID')} Ton
                                        </td>
                                        <td className="text-center">
                                            <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                                                {r.status_publication.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{r.author_executive}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada laporan investor yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Laporan Investor */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Publikasi Laporan Hubungan Investor</h2>
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
                                        <option value="Kinerja Finansial & Produksi">Kinerja Finansial & Produksi</option>
                                        <option value="RUPS & Korporat">RUPS & Korporat</option>
                                        <option value="ESG & Keberlanjutan">ESG & Keberlanjutan</option>
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
                                    placeholder="Contoh: Laporan Kinerja Operasional Q2 2026"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Total Pendapatan (IDR)</label>
                                    <input
                                        type="number"
                                        required
                                        value={totalRevenueIdr}
                                        onChange={(e) => setTotalRevenueIdr(e.target.value)}
                                        placeholder="45000000000"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Penjualan Batubara (Ton)</label>
                                    <input
                                        type="number"
                                        required
                                        value={coalSalesTon}
                                        onChange={(e) => setCoalSalesTon(e.target.value)}
                                        placeholder="120500"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Publikasi</label>
                                    <select
                                        value={statusPublication}
                                        onChange={(e) => setStatusPublication(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Published">Published (Publik)</option>
                                        <option value="Draft">Draft (Internal)</option>
                                        <option value="Confidential">Confidential (Rahasia)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Penulis / Eksekutif</label>
                                    <input
                                        type="text"
                                        required
                                        value={authorExecutive}
                                        onChange={(e) => setAuthorExecutive(e.target.value)}
                                        placeholder="Nama Direksi / IR"
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