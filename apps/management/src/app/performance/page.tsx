'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface PerformanceItem {
    id: string
    created_at?: string
    employee_name: string
    department: string
    review_period: string
    productivity_score: number
    safety_score: number
    final_grade: string
    evaluator_name: string
}

export default function PerformanceManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('HRD Performance Supervisor')
    const [reviews, setReviews] = useState<PerformanceItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Review Baru
    const [showModal, setShowModal] = useState(false)
    const [employeeName, setEmployeeName] = useState('')
    const [department, setDepartment] = useState('Produksi Pit')
    const [reviewPeriod, setReviewPeriod] = useState('Semester I - 2026')
    const [productivityScore, setProductivityScore] = useState('90.0')
    const [safetyScore, setSafetyScore] = useState('95.0')
    const [finalGrade, setFinalGrade] = useState('A')
    const [evaluatorName, setEvaluatorName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initPerformance() {
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
                    setUserName(profile?.full_name || 'HRD & Manpower Superintendent')

                    const { data, error } = await supabase
                        .from('employee_performance_reviews')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setReviews(data)
                    } else {
                        setReviews([
                            {
                                id: '1',
                                employee_name: 'Budi Santoso',
                                department: 'Produksi Pit',
                                review_period: 'Semester I - 2026',
                                productivity_score: 92.5,
                                safety_score: 96.0,
                                final_grade: 'A',
                                evaluator_name: 'Mine Operation Manager',
                            },
                            {
                                id: '2',
                                employee_name: 'Joko Widodo',
                                department: 'Plant & Workshop',
                                review_period: 'Semester I - 2026',
                                productivity_score: 88.0,
                                safety_score: 90.0,
                                final_grade: 'B',
                                evaluator_name: 'Plant Superintendent',
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

        initPerformance()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeName) return

        setSubmitting(true)

        const payload = {
            employee_name: employeeName,
            department,
            review_period: reviewPeriod,
            productivity_score: parseFloat(productivityScore) || 85.0,
            safety_score: parseFloat(safetyScore) || 90.0,
            final_grade: finalGrade,
            evaluator_name: evaluatorName || userName,
        }

        const { data, error } = await supabase
            .from('employee_performance_reviews')
            .insert([payload])
            .select()

        if (!error && data) {
            setReviews([data[0], ...reviews])
            setShowModal(false)
            setEmployeeName('')
        } else {
            alert('Gagal menyimpan penilaian: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalReviews = reviews.length
    const avgProductivity = totalReviews > 0
        ? (reviews.reduce((acc, curr) => acc + Number(curr.productivity_score || 0), 0) / totalReviews).toFixed(1)
        : '0.0'

    const filteredReviews = reviews.filter((item) =>
        item.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.review_period.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.evaluator_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/performance', label: 'Kinerja Karyawan', icon: '⭐' },
        { href: '/investor', label: 'Investor', icon: '📈' },
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
                <p className="text-xs text-slate-400">Sinkronisasi Penilaian Kinerja Karyawan...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">⭐</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Penilaian Kinerja Karyawan PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Evaluasi Produktivitas, Kepatuhan K3, & Grade Penilaian Kru Site</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    HRD Dept
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

            {/* KPI Kinerja */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Karyawan Dievaluasi</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalReviews} Orang</div>
                    <p className="mt-2 text-[11px] text-slate-400">Pencatatan Penilaian Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-Rata Produktivitas</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{avgProductivity} / 100</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Standar Kinerja Unggul</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grade A (Excellent)</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                        {reviews.filter((r) => r.final_grade === 'A').length} Karyawan
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Memenuhi Target Tertinggi</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status Penilaian HRD</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">Tervalidasi</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Sesuai Standar Kompetensi</p>
                </div>
            </div>

            {/* Grid Tabel Kinerja */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama karyawan, departemen, periode..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Tambah Penilaian Kinerja Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nama Karyawan</th>
                                <th className="pb-2">Departemen</th>
                                <th className="pb-2">Periode Review</th>
                                <th className="pb-2 text-right">Produktivitas</th>
                                <th className="pb-2 text-right">Kepatuhan K3</th>
                                <th className="pb-2 text-center">Grade</th>
                                <th className="pb-2">Atasan Penilai</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredReviews.length > 0 ? (
                                filteredReviews.map((r) => (
                                    <tr key={r.id}>
                                        <td className="py-2.5 font-bold text-white">{r.employee_name}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {r.department}
                                            </span>
                                        </td>
                                        <td className="font-mono text-slate-300 text-[11px]">{r.review_period}</td>
                                        <td className="text-right font-mono font-bold text-emerald-400">
                                            {Number(r.productivity_score).toFixed(1)}
                                        </td>
                                        <td className="text-right font-mono font-bold text-amber-400">
                                            {Number(r.safety_score).toFixed(1)}
                                        </td>
                                        <td className="text-center font-bold">
                                            <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded">
                                                GRADE {r.final_grade}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{r.evaluator_name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data penilaian yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Penilaian Kinerja */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tambah Penilaian Kinerja Karyawan</h2>
                        <form onSubmit={handleAddReview} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Karyawan</label>
                                <input
                                    type="text"
                                    required
                                    value={employeeName}
                                    onChange={(e) => setEmployeeName(e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Departemen</label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Produksi Pit">Produksi Pit</option>
                                        <option value="Plant & Workshop">Plant & Workshop</option>
                                        <option value="HSE & K3">HSE & K3</option>
                                        <option value="General Affair">General Affair</option>
                                        <option value="Finance & ADM">Finance & ADM</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Periode Review</label>
                                    <input
                                        type="text"
                                        required
                                        value={reviewPeriod}
                                        onChange={(e) => setReviewPeriod(e.target.value)}
                                        placeholder="Semester I - 2026"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Skor Produktivitas (0-100)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={productivityScore}
                                        onChange={(e) => setProductivityScore(e.target.value)}
                                        placeholder="90.0"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Skor Kepatuhan K3 (0-100)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={safetyScore}
                                        onChange={(e) => setSafetyScore(e.target.value)}
                                        placeholder="95.0"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Grade Akhir</label>
                                    <select
                                        value={finalGrade}
                                        onChange={(e) => setFinalGrade(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="A">Grade A (Excellent)</option>
                                        <option value="B">Grade B (Good)</option>
                                        <option value="C">Grade C (Needs Improvement)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Atasan Penilai</label>
                                    <input
                                        type="text"
                                        required
                                        value={evaluatorName}
                                        onChange={(e) => setEvaluatorName(e.target.value)}
                                        placeholder="Nama supervisor"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Penilaian'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}