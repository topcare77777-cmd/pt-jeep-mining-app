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

    const [totalExpense, setTotalExpense] = useState<number>(0)
    const [totalObBcm, setTotalObBcm] = useState<number>(0)
    const [totalCoalTon, setTotalCoalTon] = useState<number>(0)
    const [productionCount, setProductionCount] = useState<number>(0)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function initDirector() {
            try {
                if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
                    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
                    const accessToken = hashParams.get('access_token')
                    const refreshToken = hashParams.get('refresh_token')

                    if (accessToken && refreshToken) {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
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
                    .single()

                const userStatus = (profile?.status || '').toLowerCase()
                if (profile && userStatus && userStatus !== 'aktif') {
                    alert('Akun Anda dinonaktifkan.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                setDirectorName(profile?.full_name || 'Direktur Utama')

                const { data: financeData } = await supabase
                    .from('finance_transactions')
                    .select('amount')

                if (financeData && financeData.length > 0) {
                    const sumExp = financeData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
                    setTotalExpense(sumExp)
                }

                const { data: prodData } = await supabase
                    .from('site_production_logs')
                    .select('overburden_bcm, coal_getting_ton')

                if (prodData && prodData.length > 0) {
                    setProductionCount(prodData.length)
                    const sumOb = prodData.reduce((acc, curr) => acc + Number(curr.overburden_bcm || 0), 0)
                    const sumCoal = prodData.reduce((acc, curr) => acc + Number(curr.coal_getting_ton || 0), 0)
                    setTotalObBcm(sumOb)
                    setTotalCoalTon(sumCoal)
                }

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
                <p className="text-xs text-slate-400">Menyiapkan Ringkasan Eksekutif Terpadu...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
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

            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'executive', label: 'RINGKASAN EKSEKUTIF', badge: 'LIVE SYNC' },
                    { id: 'financial', label: 'PENGELUARAN & BIAYA SITE', badge: '' },
                    { id: 'production', label: 'TARGET VS REALISASI PIT', badge: '' },
                    { id: 'esg', label: 'COMPLIANCE & LEGALITAS', badge: '100% VALID' },
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pengeluaran Site (Live)</h3>
                    <div className="text-2xl font-black text-amber-400">
                        Rp {totalExpense.toLocaleString('id-ID')}
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Tercatat di Divisi Finance</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Overburden Pit</h3>
                    <div className="text-2xl font-black text-white">
                        {totalObBcm.toLocaleString('id-ID')} BCM
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Dari {productionCount} shift pelaporan</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Produksi Batubara</h3>
                    <div className="text-2xl font-black text-amber-400">
                        {totalCoalTon.toLocaleString('id-ID')} Ton
                    </div>
                    <p className="mt-2 text-[11px] text-slate-300">Siap Angkut ke Jetty Stockpile</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status IUP & Legalitas</h3>
                    <div className="text-2xl font-black text-emerald-400">Aktif & Lengkap</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ RKAB, IPPKH & Lingkungan Valid</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                        Monitoring Konsolidasi Divisi Site (Finance, Produksi, HRD, GA)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#1b2e46] text-slate-400">
                                    <th className="pb-2">Divisi</th>
                                    <th className="pb-2">Status Ringkasan</th>
                                    <th className="pb-2">Metrik Tercatat</th>
                                    <th className="pb-2">Evaluasi Direksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#16273c] text-slate-300">
                                <tr>
                                    <td className="py-3 font-bold text-white">Keuangan Site (Finance)</td>
                                    <td>Arus Pengeluaran Kas Lapangan</td>
                                    <td className="text-amber-400 font-bold">Rp {totalExpense.toLocaleString('id-ID')}</td>
                                    <td><span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">Terkontrol</span></td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-bold text-white">Pit & Produksi Tambang</td>
                                    <td>Overburden & Coal Getting</td>
                                    <td className="text-emerald-400 font-bold">{totalCoalTon.toLocaleString('id-ID')} Ton Coal</td>
                                    <td><span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">Optimal</span></td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-bold text-white">Human Resources (HRD)</td>
                                    <td>Zero Incident K3 & Manpower</td>
                                    <td className="text-sky-400 font-bold">Jam Kerja Selamat Terjaga</td>
                                    <td><span className="bg-sky-950/60 text-sky-400 border border-sky-800/40 px-2 py-0.5 rounded text-[10px]">Sangat Baik</span></td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-bold text-white">General Affair (GA) & ADM</td>
                                    <td>Armada Kendaraan LV & Mess</td>
                                    <td className="text-emerald-400 font-bold">Akomodasi & Logistik Lancar</td>
                                    <td><span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px]">Aman</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Kolom Kanan: Arahan Strategis Direktur & Shortcut PDF */}
                <div className="lg:col-span-4 space-y-4">
                    <a
                        href="/laporan"
                        className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/20 hover:bg-amber-900/30 text-slate-100 transition flex items-center justify-between block shadow-lg cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📑</span>
                            <div>
                                <div className="text-xs font-bold text-amber-400">Download Rekap Laporan Lengkap</div>
                                <div className="text-[10px] text-slate-400">Format Resmi Ringkasan PDF DOR Site</div>
                            </div>
                        </div>
                        <span className="text-amber-400 text-xs">Buka →</span>
                    </a>

                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-3">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Instruksi & Pengawasan Direksi
                        </h3>
                        <div className="bg-[#060c14] border border-[#1b2e46] p-3 rounded-lg text-xs">
                            <span className="text-amber-400 font-bold block mb-1">Optimasi Barging</span>
                            <p className="text-slate-300 text-[11px]">
                                Pastikan seluruh batubara hasil coal getting segera disortir dan dimuat tepat waktu sesuai jadwal sandar tongkang di jetty.
                            </p>
                        </div>
                        <div className="bg-[#060c14] border border-[#1b2e46] p-3 rounded-lg text-xs">
                            <span className="text-emerald-400 font-bold block mb-1">Pengawasan Solar & Vendor</span>
                            <p className="text-slate-300 text-[11px]">
                                Manajer Site dan Finance wajib mencocokkan rasio konsumsi bahan bakar (burn rate) per BCM tiap akhir pekan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}