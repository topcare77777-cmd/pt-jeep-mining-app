'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Employee {
    id: string
    created_at?: string
    nik: string
    full_name: string
    position: string
    department: string
    status: string
    phone?: string
}

export default function HrdDashboard() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas HRD')
    const [activeTab, setActiveTab] = useState('karyawan')
    const [employees, setEmployees] = useState<Employee[]>([])

    // Modal Input Personil Baru
    const [showModal, setShowModal] = useState(false)
    const [nik, setNik] = useState('')
    const [fullName, setFullName] = useState('')
    const [position, setPosition] = useState('')
    const [department, setDepartment] = useState('Operasional Pit')
    const [status, setStatus] = useState('Aktif (Site)')
    const [phone, setPhone] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initHrd() {
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
                            refreshToken: refreshToken || '',
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
                    setUserName(profile?.full_name || 'HRD & K3 Coordinator')

                    const { data: empData, error } = await supabase
                        .from('hrd_employees')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && empData && empData.length > 0) {
                        setEmployees(empData)
                    } else {
                        setEmployees([
                            {
                                id: '1',
                                nik: 'JP-2026-088',
                                full_name: 'Bambang Supriyanto',
                                position: 'Operator Excavator PC-400',
                                department: 'Operasional Pit',
                                status: 'Aktif (Site)',
                                phone: '081234567890',
                            },
                            {
                                id: '2',
                                nik: 'JP-2026-042',
                                full_name: 'Rian Hidayat',
                                position: 'Safety Officer / HSE',
                                department: 'K3 & Lingkungan',
                                status: 'Aktif (Site)',
                                phone: '082198765432',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error HRD init:', err)
                if (isMounted) setLoading(false)
            }
        }

        initHrd()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fullName || !position) return

        setSubmitting(true)

        const generatedNik = nik || `JP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`

        const payload = {
            nik: generatedNik,
            full_name: fullName,
            position,
            department,
            status,
            phone,
        }

        const { data, error } = await supabase
            .from('hrd_employees')
            .insert([payload])
            .select()

        if (!error && data) {
            setEmployees([data[0], ...employees])
            setShowModal(false)
            setNik('')
            setFullName('')
            setPosition('')
            setPhone('')
        } else {
            alert('Gagal mendaftarkan personil: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Personil & HSE Site...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Bar */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 mb-6 shadow-xl">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">👷‍♂️</span>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                            Dashboard Human Resources & HSE (K3) PT. JEEP
                        </h1>
                        <p className="text-xs text-sky-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Manpower Management & Jam Kerja Selamat (Zero Accident) • {userName}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                    Keluar ke Beranda
                </button>
            </header>

            {/* Nav Tabs */}
            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'karyawan', label: 'DATA PERSONIL & CREW', badge: `${employees.length} ORANG` },
                    { id: 'k3', label: 'STATISTIK K3 & SAFETY INDUCTION', badge: 'ZERO ACCIDENT' },
                    { id: 'absensi', label: 'ROSTER & ABSENSI SHIFT', badge: '' },
                    { id: 'mcu', label: 'MEDICAL CHECK-UP (MCU)', badge: '100% FIT' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${activeTab === tab.id
                                ? 'bg-[#1b3b5f] border-sky-400 text-white shadow-lg shadow-sky-950/40'
                                : 'bg-[#0c1a2d] border-[#1b2e46] text-slate-400 hover:text-white hover:bg-[#12243d]'
                            }`}
                    >
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className="bg-sky-400 text-slate-950 text-[10px] px-1.5 py-0.5 rounded font-black">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Konten Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Action Bar */}
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-sky-500/50 bg-sky-950/20 hover:bg-sky-900/30 text-sky-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Daftarkan Personil Baru</div>
                            <div className="text-[10px] text-slate-400">Operator, Driver, Mekanik, HSE</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#16273c] bg-[#0a1625] text-slate-400 space-y-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Database Personil</span>
                        <div className="text-[11px] flex justify-between">
                            <span>Tabel Supabase</span>
                            <span className="text-sky-400 font-semibold">hrd_employees</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Total Terdaftar</span>
                            <span className="text-slate-200 font-bold">{employees.length} personil</span>
                        </div>
                    </div>
                </aside>

                {/* Kolom Kanan: Panel Tabel */}
                <main className="lg:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jam Kerja Selamat (LTI-Free)</h3>
                            <div className="text-2xl font-black text-emerald-400">142.850 Jam</div>
                            <p className="mt-2 text-[11px] text-emerald-400 font-semibold">✓ Zero Fatal Accident Tercapai</p>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Manpower Site</h3>
                            <div className="text-2xl font-black text-white">{employees.length} Orang</div>
                            <p className="mt-2 text-[11px] text-slate-400">Termasuk Kontraktor & Kru Pit</p>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kebugaran Kerja (Fit To Work)</h3>
                            <div className="text-2xl font-black text-sky-400">100% Fit</div>
                            <p className="mt-2 text-[11px] text-sky-400 font-medium">Daily Fatigue Check Selesai</p>
                        </div>
                    </div>

                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Daftar Personil & Tenaga Kerja Site (Live Supabase)
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-sky-500 hover:bg-sky-600 text-slate-950 text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                                + Registrasi Personil
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">NIK</th>
                                        <th className="pb-2">Nama Lengkap</th>
                                        <th className="pb-2">Jabatan / Posisi</th>
                                        <th className="pb-2">Departemen</th>
                                        <th className="pb-2">Kontak</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {employees.map((emp) => (
                                        <tr key={emp.id}>
                                            <td className="py-2.5 font-mono text-sky-400 font-bold">{emp.nik}</td>
                                            <td className="font-semibold text-white">{emp.full_name}</td>
                                            <td>{emp.position}</td>
                                            <td className="text-slate-400">{emp.department}</td>
                                            <td className="text-slate-400 font-mono">{emp.phone || '-'}</td>
                                            <td>
                                                <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-medium">
                                                    {emp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Pendaftaran Personil */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Registrasi Tenaga Kerja Tambang</h2>
                        <form onSubmit={handleAddEmployee} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">NIK Perusahaan (Opsional)</label>
                                <input
                                    type="text"
                                    value={nik}
                                    onChange={(e) => setNik(e.target.value)}
                                    placeholder="Otomatis diisi jika kosong"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Contoh: Joko Widodo"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Jabatan / Posisi Kerja</label>
                                <input
                                    type="text"
                                    required
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="Contoh: Operator Dozer D85 / Pengawas Pit"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Departemen</label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                    >
                                        <option value="Operasional Pit">Operasional Pit</option>
                                        <option value="Hauling & Port">Hauling & Port</option>
                                        <option value="K3 & Lingkungan">K3 & Lingkungan (HSE)</option>
                                        <option value="Plant & Maintenance">Plant & Maintenance</option>
                                        <option value="Finance & ADM">Finance & ADM</option>
                                        <option value="General Affair">General Affair (GA)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Karyawan</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                    >
                                        <option value="Aktif (Site)">Aktif (Site)</option>
                                        <option value="Roster Off / Cuti">Roster Off / Cuti</option>
                                        <option value="Training">Training / Induksi</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nomor HP / WhatsApp</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0812xxxxxxxx"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400 font-mono"
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
                                    className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Personil'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}