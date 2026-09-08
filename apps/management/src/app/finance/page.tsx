'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase mandiri yang aman untuk build Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function FinanceDashboard() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'ringkasan' | 'anggaran' | 'bbm' | 'vendor' | 'pnl' | 'pajak' | 'sewa'>('ringkasan')
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function getUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()
                    setCurrentUser(profile || { full_name: 'Divisi Finance', role: 'Finance' })
                } else {
                    setCurrentUser({ full_name: 'Officer Finance', role: 'Finance & Accounting' })
                }
            } catch (err) {
                console.error(err)
                setCurrentUser({ full_name: 'Officer Finance', role: 'Finance & Accounting' })
            }
        }
        getUser()
    }, [])

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await supabase.auth.signOut()
        } catch (err) {
            console.error(err)
        } finally {
            window.location.href = landingUrl
        }
    }

    return (
        <div className="flex h-screen w-full bg-[#0a1118] text-slate-100 font-sans overflow-hidden select-none">

            {/* ================= SIDEBAR KIRI ================= */}
            <aside className="w-64 bg-[#0d1824] border-r border-slate-800/80 flex flex-col justify-between shrink-0 shadow-2xl">
                <div>
                    {/* Logo & Header Nama PT */}
                    <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-[#0a131c]">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl shadow-inner">
                            ⚓
                        </div>
                        <div>
                            <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight">PT. JEEP</h1>
                            <p className="text-[10px] text-amber-400 font-medium tracking-wider">FINANCE & ACCOUNTING</p>
                        </div>
                    </div>

                    {/* Menu Navigasi Modul */}
                    <nav className="p-3 space-y-1.5 text-xs">
                        <button
                            onClick={() => setActiveTab('ringkasan')}
                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg font-medium transition text-left ${activeTab === 'ringkasan'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                }`}
                        >
                            <span className="text-base">📊</span>
                            <span>Ringkasan Eksekutif</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('anggaran')}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition text-left ${activeTab === 'anggaran'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                }`}
                        >
                            <span className="text-base">📉</span>
                            <span>Anggaran vs Pengeluaran</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('bbm')}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition text-left ${activeTab === 'bbm'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                }`}
                        >
                            <span className="text-base">⛽</span>
                            <span>Biaya Bahan Bakar (Real-time)</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('vendor')}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition text-left ${activeTab === 'vendor'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                }`}
                        >
                            <span className="text-base">💵</span>
                            <span>Pembayaran Vendor & Rekanan</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('pnl')}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition text-left ${activeTab === 'pnl'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                }`}
                        >
                            <span className="text-base">📈</span>
                            <span>Laba Rugi Operasional Pit</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('pajak')}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium transition text-left ${activeTab === 'pajak'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-base">🏛️</span>
                                <span>Pelaporan Pajak Otomatis</span>
                            </div>
                            <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Baru</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('sewa')}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium transition text-left ${activeTab === 'sewa'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-base">🚜</span>
                                <span>Manajemen Sewa Alat Berat</span>
                            </div>
                            <span className="text-[9px] bg-emerald-400 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Aktif</span>
                        </button>
                    </nav>
                </div>

                {/* Info Petugas & Tombol Logout */}
                <div className="p-4 border-t border-slate-800 bg-[#0a131c]">
                    <div className="mb-3 px-1">
                        <p className="text-xs text-white font-semibold truncate">{currentUser?.full_name || 'Petugas Keuangan'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{currentUser?.role || 'Finance Site'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-center gap-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                        🚪 {isLoggingOut ? 'Keluar...' : 'Keluar ke Beranda'}
                    </button>
                </div>
            </aside>

            {/* ================= KONTEN UTAMA ================= */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-950">

                {/* Header Atas */}
                <header className="px-6 py-4 border-b border-slate-800 bg-[#0d1824]/90 backdrop-blur sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-white tracking-wide">
                            Dashboard Keuangan PT. Jangkar Energi Eka Perkasa
                        </h2>
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
                            ● Live Sync Site
                        </span>
                    </div>

                    {/* Tab Filter Pintas */}
                    <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
                        {(['anggaran', 'bbm', 'vendor', 'pnl', 'pajak', 'sewa'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 rounded font-bold uppercase transition text-[11px] cursor-pointer ${activeTab === tab
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                {tab === 'pnl' ? 'P&L' : tab}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Isi Panel Grid Dashboard */}
                <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">

                    {/* BARIS 1: Anggaran vs Pengeluaran & Ringkasan Alokasi */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Box: Ringkasan Anggaran vs Pengeluaran */}
                        <section className="lg:col-span-2 bg-[#0e1726] border border-slate-800/80 rounded-xl p-5 shadow-lg relative">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-wide">Ringkasan Anggaran vs Pengeluaran</h3>
                                    <p className="text-[11px] text-slate-400">Realisasi penyerapan anggaran per kuartal berjalan</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
                                        <span className="text-slate-400">Anggaran</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                                        <span className="text-slate-400">Pengeluaran</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bar Grafik Visualisasi */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/60">
                                <div className="text-center space-y-2">
                                    <div className="h-40 flex items-end justify-center gap-2">
                                        <div className="w-8 bg-blue-600 rounded-t" style={{ height: '75%' }} title="Anggaran SDM: Rp 180 Juta"></div>
                                        <div className="w-8 bg-amber-500 rounded-t" style={{ height: '88%' }} title="Pengeluaran SDM: Rp 210 Juta"></div>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-300">Sumber Daya Manusia</p>
                                    <p className="text-[10px] font-mono text-slate-400">Rp 210.000.000</p>
                                </div>

                                <div className="text-center space-y-2">
                                    <div className="h-40 flex items-end justify-center gap-2">
                                        <div className="w-8 bg-blue-600 rounded-t" style={{ height: '60%' }}></div>
                                        <div className="w-8 bg-amber-500 rounded-t" style={{ height: '55%' }}></div>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-300">Operasional Pit</p>
                                    <p className="text-[10px] font-mono text-slate-400">Rp 125.000.000</p>
                                </div>

                                <div className="text-center space-y-2">
                                    <div className="h-40 flex items-end justify-center gap-2">
                                        <div className="w-8 bg-blue-600 rounded-t" style={{ height: '45%' }}></div>
                                        <div className="w-8 bg-amber-500 rounded-t" style={{ height: '40%' }}></div>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-300">Maintenance Peralatan</p>
                                    <p className="text-[10px] font-mono text-slate-400">Rp 95.000.000</p>
                                </div>
                            </div>
                        </section>

                        {/* Box: Budget Alokasi & Ringkasan Pajak */}
                        <section className="bg-[#0e1726] border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-white">Alokasi Anggaran & Pajak</h3>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">Q3-2026</span>
                                </div>

                                {/* Progress Alokasi */}
                                <div className="space-y-3 mb-6">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Operasional Tambang & BBM</span>
                                            <span className="text-amber-400 font-mono font-bold">58%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div className="bg-amber-500 h-full rounded-full" style={{ width: '58%' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Payroll & HRD Site</span>
                                            <span className="text-blue-400 font-mono font-bold">27%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full rounded-full" style={{ width: '27%' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Alat Berat & Rental</span>
                                            <span className="text-emerald-400 font-mono font-bold">15%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '15%' }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Ringkasan Beban Pajak */}
                                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-slate-400">
                                        <span>PPN Keluaran (11%)</span>
                                        <span className="font-mono text-white">Rp 48.500.000</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>PPh Pasal 21 (Karyawan)</span>
                                        <span className="font-mono text-white">Rp 16.200.000</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>PPh Pasal 23 (Sewa Alat)</span>
                                        <span className="font-mono text-white">Rp 8.750.000</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveTab('pajak')}
                                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                            >
                                Buat Laporan Pajak Baru
                            </button>
                        </section>

                    </div>

                    {/* BARIS 2: BBM Real-time & Pembayaran Vendor */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Biaya BBM Real-time */}
                        <section className="lg:col-span-2 bg-[#0e1726] border border-slate-800/80 rounded-xl p-5 shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-wide">Biaya Bahan Bakar (Solar Industri) Real-time</h3>
                                    <p className="text-[11px] text-slate-400">Konsumsi solar unit hauling & excavator di pit</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Total Hari Ini</p>
                                    <p className="text-sm font-mono font-bold text-amber-400">4.850 Liter / Rp 72.750.000</p>
                                </div>
                            </div>

                            {/* Kurva Grafik SVG */}
                            <div className="relative h-44 w-full bg-slate-950/60 rounded-lg border border-slate-800/80 p-3 flex flex-col justify-between">
                                <svg className="w-full h-28 overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                                    <path
                                        d="M 0,70 Q 50,20 100,50 T 200,30 T 300,80 T 400,20 T 500,45"
                                        fill="none"
                                        stroke="#f59e0b"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M 0,70 Q 50,20 100,50 T 200,30 T 300,80 T 400,20 T 500,45 L 500,100 L 0,100 Z"
                                        fill="rgba(245, 158, 11, 0.08)"
                                    />
                                </svg>

                                <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                                    <span>Shift 1 (07:00)</span>
                                    <span>Shift 1 (11:00)</span>
                                    <span>Shift 2 (15:00)</span>
                                    <span>Shift 2 (19:00)</span>
                                    <span>Shift 3 (23:00)</span>
                                    <span>Shift 3 (03:00)</span>
                                </div>
                            </div>

                            {/* Status Pemantauan Unit BBM */}
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                    <p className="text-slate-400">Fuel Truck FT-01</p>
                                    <p className="font-mono text-white font-bold">Tersisa 1.200 L</p>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                    <p className="text-slate-400">Excavator EX-200</p>
                                    <p className="font-mono text-white font-bold">28,5 L/Jam</p>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                    <p className="text-slate-400">Dump Truck DT-08</p>
                                    <p className="font-mono text-white font-bold">14,2 L/Rit</p>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                    <p className="text-slate-400">Harga Solar/Liter</p>
                                    <p className="font-mono text-amber-400 font-bold">Rp 15.000</p>
                                </div>
                            </div>
                        </section>

                        {/* Pembayaran Vendor */}
                        <section className="bg-[#0e1726] border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-white">Pembayaran Vendor</h3>
                                    <button className="text-[11px] text-amber-400 hover:underline cursor-pointer">Lihat Semua</button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                                                <th className="pb-2">Vendor</th>
                                                <th className="pb-2">Jatuh Tempo</th>
                                                <th className="pb-2 text-right">Nominal</th>
                                                <th className="pb-2 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 font-sans">
                                            <tr>
                                                <td className="py-2.5 font-medium text-white">PT. Pertamina Patra</td>
                                                <td className="py-2.5 text-slate-400 font-mono text-[11px]">15 Sep</td>
                                                <td className="py-2.5 text-right font-mono text-amber-400">Rp 75 Jt</td>
                                                <td className="py-2.5 text-right">
                                                    <span className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded">Lunas</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2.5 font-medium text-white">United Tractors</td>
                                                <td className="py-2.5 text-slate-400 font-mono text-[11px]">20 Sep</td>
                                                <td className="py-2.5 text-right font-mono text-amber-400">Rp 32 Jt</td>
                                                <td className="py-2.5 text-right">
                                                    <span className="bg-amber-950/50 border border-amber-500/40 text-amber-400 text-[9px] px-1.5 py-0.5 rounded">Pending</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2.5 font-medium text-white">Caterpillar Parts</td>
                                                <td className="py-2.5 text-slate-400 font-mono text-[11px]">25 Sep</td>
                                                <td className="py-2.5 text-right font-mono text-amber-400">Rp 18 Jt</td>
                                                <td className="py-2.5 text-right">
                                                    <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded">Draft</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800 mt-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Total Tagihan Berjalan</span>
                                    <span className="font-mono font-bold text-white text-sm">Rp 125.000.000</span>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* BARIS 3: Laba Rugi Operasional & Manajemen Sewa Alat Berat */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Laba Rugi Operasional */}
                        <section className="bg-[#0e1726] border border-slate-800/80 rounded-xl p-5 shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-wide">Laba Rugi Operasional Pit</h3>
                                    <p className="text-[11px] text-slate-400">EBITDA & Estimasi Keuntungan Pengapalan Nikel/Batubara</p>
                                </div>
                                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">
                                    Margin: +28.4%
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <p className="text-[10px] text-slate-400 uppercase">Gross Revenue</p>
                                    <p className="font-mono text-xs md:text-sm font-bold text-white mt-1">Rp 1.45 M</p>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <p className="text-[10px] text-slate-400 uppercase">HPP / COGS</p>
                                    <p className="font-mono text-xs md:text-sm font-bold text-rose-400 mt-1">Rp 820 Jt</p>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <p className="text-[10px] text-slate-400 uppercase">Biaya Operasional</p>
                                    <p className="font-mono text-xs md:text-sm font-bold text-amber-400 mt-1">Rp 215 Jt</p>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-emerald-900/50">
                                    <p className="text-[10px] text-emerald-400 uppercase font-bold">Laba Bersih Site</p>
                                    <p className="font-mono text-xs md:text-sm font-bold text-emerald-400 mt-1">Rp 415 Jt</p>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-400 flex justify-between items-center">
                                <span>Status Audit Internal: <strong className="text-white">Lolos Kualifikasi Kuartal II</strong></span>
                                <button className="text-amber-400 hover:underline cursor-pointer">Unduh Laporan P&L (.PDF)</button>
                            </div>
                        </section>

                        {/* Manajemen Sewa Alat Berat */}
                        <section className="bg-[#0e1726] border border-slate-800/80 rounded-xl p-5 shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-wide">Manajemen Sewa Alat Berat</h3>
                                    <p className="text-[11px] text-slate-400">Monitoring billing unit excavator, dozer & hauler</p>
                                </div>
                                <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded transition cursor-pointer">
                                    + Tambah Kontrak
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                                            <th className="pb-2">Unit Alat</th>
                                            <th className="pb-2">Vendor / Pemilik</th>
                                            <th className="pb-2">Durasi Kontrak</th>
                                            <th className="pb-2 text-right">Tarif / Jam</th>
                                            <th className="pb-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-sans">
                                        <tr>
                                            <td className="py-2.5 font-bold text-white">Komatsu PC200</td>
                                            <td className="py-2.5 text-slate-300">PT. Mitra Perkasa</td>
                                            <td className="py-2.5 text-slate-400 font-mono text-[11px]">01 Jan – 31 Des</td>
                                            <td className="py-2.5 text-right font-mono text-amber-400">Rp 350.000</td>
                                            <td className="py-2.5 text-right">
                                                <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[10px]">Aktif</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-bold text-white">Dozer CAT D85</td>
                                            <td className="py-2.5 text-slate-300">CV. Surya Rental</td>
                                            <td className="py-2.5 text-slate-400 font-mono text-[11px]">15 Mar – 15 Okt</td>
                                            <td className="py-2.5 text-right font-mono text-amber-400">Rp 480.000</td>
                                            <td className="py-2.5 text-right">
                                                <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[10px]">Aktif</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-bold text-white">Dump Truck Hino 500</td>
                                            <td className="py-2.5 text-slate-300">PT. Armada Tambang</td>
                                            <td className="py-2.5 text-slate-400 font-mono text-[11px]">10 Feb – 10 Sep</td>
                                            <td className="py-2.5 text-right font-mono text-amber-400">Rp 180.000</td>
                                            <td className="py-2.5 text-right">
                                                <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">Perpanjangan</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                        </section>

                    </div>

                </div>
            </main>

        </div>
    )
}