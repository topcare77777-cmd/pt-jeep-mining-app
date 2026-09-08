'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function DirekturDashboard() {
    const [loading, setLoading] = useState(true)
    const [directorName, setDirectorName] = useState('Direktur Utama')
    const [activeTab, setActiveTab] = useState('executive')

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function initDirector() {
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
                    .single()

                if (!profile || profile.status !== 'Aktif') {
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                setDirectorName(profile.full_name || 'Direktur Utama')
                setLoading(false)
            } catch (err) {
                console.error('Error init director:', err)
                setLoading(false)
            }
        }

        initDirector()
    }, [landingUrl])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Menyiapkan Ringkasan Eksekutif...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Eksekutif */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 mb-6 shadow-xl">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏛️</span>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                            Executive Console PT. Jangkar Energi Eka Perkasa
                        </h1>
                        <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            High-Level Overview & Financial KPI • {directorName} (Direktur Utama)
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
                    { id: 'executive', label: 'RINGKASAN EKSEKUTIF', badge: 'Q3 2026' },
                    { id: 'financial', label: 'NET PROFIT & CASH FLOW', badge: '' },
                    { id: 'production', label: 'TARGET VS REALISASI PRODUKSI', badge: '' },
                    { id: 'esg', label: 'COMPLIANCE & ESG AUDIT', badge: 'AMAN' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${activeTab === tab.id
                                ? 'bg-[#1b3b5f] border-amber-400 text-white shadow-lg shadow-amber-950/40'
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

            {/* Kartu Metrik Level Dewan Direksi */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pendapatan (YTD)</h3>
                    <div className="text-2xl font-black text-white">Rp 48,2 Miliar</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">+14,5% terhadap target RKAB</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimasi Laba Bersih</h3>
                    <div className="text-2xl font-black text-emerald-400">Rp 12,8 Miliar</div>
                    <p className="mt-2 text-[11px] text-slate-400">Net Profit Margin: 26,5%</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Realisasi Pengiriman (Barge)</h3>
                    <div className="text-2xl font-black text-amber-400">185.000 MT</div>
                    <p className="mt-2 text-[11px] text-amber-400 font-semibold">24 Tongkang Selesai Muat</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Indeks K3 Site & Legalitas</h3>
                    <div className="text-2xl font-black text-sky-400">100% Valid</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ IUP, IPPKH & Amdal Aktif</p>
                </div>
            </div>

            {/* Grid Analisis Laporan Divisi */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                        Laporan Kinerja Lintas Divisi Site (Finance, GA, HRD, ADM)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#1b2e46] text-slate-400">
                                    <th className="pb-2">Divisi</th>
                                    <th className="pb-2">Key Performance Indicator (KPI)</th>
                                    <th className="pb-2">Realisasi</th>
                                    <th className="pb-2">Evaluasi Direksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#16273c] text-slate-300">
                                <tr>
                                    <td className="py-3 font-bold text-white">Keuangan (Finance)</td>
                                    <td>Efisiensi Anggaran BBM & Vendor Pit</td>
                                    <td className="text-emerald-400 font-bold">92% On Budget</td>
                                    <td><span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">Optimal</span></td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-bold text-white">Operasional Pit</td>
                                    <td>Stripping Ratio (SR) & Pengupasan Overburden</td>
                                    <td className="text-amber-400 font-bold">1 : 4,2 (Target 1 : 4)</td>
                                    <td><span className="bg-amber-950/60 text-amber-400 border border-amber-800/40 px-2 py-0.5 rounded text-[10px]">Perlu Monitoring</span></td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-bold text-white">Human Resources (HRD)</td>
                                    <td>Zero Incident & Kepatuhan Jam Kerja Karyawan</td>
                                    <td className="text-sky-400 font-bold">124.500 Jam Aman</td>
                                    <td><span className="bg-sky-950/60 text-sky-400 border border-sky-800/40 px-2 py-0.5 rounded text-[10px]">Sangat Baik</span></td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-bold text-white">Umum (GA) & ADM</td>
                                    <td>Ketersediaan Armada LV & Verifikasi Ritase</td>
                                    <td className="text-emerald-400 font-bold">98,5% Akurat</td>
                                    <td><span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">Terkendali</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Kolom Kanan: Arahan Direktur */}
                <div className="lg:col-span-4 bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Instruksi & Kebijakan Strategis
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-[#060c14] border border-[#1b2e46] p-3 rounded-lg text-xs">
                            <span className="text-amber-400 font-bold block mb-1">Target Triwulan IV</span>
                            <p className="text-slate-300 text-[11px]">
                                Fokus peningkatan ritase hauling ke stockpile pelabuhan minimal 45 rit per hari per armada sebelum musim hujan lebat.
                            </p>
                        </div>
                        <div className="bg-[#060c14] border border-[#1b2e46] p-3 rounded-lg text-xs">
                            <span className="text-emerald-400 font-bold block mb-1">Pengendalian Cash Out</span>
                            <p className="text-slate-300 text-[11px]">
                                Seluruh pengajuan transaksi vendor di atas Rp 50.000.000 wajib divalidasi langsung melalui approval Direktur Utama.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}