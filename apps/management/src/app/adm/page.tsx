'use client'

import React, { useState } from 'react'

export default function AdmDashboard() {
    const [activeTab, setActiveTab] = useState('surat')

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Bar */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 mb-6 shadow-xl">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">📋</span>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                            Dashboard Administrasi (ADM) PT. JEEP
                        </h1>
                        <p className="text-xs text-sky-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                            Pusat Arsip Surat, Logistik Dokumen, & Administrasi Operasional Site
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
                    { id: 'surat', label: 'SURAT MASUK & KELUAR', badge: '12 BARU' },
                    { id: 'suratjalan', label: 'SURAT JALAN & RITASE', badge: '' },
                    { id: 'po', label: 'PURCHASE ORDER (PO)', badge: '5 PENDING' },
                    { id: 'arsip', label: 'ARSIP KONTRAK & LEGAL', badge: '' },
                    { id: 'tamu', label: 'BUKU TAMU & SIMP', badge: '' },
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
                {/* Kolom Kiri: Menu Fitur ADM */}
                <aside className="lg:col-span-3 space-y-3">
                    {[
                        { id: 'surat', icon: '✉️', title: 'Korespondensi & Memo Internal' },
                        { id: 'suratjalan', icon: '🚚', title: 'Verifikasi Surat Jalan (Delivery)' },
                        { id: 'po', icon: '📝', title: 'Administrasi PO & PR Pit' },
                        { id: 'tamu', icon: '🛂', title: 'Izin Masuk Site (SIMP / Visitor)' },
                        { id: 'rekap', icon: '📊', title: 'Rekap Laporan Harian Site (DOR)' },
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

                {/* Kolom Kanan: Panel Metrik & Tabel Dokumen */}
                <main className="lg:col-span-9 space-y-6">
                    {/* Row Atas: Ringkasan Metrik ADM */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Total Dokumen Masuk (Bulan Ini)</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">284</span>
                                <span className="text-xs text-sky-400 font-semibold">+18 Hari Ini</span>
                            </div>
                            <div className="mt-3 text-[11px] text-slate-400 flex justify-between">
                                <span>Surat Masuk: 196</span>
                                <span>Memo/PO: 88</span>
                            </div>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Surat Jalan Terverifikasi</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-emerald-400">1.420</span>
                                <span className="text-xs text-slate-400">Ritase</span>
                            </div>
                            <p className="mt-3 text-[11px] text-emerald-400 font-medium">✓ Sesuai Timbangan Jembatan</p>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Pengajuan Izin Tamu (SIMP)</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-amber-400">7</span>
                                <span className="text-xs text-slate-400">Menunggu Approval</span>
                            </div>
                            <p className="mt-3 text-[11px] text-amber-400 font-medium">Inspeksi Vendor & Tamu Vendor</p>
                        </div>
                    </div>

                    {/* Tabel Dokumen & Surat Jalan Terbaru */}
                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Log Surat & Dokumen Masuk Terakhir
                            </h3>
                            <button className="bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition">
                                + Catat Dokumen Baru
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">No. Agenda</th>
                                        <th className="pb-2">Perihal / Dokumen</th>
                                        <th className="pb-2">Pengirim / Divisi</th>
                                        <th className="pb-2">Tanggal</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    <tr>
                                        <td className="py-2.5 font-mono text-[11px]">ADM/2026/09/012</td>
                                        <td className="font-semibold text-white">Surat Jalan Pengiriman Solar 16.000L</td>
                                        <td>PT Solar Pasifik</td>
                                        <td>Hari ini, 04:15</td>
                                        <td><span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">Tervalidasi</span></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 font-mono text-[11px]">ADM/2026/09/011</td>
                                        <td className="font-semibold text-white">Permohonan Izin Masuk Pit (SIMP Site)</td>
                                        <td>PT United Tractors</td>
                                        <td>Kemarin</td>
                                        <td><span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 text-[10px]">Diproses K3</span></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 font-mono text-[11px]">ADM/2026/09/010</td>
                                        <td className="font-semibold text-white">Purchase Request Sparepart Filter HD</td>
                                        <td>Divisi Maintenance Unit</td>
                                        <td>07 Sep 2026</td>
                                        <td><span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">Diarsipkan</span></td>
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