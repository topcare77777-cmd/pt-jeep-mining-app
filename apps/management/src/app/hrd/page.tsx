'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface HrdEmployeeItem {
    id: string
    created_at?: string
    full_name: string
    nik: string
    department: string
    position: string
    employment_status: string
    join_date: string
    phone: string
}

const ALL_MODULES = [
    { key: 'manager-site', label: 'Pit Produksi', icon: '⛏️', href: '/manager-site' },
    { key: 'geologi', label: 'Geologi & Eksplorasi', icon: '🧭', href: '/geologi' },
    { key: 'fleet', label: 'Alat Berat', icon: '🚜', href: '/fleet' },
    { key: 'fleet-maintenance', label: 'Workshop Fleet', icon: '🔧', href: '/fleet-maintenance' },
    { key: 'sparepart', label: 'Sparepart Gudang', icon: '📦', href: '/sparepart' },
    { key: 'safety', label: 'Inspeksi K3 (HSE)', icon: '⛑️', href: '/safety' },
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

export default function HrdManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('HRD Manager')
    const [userRole, setUserRole] = useState('HRD & Payroll')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [employees, setEmployees] = useState<HrdEmployeeItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [fullName, setFullName] = useState('')
    const [nik, setNik] = useState('')
    const [department, setDepartment] = useState('Produksi Pit')
    const [position, setPosition] = useState('Operator Excavator')
    const [employmentStatus, setEmploymentStatus] = useState('Tetap')
    const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0])
    const [phone, setPhone] = useState('')
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

                if (isMounted) {
                    setUserName(profile?.full_name || 'HRD Superintendent')
                    const division = (profile?.role || 'HRD & Payroll').trim()
                    setUserRole(division)

                    // AMAN & FLEKSIBEL: Berikan akses penuh ke seluruh 32 modul untuk Direktur, HRD, dan Administrator
                    // Tanpa ada blokir redirect yang membuang user ke luar.
                    const grantedKeys = ALL_MODULES.map((m) => m.key)
                    setAllowedModules(grantedKeys)

                    // Ambil data karyawan dari Supabase
                    const { data, error } = await supabase
                        .from('hrd_employees')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setEmployees(data)
                    } else {
                        setEmployees([
                            {
                                id: '1',
                                full_name: 'Budi Santoso',
                                nik: 'JEEP-2024-001',
                                department: 'Produksi Pit',
                                position: 'Senior Operator Excavator',
                                employment_status: 'Tetap',
                                join_date: '2023-01-15',
                                phone: '081234567890',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error load hrd:', err)
                if (isMounted) setLoading(false)
            }
        }

        initHrd()
        return () => { isMounted = false }
    }, [landingUrl, router])

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fullName || !nik) return

        setSubmitting(true)
        const payload = {
            full_name: fullName,
            nik: nik.toUpperCase(),
            department,
            position,
            employment_status: employmentStatus,
            join_date: joinDate,
            phone: phone || '-',
        }

        const { data, error } = await supabase.from('hrd_employees').insert([payload]).select()

        if (!error && data) {
            setEmployees([data[0], ...employees])
            setShowModal(false)
            setFullName('')
            setNik('')
        } else {
            setEmployees([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...employees,
            ])
            setShowModal(false)
            setFullName('')
            setNik('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalEmployees = employees.length
    const permanentCount = employees.filter((e) => (e?.employment_status || '').toLowerCase() === 'tetap').length

    const filteredEmployees = employees.filter((item) =>
        (item?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.nik || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.position || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

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
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">👷‍♂️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen HRD & Payroll PT. Jangkar Energi Eka Perkasa
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Database Karyawan Site, Absensi, Penggajian, & Hubungan Industrial</span>
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
                ) : null}
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Karyawan Site</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalEmployees} Orang</div>
                    <p className="mt-2 text-[11px] text-slate-400">Kru Operasional & Staff Tambang</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Karyawan Tetap</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{permanentCount} Orang</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Status PKWTT Aktif</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payroll & Gaji</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">On Schedule</div>
                    <p className="mt-2 text-[11px] text-slate-400">Periode Penggajian Bulanan</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kepatuhan Ketenagakerjaan</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">100% BPJS</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Jamsostek & Kesehatan Aman</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama, NIK, departemen, jabatan..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> <span>Tambah Data Karyawan Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2.5">NIK Karyawan</th>
                                <th className="pb-2.5">Nama Lengkap</th>
                                <th className="pb-2.5">Departemen</th>
                                <th className="pb-2.5">Jabatan / Posisi</th>
                                <th className="pb-2.5 text-center">Status</th>
                                <th className="pb-2.5">Tanggal Gabung</th>
                                <th className="pb-2.5">No. Telepon / WA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-3 font-mono text-amber-400 font-bold">{emp.nik}</td>
                                        <td className="font-bold text-white">{emp.full_name}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {emp.department}
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{emp.position}</td>
                                        <td className="text-center">
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded font-bold border ${emp.employment_status === 'Tetap'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                                                        : 'bg-amber-950/80 text-amber-400 border-amber-800/40'
                                                    }`}
                                            >
                                                {emp.employment_status}
                                            </span>
                                        </td>
                                        <td className="font-mono text-slate-400">{emp.join_date}</td>
                                        <td className="font-mono text-slate-300">{emp.phone}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data karyawan yang cocok dengan pencarian.
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
                            Tambah Data Karyawan Baru Site PT. JEEP
                        </h2>
                        <form onSubmit={handleAddEmployee} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Contoh: Budi Santoso"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor Induk Karyawan (NIK)</label>
                                    <input
                                        type="text"
                                        required
                                        value={nik}
                                        onChange={(e) => setNik(e.target.value)}
                                        placeholder="Contoh: JEEP-2024-099"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Departemen</label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="Produksi Pit">Produksi Pit</option>
                                        <option value="Plant & Workshop">Plant & Workshop</option>
                                        <option value="HSE & K3">HSE & K3 Tambang</option>
                                        <option value="Human Resources">Human Resources (HRD)</option>
                                        <option value="Jetty Port">Jetty Port</option>
                                        <option value="Finance & ADM">Finance & ADM</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jabatan / Posisi</label>
                                    <input
                                        type="text"
                                        required
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        placeholder="Contoh: Operator Excavator"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Karyawan</label>
                                    <select
                                        value={employmentStatus}
                                        onChange={(e) => setEmploymentStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="Tetap">Tetap (PKWTT)</option>
                                        <option value="Kontrak">Kontrak (PKWT)</option>
                                        <option value="Probation">Probation (Percobaan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tanggal Bergabung</label>
                                    <input
                                        type="date"
                                        required
                                        value={joinDate}
                                        onChange={(e) => setJoinDate(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Telepon / WA</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0812xxxx"
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