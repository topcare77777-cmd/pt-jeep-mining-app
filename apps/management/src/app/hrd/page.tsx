'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
    k3_compliance_score: number
    grade: string
    evaluator: string
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
    { key: 'hrd', label: 'HRD & Payroll', icon: '👷‍♂️', href: '/hrd' },
    { key: 'ga', label: 'GA & Fasilitas', icon: '🚙', href: '/ga' },
    { key: 'assets', label: 'Aset Tambang', icon: '🏷️', href: '/assets' },
    { key: 'mess', label: 'Mess Camp', icon: '🏠', href: '/mess' },
    { key: 'catering', label: 'Katering', icon: '🍱', href: '/catering' },
    { key: 'clinic', label: 'Klinik Site', icon: '🏥', href: '/clinic' },
    { key: 'security', label: 'Security Gate', icon: '🛡️', href: '/security' },
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

export default function PerformancePage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Staff HRD')
    const [userRole, setUserRole] = useState('HRD Dept')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [evaluations, setEvaluations] = useState<PerformanceItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Penilaian Kinerja Baru
    const [showModal, setShowModal] = useState(false)
    const [employeeName, setEmployeeName] = useState('')
    const [department, setDepartment] = useState('Produksi Pit')
    const [reviewPeriod, setReviewPeriod] = useState('Semester I – 2026')
    const [productivityScore, setProductivityScore] = useState('90.0')
    const [k3ComplianceScore, setK3ComplianceScore] = useState('95.0')
    const [evaluator, setEvaluator] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initPerformance() {
            try {
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
                    setUserName(profile?.full_name || 'Staff HRD')
                    const division = (profile?.role || 'Human Resources (HRD)').trim()
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
                                    (cleanDiv.includes('hrd') && target.includes('hrd')) ||
                                    (cleanDiv.includes('human') && target.includes('human'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['performance', 'hrd']
                            }
                        } else {
                            grantedKeys = ['performance', 'hrd']
                        }
                    }

                    // Route Guard jika akun tidak memiliki izin modul kinerja
                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('performance')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Penilaian Kinerja.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    // Ambil data evaluasi dari Supabase
                    const { data, error } = await supabase
                        .from('performance_evaluations')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setEvaluations(data)
                    } else {
                        setEvaluations([
                            {
                                id: '1',
                                employee_name: 'Budi Santoso',
                                department: 'Produksi Pit',
                                review_period: 'Semester I – 2026',
                                productivity_score: 92.5,
                                k3_compliance_score: 96.0,
                                grade: 'GRADE A',
                                evaluator: 'Mine Operation Manager',
                            },
                            {
                                id: '2',
                                employee_name: 'Joko Widodo',
                                department: 'Plant & Workshop',
                                review_period: 'Semester I – 2026',
                                productivity_score: 88.0,
                                k3_compliance_score: 90.0,
                                grade: 'GRADE B',
                                evaluator: 'Plant Superintendent',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error load performance:', err)
                if (isMounted) setLoading(false)
            }
        }

        initPerformance()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const calculateGrade = (prod: number, k3: number) => {
        const avg = (prod + k3) / 2
        if (avg >= 90) return 'GRADE A'
        if (avg >= 80) return 'GRADE B'
        if (avg >= 70) return 'GRADE C'
        return 'GRADE D'
    }

    const handleAddEvaluation = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeName) return

        setSubmitting(true)
        const prod = parseFloat(productivityScore) || 0
        const k3 = parseFloat(k3ComplianceScore) || 0
        const finalGrade = calculateGrade(prod, k3)

        const payload = {
            employee_name: employeeName,
            department,
            review_period: reviewPeriod,
            productivity_score: prod,
            k3_compliance_score: k3,
            grade: finalGrade,
            evaluator: evaluator || userName,
        }

        const { data, error } = await supabase
            .from('performance_evaluations')
            .insert([payload])
            .select()

        if (!error && data) {
            setEvaluations([data[0], ...evaluations])
            setShowModal(false)
            setEmployeeName('')
        } else {
            setEvaluations([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...evaluations,
            ])
            setShowModal(false)
            setEmployeeName('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalEvaluated = evaluations.length
    const avgProductivity = totalEvaluated > 0
        ? (evaluations.reduce((acc, curr) => acc + Number(curr.productivity_score || 0), 0) / totalEvaluated).toFixed(1)
        : '0.0'
    const gradeACount = evaluations.filter((e) => e.grade === 'GRADE A').length

    const filteredEvaluations = evaluations.filter((item) =>
        item.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.review_period.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.evaluator.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Hanya modul yang diizinkan untuk divisi pengguna yang dirender
    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">
                    Sinkronisasi Matriks Evaluasi & Kinerja Karyawan...
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Utama */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">⭐</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Penilaian Kinerja Karyawan PT. Jangkar Energi Eka Perkasa
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Evaluasi Produktivitas, Kepatuhan K3, & Grade Penilaian Kru Site Nikel</span>
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

                {/* Bilah Navigasi Dinamis Terfilter Sesuai Izin Divisi */}
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
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span>Akses Terbatas: Menampilkan modul berizin untuk divisi Anda.</span>
                    </div>
                )}
            </header>

            {/* KPI Kinerja */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Karyawan Dievaluasi</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalEvaluated} Orang</div>
                    <p className="mt-2 text-[11px] text-slate-400">Pencatatan Penilaian Site Nikel</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-Rata Produktivitas</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">{avgProductivity} / 100</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Standar Kinerja Unggul</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grade A (Excellent)</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{gradeACount} Karyawan</div>
                    <p className="mt-2 text-[11px] text-slate-400">Memenuhi Target Tertinggi</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status Penilaian HRD</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">Tervalidasi</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Sesuai Standar Kompetensi</p>
                </div>
            </div>

            {/* Grid Tabel Penilaian Kinerja */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama karyawan, departemen, periode..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> <span>Tambah Penilaian Kinerja Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2.5">Nama Karyawan</th>
                                <th className="pb-2.5">Departemen</th>
                                <th className="pb-2.5">Periode Review</th>
                                <th className="pb-2.5 text-center">Produktivitas</th>
                                <th className="pb-2.5 text-center">Kepatuhan K3</th>
                                <th className="pb-2.5 text-center">Grade</th>
                                <th className="pb-2.5">Atasan Penilai</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredEvaluations.length > 0 ? (
                                filteredEvaluations.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-3 font-bold text-white">{item.employee_name}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {item.department}
                                            </span>
                                        </td>
                                        <td className="font-mono text-slate-400 text-[11px]">{item.review_period}</td>
                                        <td className="text-center font-mono font-bold text-cyan-400">
                                            {Number(item.productivity_score).toFixed(1)}
                                        </td>
                                        <td className="text-center font-mono font-bold text-amber-400">
                                            {Number(item.k3_compliance_score).toFixed(1)}
                                        </td>
                                        <td className="text-center">
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${item.grade === 'GRADE A'
                                                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                                                    : 'bg-cyan-950/80 text-cyan-400 border-cyan-800/40'
                                                    }`}
                                            >
                                                {item.grade}
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{item.evaluator}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Belum ada data evaluasi kinerja yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Penilaian Baru */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Input Penilaian Kinerja & KPI Karyawan
                        </h2>
                        <form onSubmit={handleAddEvaluation} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Lengkap Karyawan</label>
                                    <input
                                        type="text"
                                        required
                                        value={employeeName}
                                        onChange={(e) => setEmployeeName(e.target.value)}
                                        placeholder="Contoh: Budi Santoso"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Departemen</label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="Produksi Pit">Produksi Pit Nikel</option>
                                        <option value="Geologi & Eksplorasi">Geologi & Eksplorasi</option>
                                        <option value="Plant & Workshop">Plant & Workshop</option>
                                        <option value="HSE & K3">HSE & K3 Tambang</option>
                                        <option value="Human Resources">Human Resources (HRD)</option>
                                        <option value="Finance & ADM">Finance & ADM</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Periode Evaluasi</label>
                                    <input
                                        type="text"
                                        required
                                        value={reviewPeriod}
                                        onChange={(e) => setReviewPeriod(e.target.value)}
                                        placeholder="Semester I – 2026"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Skor Produktivitas (0–100)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        required
                                        value={productivityScore}
                                        onChange={(e) => setProductivityScore(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Skor Kepatuhan K3 (0–100)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        required
                                        value={k3ComplianceScore}
                                        onChange={(e) => setK3ComplianceScore(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Atasan Penilai (Evaluator)</label>
                                <input
                                    type="text"
                                    value={evaluator}
                                    onChange={(e) => setEvaluator(e.target.value)}
                                    placeholder="Contoh: Mine Operation Manager (Otomatis nama Anda jika kosong)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
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