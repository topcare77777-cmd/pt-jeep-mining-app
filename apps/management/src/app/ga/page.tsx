'use client'

import React, { useState } from 'react'

export default function GaDashboard() {
    const [activeTab, setActiveTab] = useState('mess')

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
                            Fasilitas Site, Akomodasi Mess, Transportasi & Logistik Lapangan
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
                    { id: 'mess', label: 'MESS & AKOMODASI', badge: '92% TERISI' },
                    { id: 'kendaraan', label: 'KENDARAAN OPERASIONAL (LV)', badge: '' },
                    { id: 'catering', label: 'CATERING & LOGISTIK', badge: '3X MAKAN' },
                    { id: 'izin', label: 'PERIZINAN & LINGKUNGAN', badge: 'LENGKAP' },
                    { id: 'keamanan', label: 'SECURITY & POS JAGA', badge: '' },
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
                            <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded font-black">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Grid Konten Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Menu Fitur GA */}
                <aside className="lg:col-span-3 space-y-3">
                    {[
                        { id: 'mess', icon: '🛏️', title: 'Kamar & Pemeliharaan Mess' },
                        { id: 'kendaraan', icon: '🚙', title: 'Armada LV (Light Vehicle)' },
                        { id: 'catering', icon: '🍱', title: 'Kantin & Pasokan Air Bersih' },
                        { id: 'limbah', icon: '♻️', title: 'Pengolahan Sampah & Limbah' },
                        { id: 'atk', icon: '📦', title: 'Inventaris & ATK Kantor' },
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
                        </div>
                    ))}
                </aside>

                {/* Kolom Kanan: Panel Fasilitas & Logistik */}
                <main className="lg:col-span-9 space-y-6">
                    {/* Row Atas: Ringkasan Metrik GA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Kapasitas Mess Karyawan</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-amber-400">128/140</span>
                                <span className="text-xs text-slate-400">Tempat Tidur</span>
                            </div>
                            <p className="mt-3 text-[11px] text-slate-400">Blok A (Staff), Blok B & C (Operator)</p>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Kesiapan Armada LV</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-emerald-400">14 Unit</span>
                                <span className="text-xs text-slate-400">Siap Jalan</span>
                            </div>
                            <div className="mt-3 text-[11px] text-slate-400 flex justify-between">
                                <span>Triton/Hilux: 12</span>
                                <span>Ambulans Site: 2</span>
                            </div>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Konsumsi Catering Hari Ini</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">426</span>
                                <span className="text-xs text-slate-400">Porsi Terdistribusi</span>
                            </div>
                            <p className="mt-3 text-[11px] text-emerald-400 font-medium">✓ Standar Higienis Terverifikasi</p>
                        </div>
                    </div>

                    {/* Tabel Penggunaan Kendaraan Lapangan */}
                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                            Status Peminjaman Kendaraan Operasional (LV)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">No. Lambung</th>
                                        <th className="pb-2">Tipe Kendaraan</th>
                                        <th className="pb-2">Peminjam / Divisi</th>
                                        <th className="pb-2">Tujuan Site</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    <tr>
                                        <td className="py-2.5 font-bold text-white">LV-01</td>
                                        <td>Toyota Hilux 4x4 Double Cabin</td>
                                        <td>Hendra (Engineering Pit)</td>
                                        <td>Front Penambangan Blok C</td>
                                        <td><span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 text-[10px]">Dipakai</span></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 font-bold text-white">LV-05</td>
                                        <td>Mitsubishi Triton 4x4</td>
                                        <td>Tim K3 & Safety Patrol</td>
                                        <td>Inspeksi Hauling Road</td>
                                        <td><span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 text-[10px]">Dipakai</span></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 font-bold text-white">LV-AMB</td>
                                        <td>Toyota Hilux Ambulance Rescue</td>
                                        <td>Tim Medis Site</td>
                                        <td>Klinik Utama Pit Tambang</td>
                                        <td><span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">Standby Siaga</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}