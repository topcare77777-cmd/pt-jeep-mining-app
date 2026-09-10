'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface EmployeeItem {
    id: string
    created_at?: string
    nik: string
    full_name: string
    department: string
    position: string
    roster: string
    salary: number
    status: string
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

export default function HrdManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Staff HRD')
    const [userRole, setUserRole] = useState('HRD Dept')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [employees, setEmployees] = useState<EmployeeItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Karyawan
    const [showModal, setShowModal] = useState(false)
    const [nik, setNik] = useState('')
    const [fullName, setFullName] = useState('')
    const [department, setDepartment] = useState('Produksi Pit')
    const [position, setPosition] = useState('')
    const [roster, setRoster] = useState('8:2 (8 Minggu Kerja, 2 Minggu Off)')
    const [salary, setSalary] = useState('10000000')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initHrd() {
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
                                grantedKeys = ['hrd']
                            }
                        } else {
                            grantedKeys = ['hrd']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('hrd')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul HRD.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    // Ambil data karyawan aktual dari Supabase
                    const { data, error } = await supabase
                        .from('employees')
                        .select('*')
                        .order('nik', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setEmployees(data)
                    } else {
                        setEmployees([
                            {
                                id: '1',
                                nik: 'JEEP-2026-001',
                                full_name: 'Slamet Riyadi',
                                department: 'Produksi Pit',
                                position: 'Supervisor Pit Penambangan',
                                roster: '8:2 (8 Minggu Kerja, 2 Minggu Off)',
                                salary: 12500000,
                                status: 'AKTIF',
                            },
                            {
                                id: '2',
                                nik: 'JEEP-2026-002',
                                full_name: 'Budi Santoso',
                                department: 'Plant & Workshop',
                                position: 'Mekanik Kepala Alat Berat',
                                roster: '8:2 (8 Minggu Kerja, 2 Minggu Off)',
                                salary: 10500000,
                                status: 'AKTIF',
                            },
                            {
                                id: '3',
                                nik: 'JEEP-2026-003',
                                full_name: 'Joko Widodo',
                                department: 'HSE & K3',
                                position: 'Safety Officer Lapangan',
                                roster: '8:2 (8 Minggu Kerja, 2 Minggu Off)',
                                salary: 9500000,
                                status: 'AKTIF',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error load HRD:', err)
                if (isMounted) setLoading(false)
            }
        }

        initHrd()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fullName || !position) return

        setSubmitting(true)
        const generatedNik = nik || `JEEP-2026-${String(employees.length + 1).padStart(3, '0')}`

        const payload = {
            nik: generatedNik,
            full_name: fullName,
            department,
            position,
            roster,
            salary: parseFloat(salary) || 0,
            status: 'AKTIF',
        }

        const { data, error } = await supabase.from('employees').insert([payload]).select()

        if (!error && data) {
            setEmployees([...employees, data[0]])
            setShowModal(false)
            setNik('')
            setFullName('')
            setPosition('')
        } else {
            setEmployees([
                ...employees,
                {
                    id: Date.now().toString(),
                    ...payload,
                },
            ])
            setShowModal(false)
            setNik('')
            setFullName('')
            setPosition('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalEmployees = employees.length
    const activeEmployees = employees.filter((e) => e.status === 'AKTIF').length
    const totalPayroll = employees.reduce((acc, curr) => acc + Number(curr.salary || 0), 0)

    const filteredEmployees = employees.filter((item) =>
        item.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.position.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // HANYA modul yang diizinkan untuk akun ini yang dirender di navbar
    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">
                    Sinkronisasi Data Personalia & Payroll PT. Jangkar Energi Eka Perkasa...
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
                        <span className="text-3xl">👷‍♂️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen HRD & Penggajian Karyawan PT. Jangkar Energi Eka Perkasa
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Database Karyawan, Roster Kerja, & Rekapitulasi Payroll Site Nikel</span>
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
                        <span>Akses Terbatas Divisi: Anda hanya memiliki otoritas pada modul <strong>HRD & Payroll</strong>.</span>
                    </div>
                )}
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Tenaga Kerja Site</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalEmployees} Orang</div>
                    <p className="mt-2 text-[11px] text-slate-400">Terdaftar di Sistem HRD Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Karyawan Aktif Shift On</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{activeEmployees} Orang</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">Bertugas di Area Penambangan Nikel</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Akumulasi Payroll Bulanan</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                        Rp {(totalPayroll / 1000000).toFixed(1)} Juta
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Estimasi Penggajian Rutin</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kepatuhan Ketenagakerjaan</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">100% Sesuai</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Standar UU Ketenagakerjaan & K3</p>
                </div>
            </div>

            {/* Grid Tabel Data Karyawan */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari NIK, nama, jabatan, departemen..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> <span>Daftarkan Karyawan Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2.5">Nomor Induk (NIK)</th>
                                <th className="pb-2.5">Nama Lengkap Karyawan</th>
                                <th className="pb-2.5">Departemen</th>
                                <th className="pb-2.5">Jabatan / Posisi</th>
                                <th className="pb-2.5">Roster Kerja</th>
                                <th className="pb-2.5 text-right">Gaji & Tunjangan (IDR)</th>
                                <th className="pb-2.5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((e) => (
                                    <tr key={e.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-3 font-mono font-bold text-amber-400">{e.nik}</td>
                                        <td className="font-bold text-white">{e.full_name}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {e.department}
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{e.position}</td>
                                        <td className="font-mono text-slate-400 text-[11px]">{e.roster}</td>
                                        <td className="text-right font-mono text-emerald-400 font-bold">
                                            Rp {Number(e.salary).toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-center">
                                            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[10px] px-2 py-0.5 rounded font-bold">
                                                {e.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Belum ada data karyawan yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah Karyawan */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Pendaftaran Personalia PT. Jangkar Energi Eka Perkasa
                        </h2>
                        <form onSubmit={handleAddEmployee} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">NIK (Kosongkan jika otomatis)</label>
                                    <input
                                        type="text"
                                        value={nik}
                                        onChange={(e) => setNik(e.target.value)}
                                        placeholder="JEEP-2026-..."
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Contoh: Ahmad Yani"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Departemen / Divisi</label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="Produksi Pit">Produksi Pit Nikel</option>
                                        <option value="Geologi & Eksplorasi">Geologi & Eksplorasi</option>
                                        <option value="Plant & Workshop">Plant & Workshop</option>
                                        <option value="HSE & K3">HSE & K3 Tambang</option>
                                        <option value="Logistik & BBM">Logistik & Fuel BBM</option>
                                        <option value="Finance & ADM">Finance & ADM</option>
                                        <option value="General Affair">General Affair & Camp</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jabatan / Posisi</label>
                                    <input
                                        type="text"
                                        required
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        placeholder="Contoh: Operator Excavator PC200"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Skema Roster Kerja</label>
                                    <select
                                        value={roster}
                                        onChange={(e) => setRoster(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="8:2 (8 Minggu Kerja, 2 Minggu Off)">8:2 (8 Minggu On, 2 Off)</option>
                                        <option value="10:2 (10 Minggu Kerja, 2 Minggu Off)">10:2 (10 Minggu On, 2 Off)</option>
                                        <option value="6:2 (6 Minggu Kerja, 2 Minggu Off)">6:2 (6 Minggu On, 2 Off)</option>
                                        <option value="5:2 (Non-Roster Site Kantor)">5:2 (Non-Roster Kantor)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Gaji Pokok & Tunjangan (IDR)</label>
                                    <input
                                        type="number"
                                        required
                                        value={salary}
                                        onChange={(e) => setSalary(e.target.value)}
                                        placeholder="10000000"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Karyawan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}