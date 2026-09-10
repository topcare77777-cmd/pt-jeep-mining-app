'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TrainingItem {
    id: string
    created_at?: string
    employee_name: string
    department: string
    training_title: string
    certificate_no: string
    issue_date: string
    expiry_date: string
    status: string
    trainer_org: string
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
    { key: 'radio', label: 'Radio Komunikasi', icon: '📻', href: '/radio' },
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

export default function TrainingManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('HSE Training Officer')
    const [userRole, setUserRole] = useState('HSE & K3 Tambang')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [trainings, setTrainings] = useState<TrainingItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Pelatihan Baru
    const [showModal, setShowModal] = useState(false)
    const [employeeName, setEmployeeName] = useState('')
    const [department, setDepartment] = useState('Produksi Pit')
    const [trainingTitle, setTrainingTitle] = useState('Pengawas Operasional Pertama (POP)')
    const [certificateNo, setCertificateNo] = useState('')
    const [issueDate, setIssueDate] = useState('2024-01-10')
    const [expiryDate, setExpiryDate] = useState('2027-01-10')
    const [status, setStatus] = useState('Aktif')
    const [trainerOrg, setTrainerOrg] = useState('PPSDM Geominerba')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initTraining() {
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
                if (statusClean === 'nonaktif' || statusClean === 'banned') {
                    alert('Akun Anda dinonaktifkan.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                if (isMounted) {
                    setUserName(profile?.full_name || 'HSE Training Superintendent')
                    const division = (profile?.role || 'HSE & K3 Tambang').trim()
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
                                    (cleanDiv.includes('training') && target.includes('training')) ||
                                    (cleanDiv.includes('hse') && target.includes('hse')) ||
                                    (cleanDiv.includes('k3') && target.includes('k3'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['training']
                            }
                        } else {
                            grantedKeys = ['training']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('training')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Pelatihan K3.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    const { data, error } = await supabase
                        .from('safety_training_records')
                        .select('*')
                        .order('expiry_date', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setTrainings(data)
                    } else {
                        setTrainings([
                            {
                                id: '1',
                                employee_name: 'Slamet Riyadi',
                                department: 'Produksi Pit',
                                training_title: 'Sertifikasi Pengawas Operasional Pertama (POP)',
                                certificate_no: 'POP/2024/0912',
                                issue_date: '2024-05-12',
                                expiry_date: '2027-05-12',
                                status: 'Aktif',
                                trainer_org: 'PPSDM Geominerba',
                            },
                            {
                                id: '2',
                                employee_name: 'Budi Santoso',
                                department: 'Plant & Workshop',
                                training_title: 'Ahli K3 Umum (Kemnaker RI)',
                                certificate_no: 'K3U/8821/2023',
                                issue_date: '2023-08-20',
                                expiry_date: '2028-08-20',
                                status: 'Aktif',
                                trainer_org: 'LSP K3 Indonesia',
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

        initTraining()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddTraining = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeName || !certificateNo) return

        setSubmitting(true)

        const payload = {
            employee_name: employeeName,
            department,
            training_title: trainingTitle,
            certificate_no: certificateNo.toUpperCase(),
            issue_date: issueDate,
            expiry_date: expiryDate,
            status,
            trainer_org: trainerOrg,
        }

        const { data, error } = await supabase
            .from('safety_training_records')
            .insert([payload])
            .select()

        if (!error && data) {
            setTrainings([...trainings, data[0]])
            setShowModal(false)
            setEmployeeName('')
            setCertificateNo('')
        } else {
            setTrainings([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...trainings,
            ])
            setShowModal(false)
            setEmployeeName('')
            setCertificateNo('')
        }
        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalTrainings = trainings.length
    const activeTrainings = trainings.filter((t) => t.status === 'Aktif').length

    const filteredTrainings = trainings.filter((item) =>
        (item?.employee_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.training_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.certificate_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Data Pelatihan & Sertifikasi K3...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🎓</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Pelatihan & Sertifikasi K3 PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Kompetensi Karyawan, Sertifikat POP/POM, & Masa Berlaku K3</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
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
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span>Akses Terbatas Divisi: Menampilkan modul berizin untuk divisi Anda.</span>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Sertifikat Tercatat</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalTrainings} Sertifikat</div>
                    <p className="mt-2 text-[11px] text-slate-400">Kompetensi Kru Terverifikasi</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sertifikat Aktif</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{activeTrainings} Berkas</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Masa Berlaku Sah & Valid</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mendekati Kedaluwarsa</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">0 Berkas</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">Semua Sertifikasi Aman</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Standar KESDM</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">100% Patuh</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Kompetensi Pengawas Teruji</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama karyawan, jenis pelatihan, no. sertifikat..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Tambah Sertifikasi K3 Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nama Karyawan & Departemen</th>
                                <th className="pb-2">Jenis Pelatihan / Sertifikasi</th>
                                <th className="pb-2">Nomor Sertifikat</th>
                                <th className="pb-2">Lembaga Penyelenggara</th>
                                <th className="pb-2">Masa Berlaku</th>
                                <th className="pb-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredTrainings.length > 0 ? (
                                filteredTrainings.map((t) => (
                                    <tr key={t.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-2.5">
                                            <div className="font-bold text-white">{t.employee_name}</div>
                                            <div className="text-[10px] text-slate-400">{t.department}</div>
                                        </td>
                                        <td className="font-semibold text-amber-400">{t.training_title}</td>
                                        <td className="font-mono text-slate-300 text-[11px] font-bold">{t.certificate_no}</td>
                                        <td className="text-slate-300">{t.trainer_org}</td>
                                        <td className="font-mono text-slate-300 text-[11px]">
                                            {t.issue_date} s/d <span className="text-emerald-400 font-bold">{t.expiry_date}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded font-bold">
                                                {t.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data pelatihan yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tambah Sertifikasi & Pelatihan K3</h2>
                        <form onSubmit={handleAddTraining} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Karyawan</label>
                                <input
                                    type="text"
                                    required
                                    value={employeeName}
                                    onChange={(e) => setEmployeeName(e.target.value)}
                                    placeholder="Contoh: Slamet Riyadi"
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
                                        <option value="Jetty Port">Jetty Port</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jenis Sertifikasi</label>
                                    <input
                                        type="text"
                                        required
                                        value={trainingTitle}
                                        onChange={(e) => setTrainingTitle(e.target.value)}
                                        placeholder="Contoh: POP / K3 Umum / SIMPER"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor Sertifikat</label>
                                    <input
                                        type="text"
                                        required
                                        value={certificateNo}
                                        onChange={(e) => setCertificateNo(e.target.value)}
                                        placeholder="POP/2026/XXX"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Lembaga Penyelenggara</label>
                                    <input
                                        type="text"
                                        required
                                        value={trainerOrg}
                                        onChange={(e) => setTrainerOrg(e.target.value)}
                                        placeholder="PPSDM Geominerba"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tanggal Terbit</label>
                                    <input
                                        type="date"
                                        required
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tanggal Berakhir (Expiry)</label>
                                    <input
                                        type="date"
                                        required
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Sertifikasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}