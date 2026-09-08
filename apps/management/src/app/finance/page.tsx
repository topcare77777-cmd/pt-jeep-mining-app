'use client'

import React, { useState } from 'react'

export default function FinanceDashboard() {
    const [activeTab, setActiveTab] = useState('ringkasan')

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Bar */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 mb-6 shadow-xl">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">⚓</span>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                            Dashboard Keuangan PT. Jangkar Energi Eka Perkasa
                        </h1>
                        <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Sync Site Operasional Tambang • SYAIFUL AK ENGGELETI (Finance)
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => (window.location.href = 'https://pt-jeep.vercel.app')}
                    className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition"
                >
                    Keluar ke Beranda
                </button>
            </header>

            {/* Nav Tabs Atas */}
            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'ringkasan', label: 'RINGKASAN EKSEKUTIF', badge: '' },
                    { id: 'anggaran', label: 'ANGGARAN', badge: '' },
                    { id: 'bbm', label: 'BBM', badge: '' },
                    { id: 'vendor', label: 'VENDOR', badge: '' },
                    { id: 'pnl', label: 'P&L', badge: '' },
                    { id: 'pajak', label: 'PAJAK', badge: 'BARU' },
                    { id: 'sewa', label: 'SEWA ALAT', badge: 'BARU' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${activeTab === tab.id
                                ? 'bg-[#1b3b5f] border-sky-400 text-white shadow-lg shadow-sky-950/50'
                                : 'bg-[#0c1a2d] border-[#1b2e46] text-slate-400 hover:text-white hover:bg-[#12243d]'
                            }`}
                    >
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-black">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Grid Konten Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Navigasi Menu Fitur */}
                <aside className="lg:col-span-3 space-y-3">
                    {[
                        { id: 'ringkasan', icon: '📊', title: 'Ringkasan Eksekutif' },
                        { id: 'anggaran', icon: '📈', title: 'Ringkasan Anggaran vs Pengeluaran' },
                        { id: 'bbm', icon: '⛽', title: 'Biaya Bahan Bakar Real-time' },
                        { id: 'vendor', icon: '💵', title: 'Pembayaran Vendor' },
                        { id: 'pnl', icon: '📑', title: 'Laba Rugi Operasional' },
                        { id: 'pajak', icon: '🏛️', title: 'Pelaporan Pajak Otomatis', badge: 'BARU' },
                        { id: 'sewa', icon: '🚜', title: 'Manajemen Sewa Alat Berat', badge: 'BARU' },
                    ].map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${activeTab === item.id
                                    ? 'bg-[#142942] border-sky-500 text-white'
                                    : 'bg-[#0a1625] border-[#16273c] text-slate-400 hover:bg-[#0f2035] hover:text-slate-200'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-xs font-semibold">{item.title}</span>
                            </div>
                            {item.badge && (
                                <span className="bg-amber-500 text-slate-950 text-[9px] px-1 rounded font-bold">
                                    {item.badge}
                                </span>
                            )}
                        </div>
                    ))}
                </aside>

                {/* Kolom Kanan: Panel Metrik & Tabel */}
                <main className="lg:col-span-9 space-y-6">
                    {/* Row Atas: Anggaran, Gauge & Pajak */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Kartu 1: Anggaran vs Pengeluaran */}
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                                Anggaran vs Pengeluaran
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">SDM Pit</span>
                                        <span className="text-white font-bold">Rp 210.000.000</span>
                                    </div>
                                    <div className="w-full bg-[#16273c] h-2 rounded-full overflow-hidden">
                                        <div className="bg-amber-500 h-full w-[78%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Operasional Pit</span>
                                        <span className="text-white font-bold">Rp 145.000.000</span>
                                    </div>
                                    <div className="w-full bg-[#16273c] h-2 rounded-full overflow-hidden">
                                        <div className="bg-sky-500 h-full w-[62%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Peralatan Berat</span>
                                        <span className="text-white font-bold">Rp 98.000.000</span>
                                    </div>
                                    <div className="w-full bg-[#16273c] h-2 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full w-[45%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kartu 2: Budget Alokasi (Donut & Efisiensi) */}
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 flex flex-col justify-between shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                Efisiensi Anggaran
                            </h3>
                            <div className="flex items-center justify-center py-2">
                                <div className="relative flex items-center justify-center">
                                    <div className="w-24 h-24 rounded-full border-4 border-amber-500/20 border-t-amber-500 border-r-sky-400 animate-spin"></div>
                                    <span className="absolute text-lg font-black text-white">82%</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-center text-slate-400">
                                Alokasi BBM, Vendor, & Maintenance Unit
                            </p>
                        </div>

                        {/* Kartu 3: Ringkasan Pajak */}
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 flex flex-col justify-between shadow-lg">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                        Kewajiban Pajak
                                    </h3>
                                    <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                                        PPh & PPN
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between text-slate-400">
                                        <span>PPN Keluaran</span>
                                        <span className="text-white">Rp 42.500.000</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>PPh 21 Lapangan</span>
                                        <span className="text-white">Rp 18.200.000</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>PPh 23 Sewa Unit</span>
                                        <span className="text-white">Rp 12.100.000</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2 rounded-lg transition">
                                Buat Laporan Pajak
                            </button>
                        </div>
                    </div>

                    {/* Row Bawah: Pembayaran Vendor & Sewa Alat Berat */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tabel Vendor */}
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                                Pembayaran Vendor
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[#1b2e46] text-slate-400">
                                            <th className="pb-2">Invoice</th>
                                            <th className="pb-2">Vendor</th>
                                            <th className="pb-2">Jumlah</th>
                                            <th className="pb-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#16273c] text-slate-300">
                                        <tr>
                                            <td className="py-2.5 font-mono text-[11px]">INV-2026-01</td>
                                            <td>PT Solar Pasifik</td>
                                            <td className="font-semibold text-white">Rp 85.000.000</td>
                                            <td><span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">Lunas</span></td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-mono text-[11px]">INV-2026-02</td>
                                            <td>Mitra Ban Perkasa</td>
                                            <td className="font-semibold text-white">Rp 34.200.000</td>
                                            <td><span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 text-[10px]">Pending</span></td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-mono text-[11px]">INV-2026-03</td>
                                            <td>Bengkel Sparepart Pit</td>
                                            <td className="font-semibold text-white">Rp 19.400.000</td>
                                            <td><span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">Lunas</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tabel Sewa Alat Berat */}
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                                Manajemen Sewa Alat Berat
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[#1b2e46] text-slate-400">
                                            <th className="pb-2">Unit</th>
                                            <th className="pb-2">Tipe</th>
                                            <th className="pb-2">Biaya Sewa</th>
                                            <th className="pb-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#16273c] text-slate-300">
                                        <tr>
                                            <td className="py-2.5 font-bold text-white">EX-01</td>
                                            <td>Excavator Komatsu PC300</td>
                                            <td className="font-semibold text-amber-400">Rp 45.000.000/bln</td>
                                            <td><span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">Aktif</span></td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-bold text-white">DT-12</td>
                                            <td>Dump Truck Hino 500</td>
                                            <td className="font-semibold text-amber-400">Rp 22.500.000/bln</td>
                                            <td><span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">Aktif</span></td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 font-bold text-white">DZ-04</td>
                                            <td>Dozer CAT D8R</td>
                                            <td className="font-semibold text-amber-400">Rp 50.000.000/bln</td>
                                            <td><span className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40 text-[10px]">Maintenance</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}