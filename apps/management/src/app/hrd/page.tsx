'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Employee {
    id: string
    created_at?: string
    nrp: string
    full_name: string
    position: string
    shift: string
    status: string
}

export default function HrdDashboard() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas HRD')
    const [activeTab, setActiveTab] = useState('karyawan')
    const [employees, setEmployees] = useState<Employee[]>([])

    // State Modal Tambah Karyawan / Shift
    const [showModal, setShowModal] = useState(false)
    const [nrp, setNrp] = useState('')
    const [name, setName] = useState('')
    const [position, setPosition] = useState('')
    const [shift, setShift] = useState('Shift 1 (Pagi)')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function initHrd() {
            try {
                // 1. Proteksi Sesi Supabase
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                // 2. Verifikasi Profil
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, status')
                    .eq('id', session.user.id)
                    .single()

                if (!profile || profile.status !== 'Aktif') {
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                setUserName(profile.full_name || 'Petugas HRD')

                // 3. Tarik data personil dari tabel hrd_employees
                const { data: hrdData, error } = await supabase
                    .from('hrd_employees')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (!error && hrdData && hrdData.length > 0) {
                    setEmployees(hrdData)
                } else {
                    // Data cadangan jika tabel masih kosong
                    setEmployees([
                        {
                            id: '1',
                            nrp: 'NRP-2026-001',
                            full_name: 'Bambang Irawan',
                            position: 'Operator Excavator PC400',
                            shift: 'Shift 1 (Pagi)',
                            status: 'Aktif',
                        },
                        {
                            id: '2',
                            nrp: 'NRP-2026-042',
                            full_name: 'Rizky Setiawan',
                            position: 'Driver Dump Truck DT-12',
                            shift: 'Shift 2 (Malam)',
                            status: 'Aktif',
                        },
                        {
                            id: '3',
                            nrp: 'NRP-2026-089',
                            full_name: 'Yohanes Mandagi',
                            position: 'Mekanik Alat Berat',
                            shift: 'Off Site',
                            status: 'Roster Cuti',
                        },
                    ])
                }

                setLoading(false)
            } catch (err) {
                console.error('Error loading HRD:', err)
                setLoading(false)
            }
        }

        initHrd()
    }, [landingUrl])

    // Simpan Personel Baru ke Supabase
    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !position) return

        setSubmitting(true)
        const generatedNrp = nrp || `NRP-2026-${Date.now().toString().slice(-4)}`

        const payload = {
            nrp: generatedNrp,
            full_name: name,
            position: position,
            shift: shift,
            status: 'Aktif',
        }

        const { data, error } = await supabase
            .from('hrd_employees')
            .insert([payload])
            .select()

        if (!error && data) {
            setEmployees([data[0], ...employees])
            setShowModal(false)
            setName('')
            setPosition('')
            setNrp('')
        } else {
            alert('Gagal menyimpan personel: ' + (error?.message || 'Pastikan NRP belum pernah terdaftar.'))
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
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Manpower HRD...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Bar */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 mb-6 shadow-xl">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">👷</span>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                            Dashboard Human Resources (HRD) PT. JEEP
                        </h1>
                        <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Manpower & K3 Site Operasional Tambang • {userName}
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

            {/* Nav Tabs Atas */}
            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'karyawan', label: 'DATA KARYAWAN PIT', badge: `${employees.length} PERSONEL` },
                    { id: 'absensi', label: 'ABSENSI & ROSTER SHIFT', badge: '' },
                    { id: 'k3', label: 'K3 & SERTIFIKASI APD', badge: 'ZERO ACCIDENT' },
                    { id: 'payroll', label: 'PAYROLL & LEMBUR', badge: '' },
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

            {/* Grid Konten Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Menu Fitur */}
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-amber-500/50 bg-amber-950/20 hover:bg-amber-900/30 text-amber-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Daftarkan Personel / Shift</div>
                            <div className="text-[10px] text-slate-400">Operator, Driver, atau Kru Pit</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#16273c] bg-[#0a1625] text-slate-400 space-y-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Status Database HRD</span>
                        <div className="text-[11px] flex justify-between">
                            <span>Tabel Supabase</span>
                            <span className="text-emerald-400 font-semibold">hrd_employees</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Total Karyawan</span>
                            <span className="text-slate-200 font-bold">{employees.length} orang</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Sinkronisasi Roster</span>
                            <span className="text-emerald-400 font-semibold">Aktif</span>
                        </div>
                    </div>
                </aside>

                {/* Kolom Kanan: Panel Statistik & Tabel */}
                <main className="lg:col-span-9 space-y-6">
                    {/* Metrik Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Total Tenaga Kerja</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{employees.length}</span>
                                <span className="text-xs text-emerald-400 font-semibold">Personel Aktif</span>
                            </div>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Kehadiran Shift Hari Ini</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-amber-400">98.2%</span>
                                <span className="text-xs text-slate-400">Hadir Lapangan</span>
                            </div>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Jam Kerja Selamat (K3)</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-emerald-400">124.500</span>
                                <span className="text-xs text-slate-400">Jam Kerja</span>
                            </div>
                            <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Zero Lost Time Injury (LTI)</p>
                        </div>
                    </div>

                    {/* Tabel Status Tim & Roster */}
                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Jadwal Shift & Status Operator Pit Tambang (Real Supabase)
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                                + Tambah Personel
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">NRP</th>
                                        <th className="pb-2">Nama Personel</th>
                                        <th className="pb-2">Posisi / Unit</th>
                                        <th className="pb-2">Shift</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {employees.map((emp) => (
                                        <tr key={emp.id}>
                                            <td className="py-2.5 font-mono text-[11px] text-amber-400">{emp.nrp}</td>
                                            <td className="font-semibold text-white">{emp.full_name}</td>
                                            <td>{emp.position}</td>
                                            <td>
                                                <span className="bg-sky-950 text-sky-400 px-2 py-0.5 rounded text-[10px]">
                                                    {emp.shift}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
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

            {/* Modal Input Personel */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Daftarkan Personel / Shift Lapangan</h2>
                        <form onSubmit={handleAddEmployee} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">NRP (Opsional)</label>
                                <input
                                    type="text"
                                    value={nrp}
                                    onChange={(e) => setNrp(e.target.value)}
                                    placeholder="Otomatis jika kosong (cth: NRP-2026-099)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: Andi Wijaya"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Posisi / Jabatan</label>
                                <input
                                    type="text"
                                    required
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="Contoh: Operator Dozer D8R"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Jadwal Shift</label>
                                <select
                                    value={shift}
                                    onChange={(e) => setShift(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                >
                                    <option value="Shift 1 (Pagi)">Shift 1 (Pagi: 07:00 – 18:00)</option>
                                    <option value="Shift 2 (Malam)">Shift 2 (Malam: 19:00 – 06:00)</option>
                                    <option value="Roster Off">Roster Off / Cuti Site</option>
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
                                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}