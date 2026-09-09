'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface VehicleLog {
    id: string
    created_at?: string
    hull_no: string
    model: string
    driver: string
    destination: string
    status: string
}

export default function GaDashboard() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas GA')
    const [activeTab, setActiveTab] = useState('kendaraan')
    const [vehicles, setVehicles] = useState<VehicleLog[]>([])

    // Modal Peminjaman / Log Armada LV
    const [showModal, setShowModal] = useState(false)
    const [hullNo, setHullNo] = useState('')
    const [model, setModel] = useState('')
    const [driver, setDriver] = useState('')
    const [destination, setDestination] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function initGa() {
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

                setUserName(profile.full_name || 'Petugas GA')

                // 3. Tarik data dari tabel ga_vehicle_logs di Supabase
                const { data: logsData, error } = await supabase
                    .from('ga_vehicle_logs')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (!error && logsData && logsData.length > 0) {
                    setVehicles(logsData)
                } else {
                    // Data awal jika tabel belum terisi
                    setVehicles([
                        {
                            id: '1',
                            hull_no: 'LV-01',
                            model: 'Toyota Hilux 4x4 Double Cabin',
                            driver: 'Hendra (Engineering Pit)',
                            destination: 'Front Penambangan Blok C',
                            status: 'Dipakai',
                        },
                        {
                            id: '2',
                            hull_no: 'LV-05',
                            model: 'Mitsubishi Triton 4x4',
                            driver: 'Tim K3 & Safety Patrol',
                            destination: 'Inspeksi Hauling Road',
                            status: 'Dipakai',
                        },
                        {
                            id: '3',
                            hull_no: 'LV-AMB',
                            model: 'Toyota Hilux Ambulance Rescue',
                            driver: 'Tim Medis Site',
                            destination: 'Klinik Utama Pit Tambang',
                            status: 'Standby Siaga',
                        },
                    ])
                }

                setLoading(false)
            } catch (err) {
                console.error('Error loading GA:', err)
                setLoading(false)
            }
        }

        initGa()
    }, [landingUrl])

    // Simpan Log Peminjaman Kendaraan ke Supabase
    const handleAddVehicleLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!hullNo || !driver || !destination) return

        setSubmitting(true)

        const payload = {
            hull_no: hullNo,
            model: model || 'Kendaraan Operasional Site',
            driver,
            destination,
            status: 'Dipakai',
        }

        const { data, error } = await supabase
            .from('ga_vehicle_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setVehicles([data[0], ...vehicles])
            setShowModal(false)
            setHullNo('')
            setModel('')
            setDriver('')
            setDestination('')
        } else {
            alert('Gagal mencatat peminjaman kendaraan: ' + (error?.message || ''))
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
                <p className="text-xs text-slate-400">Sinkronisasi Logistik & Fasilitas GA...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Bar */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 mb-6 shadow-xl">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏢</span>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                            Dashboard Umum & General Affair (GA) PT. JEEP
                        </h1>
                        <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Fasilitas Site, Mess, Armada LV, & Logistik Pit • {userName}
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
                    { id: 'kendaraan', label: 'KENDARAAN OPERASIONAL (LV)', badge: `${vehicles.length} UNIT` },
                    { id: 'mess', label: 'MESS & AKOMODASI', badge: '92% TERISI' },
                    { id: 'catering', label: 'CATERING & KONSUMSI', badge: '3X MAKAN' },
                    { id: 'izin', label: 'PERIZINAN & LINGKUNGAN', badge: 'LENGKAP' },
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
                {/* Kolom Kiri: Tombol Aksi Cepat */}
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-amber-500/50 bg-amber-950/20 hover:bg-amber-900/30 text-amber-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Catat Penggunaan LV</div>
                            <div className="text-[10px] text-slate-400">Peminjaman Kendaraan Operasional</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#16273c] bg-[#0a1625] text-slate-400 space-y-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Status Database GA</span>
                        <div className="text-[11px] flex justify-between">
                            <span>Tabel Supabase</span>
                            <span className="text-emerald-400 font-semibold">ga_vehicle_logs</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Total Armada Tercatat</span>
                            <span className="text-slate-200 font-bold">{vehicles.length} log</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Kapasitas Mess Pit</span>
                            <span className="text-amber-400 font-semibold">128 / 140 Bed</span>
                        </div>
                    </div>
                </aside>

                {/* Kolom Kanan: Panel Tabel */}
                <main className="lg:col-span-9 space-y-6">
                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Status Pemakaian Kendaraan Operasional Lapangan (Live Supabase)
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                                + Pinjam Kendaraan
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">No. Lambung</th>
                                        <th className="pb-2">Tipe Kendaraan</th>
                                        <th className="pb-2">Peminjam / Driver</th>
                                        <th className="pb-2">Tujuan Lokasi</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {vehicles.map((v) => (
                                        <tr key={v.id}>
                                            <td className="py-2.5 font-bold text-white font-mono">{v.hull_no}</td>
                                            <td>{v.model}</td>
                                            <td className="text-slate-300">{v.driver}</td>
                                            <td className="text-slate-400">{v.destination}</td>
                                            <td>
                                                <span
                                                    className={`px-2 py-0.5 rounded border text-[10px] ${v.status === 'Dipakai'
                                                            ? 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                                                            : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                                                        }`}
                                                >
                                                    {v.status}
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

            {/* Modal Form Tambah Pemakaian LV */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Formulir Pemakaian Kendaraan (LV)</h2>
                        <form onSubmit={handleAddVehicleLog} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nomor Lambung Kendaraan</label>
                                <input
                                    type="text"
                                    required
                                    value={hullNo}
                                    onChange={(e) => setHullNo(e.target.value)}
                                    placeholder="Contoh: LV-09"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Tipe / Model Kendaraan</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="Contoh: Toyota Hilux 4x4 Double Cabin"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Peminjam / Driver</label>
                                <input
                                    type="text"
                                    required
                                    value={driver}
                                    onChange={(e) => setDriver(e.target.value)}
                                    placeholder="Contoh: Agus Santoso (Engineering)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Tujuan Lokasi Site</label>
                                <input
                                    type="text"
                                    required
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    placeholder="Contoh: Stockpile Pelabuhan / Hauling Road"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}