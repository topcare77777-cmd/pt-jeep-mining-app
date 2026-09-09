'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function DirekturDashboard() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [execName, setExecName] = useState('Dewan Direksi & Komisaris')

    // Metrik Operasional Nikel
    const [totalOreNikel, setTotalOreNikel] = useState(145000) // Ton Ore Nikel
    const [avgGradeNi, setAvgGradeNi] = useState(1.85) // % Ni
    const [totalOB, setTotalOB] = useState(480000) // BCM Overburden
    const [activeFleetCount, setActiveFleetCount] = useState(38)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initExec() {
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
                            refresh_token: refreshToken || '',
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
                    setExecName(profile?.full_name || 'Presiden Direktur PT. JEEP')

                    // Ambil data dari tabel dor_reports jika ada
                    const { data: dorData } = await supabase
                        .from('dor_reports')
                        .select('*')

                    if (dorData && dorData.length > 0) {
                        const sumOre = dorData.reduce((acc, curr) => acc + Number(curr.coal_production_ton || 0), 0)
                        const sumOB = dorData.reduce((acc, curr) => acc + Number(curr.overburden_bcm || 0), 0)
                        if (sumOre > 0) setTotalOreNikel(sumOre)
                        if (sumOB > 0) setTotalOB(sumOB)
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error init executive dashboard:', err)
                if (isMounted) setLoading(false)
            }
        }

        initExec()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const navLinks = [
        { href: '/direktur', label: 'Eksekutif Nikel', icon: '🏛️' },
        { href: '/manager-site', label: 'Pit Penambangan', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/jetty', label: 'Jetty & LCT', icon: '🚢' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal & IUP', icon: '⚖️' },
        { href: '/investor', label: 'Investor', icon: '📈' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Executive Dashboard Nikel PT. JEEP...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Eksekutif */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🏛️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Executive Dashboard Pertambangan Nikel PT. JEEP
                            </h1>
                            <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Live Monitoring Produksi Ore Nikel, Kadar Ni, & Pengapalan Jetty</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{execName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Board of Directors
                                </span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        Keluar ke Beranda
                    </button>
                </div>

                {/* Global Module Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {navLinks.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                        ? 'bg-[#162d47] text-white border-emerald-400/80 shadow-sm'
                                        : 'bg-[#0a1625] text-slate-400 border-[#1b2e46] hover:text-slate-200 hover:bg-[#0f2137]'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </header>

            {/* KPI Utama Nikel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Produksi Ore Nikel</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        {totalOreNikel.toLocaleString('id-ID')} Ton
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Saprolit & Limonit Terambang</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-Rata Kadar Grade Ni</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{avgGradeNi.toFixed(2)}% Ni</div>
                    <p className="mt-2 text-[11px] text-amber-400 font-semibold">Memenuhi Kualitas Ekspor smelter</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stripping Overburden (OB)</h3>
                    <div className="text-2xl font-black text-white font-mono">
                        {totalOB.toLocaleString('id-ID')} BCM
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Pengupasan Lapisan Penutup</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alat Berat Beroperasi</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">{activeFleetCount} Unit</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Ekskavator & DT Siap Produksi</p>
                </div>
            </div>

            {/* Grid Ringkasan Strategis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-6 shadow-lg space-y-4">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>📊</span> Status Kualitas Bijih Nikel (Ore Grade Control)
                    </h2>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center p-3 bg-[#060c14] rounded-lg border border-[#16273c]">
                            <span className="text-slate-300 font-semibold">Ore High Grade (Saprolit &gt; 1.8% Ni)</span>
                            <span className="text-emerald-400 font-mono font-bold">88.500 Ton (61%)</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#060c14] rounded-lg border border-[#16273c]">
                            <span className="text-slate-300 font-semibold">Ore Low Grade (Limonit 1.3% - 1.7% Ni)</span>
                            <span className="text-amber-400 font-mono font-bold">56.500 Ton (39%)</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#060c14] rounded-lg border border-[#16273c]">
                            <span className="text-slate-300 font-semibold">Kadar Air rata-rata (MC %)</span>
                            <span className="text-sky-400 font-mono font-bold">28.4% (Terkontrol)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-6 shadow-lg space-y-4">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>🚢</span> Status Pengapalan & Pelabuhan Jetty Nikel
                    </h2>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center p-3 bg-[#060c14] rounded-lg border border-[#16273c]">
                            <span className="text-slate-300 font-semibold">Tongkang / LCT Loading Aktif</span>
                            <span className="text-cyan-400 font-mono font-bold">2 Armada (Jetty 1 & Jetty 2)</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#060c14] rounded-lg border border-[#16273c]">
                            <span className="text-slate-300 font-semibold">Akumulasi Pengapalan Bulan Ini</span>
                            <span className="text-emerald-400 font-mono font-bold">125.000 Ton Ore</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#060c14] rounded-lg border border-[#16273c]">
                            <span className="text-slate-300 font-semibold">Legalitas IUP & Dokumen Ekspor</span>
                            <span className="text-emerald-400 font-bold">Sah & Valid (Kementerian ESDM)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}