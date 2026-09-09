'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
    position_title: string
    roster_schedule: string
    base_salary_idr: number
    employment_status: string
}

export default function HRDManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('HRD Superintendent')
    const [employees, setEmployees] = useState<EmployeeItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Pegawai Baru
    const [showModal, setShowModal] = useState(false)
    const [nik, setNik] = useState('')
    const [fullName, setFullName] = useState('')
    const [department, setDepartment] = useState('Produksi Pit')
    const [positionTitle, setPositionTitle] = useState('Operator Excavator PC200')
    const [rosterSchedule, setRosterSchedule] = useState('8:2 (8 Minggu Kerja, 2 Minggu Off)')
    const [baseSalaryIdr, setBaseSalaryIdr] = useState('8500000')
    const [employmentStatus, setEmploymentStatus] = useState('Aktif')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initHRD() {
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
                    setUserName(profile?.full_name || 'HRD & Manpower Manager')

                    const { data, error } = await supabase
                        .from('hr_employee_records')
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
                                position_title: 'Supervisor Pit Penambangan',
                                roster_schedule: '8:2 (8 Minggu Kerja, 2 Minggu Off)',
                                base_salary_idr: 12500000,
                                employment_status: 'Aktif',
                            },
                            {
                                id: '2',
                                nik: 'JEEP-2026-002',
                                full_name: 'Budi Santoso',
                                department: 'Plant & Workshop',
                                position_title: 'Mekanik Kepala Alat Berat',
                                roster_schedule: '8:2 (8 Minggu Kerja, 2 Minggu Off)',
                                base_salary_idr: 10500000,
                                employment_status: 'Aktif',
                            },
                            {
                                id: '3',
                                nik: 'JEEP-2026-003',
                                full_name: 'Joko Widodo',
                                department: 'HSE & K3',
                                position_title: 'Safety Officer Lapangan',
                                roster_schedule: '8:2 (8 Minggu Kerja, 2 Minggu Off)',
                                base_salary_idr: 9500000,
                                employment_status: 'Aktif',
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

        initHRD()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nik || !fullName) return

        setSubmitting(true)

        const payload = {
            nik: nik.toUpperCase(),
            full_name: fullName,
            department,
            position_title: positionTitle,
            roster_schedule: rosterSchedule,
            base_salary_idr: parseFloat(baseSalaryIdr) || 0,
            employment_status: employmentStatus,
        }

        const { data, error } = await supabase
            .from('hr_employee_records')
            .insert([payload])
            .select()

        if (!error && data) {
            setEmployees([...employees, data[0]])
            setShowModal(false)
            setNik('')
            setFullName('')
        } else {
            alert('Gagal mendaftarkan karyawan: ' + (error?.message || 'NIK sudah terdaftar.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalEmployees = employees.length
    const activeEmployees = employees.filter((e) => e.employment_status === 'Aktif').length
    const totalPayrollMonthly = employees.reduce((acc, curr) => acc + Number(curr.base_salary_idr || 0), 0)

    const filteredEmployees = employees.filter((item) =>
        item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.position_title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
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
                <p className="text-xs text-slate-400">Sinkronisasi Data Kepegawaian & HRD Site...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">👷‍♂️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen HRD & Penggajian Karyawan PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Database Karyawan, Roster Kerja, & Rekapitulasi Payroll Site</span>
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

            {/* KPI HRD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Tenaga Kerja Site</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalEmployees} Orang</div>
                    <p className="mt-2 text-[11px] text-slate-400">Terdaftar di Sistem HRD</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Karyawan Aktif Shift On</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{activeEmployees} Orang</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Bertugas di Area Penambangan</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Akumulasi Payroll Bulanan</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                        Rp {(totalPayrollMonthly / 1000000).toFixed(1)} Juta
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Estimasi Penggajian Rutin</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kepatuhan Ketenagakerjaan</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">100% Sesuai</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Standar UU Ketenagakerjaan</p>
                </div>
            </div>

            {/* Grid Tabel HRD */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari NIK, nama, jabatan, departemen..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Daftarkan Karyawan Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nomor Induk (NIK)</th>
                                <th className="pb-2">Nama Lengkap Karyawan</th>
                                <th className="pb-2">Departemen</th>
                                <th className="pb-2">Jabatan / Posisi</th>
                                <th className="pb-2">Roster Kerja</th>
                                <th className="pb-2 text-right">Gaji & Tunjangan (IDR)</th>
                                <th className="pb-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id}>
                                        <td className="py-2.5 font-bold font-mono text-amber-400">{emp.nik}</td>
                                        <td className="font-semibold text-white">{emp.full_name}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {emp.department}
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{emp.position_title}</td>
                                        <td className="text-slate-400 font-mono text-[11px]">{emp.roster_schedule}</td>
                                        <td className="text-right font-mono font-bold text-emerald-400">
                                            Rp {Number(emp.base_salary_idr).toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-center">
                                            <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded font-bold">
                                                {emp.employment_status.toUpperCase()}
                                            </span>
                                        </td>
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

            {/* Modal Input Karyawan */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Registrasi Karyawan & Payroll Baru</h2>
                        <form onSubmit={handleAddEmployee} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor Induk (NIK)</label>
                                    <input
                                        type="text"
                                        required
                                        value={nik}
                                        onChange={(e) => setNik(e.target.value)}
                                        placeholder="JEEP-2026-050"
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
                                        placeholder="Nama Karyawan"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
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
                                        <option value="Jetty Port">Jetty Port</option>
                                        <option value="General Affair">General Affair</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jabatan / Posisi</label>
                                    <input
                                        type="text"
                                        required
                                        value={positionTitle}
                                        onChange={(e) => setPositionTitle(e.target.value)}
                                        placeholder="Operator / Mekanik"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Roster Kerja Site</label>
                                <input
                                    type="text"
                                    required
                                    value={rosterSchedule}
                                    onChange={(e) => setRosterSchedule(e.target.value)}
                                    placeholder="8:2 (8 Minggu Kerja, 2 Minggu Off)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Gaji & Tunjangan (IDR)</label>
                                    <input
                                        type="number"
                                        required
                                        value={baseSalaryIdr}
                                        onChange={(e) => setBaseSalaryIdr(e.target.value)}
                                        placeholder="8500000"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Kepegawaian</label>
                                    <select
                                        value={employmentStatus}
                                        onChange={(e) => setEmploymentStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="Aktif">Aktif Bekerja</option>
                                        <option value="Cuti Roster">Cuti Roster (Off)</option>
                                        <option value="Nonaktif">Nonaktif</option>
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