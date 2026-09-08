'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ManagerSiteDashboard() {
    const [loading, setLoading] = useState(true)
    const [managerName, setManagerName] = useState('Site Manager')
    const [activeTab, setActiveTab] = useState('produksi')

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function initManager() {
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

                setManagerName(profile.full_name || 'Kepala Teknik Tambang / Site Manager')
                setLoading(false)
            } catch (err) {
                console.error('Error init site manager:', err)
                setLoading(false)
            }
        }

        initManager()
    }, [landingUrl])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Menghubungkan Komando Site Tambang...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Site Manager */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 mb-6 shadow-xl">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">⛏️</span>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                            Pusat Komando Operasional Site PT. JEEP
                        </h1>
                        <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Kontrol Pit, Hauling, K3, & Fleet Management • {managerName} (KTT / Site Manager)
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
                    { id: 'produksi', label: 'PRODUKSI & OVERBURDEN', badge: 'LIVE PIT' },
                    { id: 'hauling', label: 'RITASE HAULING ROAD', badge: '142 RIT/HARI' },
                    { id: 'fleet', label: 'KESIAPAN ALAT BERAT (PA/MA)', badge: '88%' },
                    { id: 'safety', label: 'INSPEKSI K3 & LINGKUNGAN', badge: 'ZERO ACCIDENT' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${activeTab === tab.id
                                ? 'bg-[#1b3b5f] border-emerald-400 text-white shadow-lg shadow-emerald-950/40'
                                : 'bg-[#0c1a2d] border-[#1b2e46] text-slate-400 hover:text-white hover:bg-[#12243d]'
                            }`}
                    >
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className="bg-emerald-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded font-black">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Metrik Operasional Lapangan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overburden (OB) Hari Ini</h3>
                    <div className="text-2xl font-black text-white">4.850 BCM</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Target Harian: 4.500 BCM (+7%)</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coal / Mineral Getting</h3>
                    <div className="text-2xl font-black text-amber-400">1.820 Ton</div>
                    <p className="mt-2 text-[11px] text-slate-400">Stockpile Pit: 14.200 Ton</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Physical Availability (PA)</h3>
                    <div className="text-2xl font-black text-emerald-400">89.4%</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">22/25 Unit Beroperasi Penuh</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Konsumsi Solar Pit</h3>
                    <div className="text-2xl font-black text-sky-400">6.420 Liter</div>
                    <p className="mt-2 text-[11px] text-slate-400">Burn Rate: 1,32 L/BCM (Efisien)</p>
                </div>
            </div>

            {/* Tabel Status Alat Berat & Front Penambangan */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                    Status Armada Excavator, Dump Truck & Front Penambangan
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Fleet / Kode Unit</th>
                                <th className="pb-2">Tipe Alat Berat</th>
                                <th className="pb-2">Lokasi Pit / Front</th>
                                <th className="pb-2">Operator</th>
                                <th className="pb-2">Status Mekanik</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            <tr>
                                <td className="py-2.5 font-mono text-amber-400 font-bold">EX-401</td>
                                <td className="font-semibold text-white">Komatsu PC400-8R</td>
                                <td>Pit Timur - Loading Point 2</td>
                                <td>Bambang Irawan</td>
                                <td><span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">Operasi Normal</span></td>
                            </tr>
                            <tr>
                                <td className="py-2.5 font-mono text-amber-400 font-bold">EX-402</td>
                                <td className="font-semibold text-white">CAT 349D2L</td>
                                <td>Pit Barat - Stripping OB</td>
                                <td>Dedi Supratman</td>
                                <td><span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">Operasi Normal</span></td>
                            </tr>
                            <tr>
                                <td className="py-2.5 font-mono text-amber-400 font-bold">DZ-801</td>
                                <td className="font-semibold text-white">Komatsu D85ESS-2</td>
                                <td>Disposal Area Blok Utara</td>
                                <td>Agus Santoso</td>
                                <td><span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">Operasi Normal</span></td>
                            </tr>
                            <tr>
                                <td className="py-2.5 font-mono text-rose-400 font-bold">DT-014</td>
                                <td className="font-semibold text-white">Hino 500 Tipper 20T</td>
                                <td>Workshop Utama</td>
                                <td>-</td>
                                <td><span className="bg-rose-950/60 text-rose-400 border border-rose-800/40 px-2 py-0.5 rounded text-[10px]">Breakdown (Ganti Hose)</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}