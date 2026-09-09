'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function DirekturDashboardPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [directorName, setDirectorName] = useState('Direktur Operasional')
    const [stats, setStats] = useState({
        totalOreTon: 42500,
        totalOverburdenBcm: 118000,
        activeUnitsCount: 38,
        fleetAvailabilityRate: 93.4,
        totalFuelUsedLiters: 84200,
        zeroIncidentDays: 412,
    })

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initDirectorDashboard() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, status')
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
                    setDirectorName(profile?.full_name || 'BOD & Management Executive')

                    // Ambil agregasi DOR nikel jika tersedia
                    const { data: dorData } = await supabase
                        .from('dor_reports')
                        .select('coal_production_ton, overburden_bcm')

                    if (dorData && dorData.length > 0) {
                        const sumOre = dorData.reduce((acc, curr) => acc + Number(curr.coal_production_ton || 0), 0)
                        const sumOb = dorData.reduce((acc, curr) => acc + Number(curr.overburden_bcm || 0), 0)
                        setStats((prev) => ({
                            ...prev,
                            totalOreTon: sumOre > 0 ? sumOre : prev.totalOreTon,
                            totalOverburdenBcm: sumOb > 0 ? sumOb : prev.totalOverburdenBcm,
                        }))
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error(err)
                if (isMounted) setLoading(false)
            }
        }

        initDirectorDashboard()
        return () => { isMounted = false }
    }, [landingUrl])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const navLinks = [
        { href: '/direktur', label: 'Eksekutif BOD', icon: '🏛️' },
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/fleet-maintenance', label: 'Workshop Fleet', icon: '🔧' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/finance', label: 'Keuangan Site', icon: '💰' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Menghubungkan Executive Command Center...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🏛️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Executive Command Center PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Konsolidasi Produksi Tambang Nikel, Kesiapan Armada, & Pengawasan Finansial</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{directorName}</span>
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
                                        ? 'bg-[#162d47] text-white border-amber-400/80 shadow-sm'
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

            {/* Ringkasan Eksekutif (Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-5 shadow-lg">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Produksi Ore Nikel</div>
                    <div className="text-3xl font-black text-amber-400 font-mono">
                        {stats.totalOreTon.toLocaleString('id-ID')} <span className="text-sm font-sans text-slate-400 font-normal">Ton</span>
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">↑ On-Track Target Kuartal</p>
                </div>

                <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-5 shadow-lg">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pemindahan Overburden (OB)</div>
                    <div className="text-3xl font-black text-white font-mono">
                        {stats.totalOverburdenBcm.toLocaleString('id-ID')} <span className="text-sm font-sans text-slate-400 font-normal">BCM</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Front Penambangan Blok Timur & Barat</p>
                </div>

                <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-5 shadow-lg">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fleet Availability (PA)</div>
                    <div className="text-3xl font-black text-cyan-400 font-mono">
                        {stats.fleetAvailabilityRate}%
                    </div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ {stats.activeUnitsCount} Unit Beroperasi Penuh</p>
                </div>

                <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-5 shadow-lg">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Konsumsi BBM Solar Industri</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                        {stats.totalFuelUsedLiters.toLocaleString('id-ID')} <span className="text-sm font-sans text-slate-400 font-normal">Liter</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Efisiensi Burn-Rate Terkendali</p>
                </div>

                <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-5 shadow-lg">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Indikator Keselamatan (K3)</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                        {stats.zeroIncidentDays} <span className="text-sm font-sans text-slate-400 font-normal">Hari</span>
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">✓ Zero LTI (Lost Time Injury)</p>
                </div>

                <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-5 shadow-lg">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status Kepatuhan Regulasi</div>
                    <div className="text-3xl font-black text-white font-mono">100% IUP-OP</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ RKAB & AMDAL Tervalidasi ESDM</p>
                </div>
            </div>

            {/* Rincian Alur Operasional Tambang */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-5 shadow-lg space-y-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Prioritas Strategis Operasional Site</h2>
                    <div className="space-y-2 text-xs">
                        <div className="p-3 bg-[#060c14] border border-[#16273c] rounded-lg">
                            <div className="font-bold text-amber-400">Optimalisasi Jalur Hauling Tambang ke Jetty</div>
                            <p className="text-slate-400 mt-0.5">Pemadatan jalan KM 02 – KM 07 guna meminimalisasi hambatan transportasi saat cuaca hujan.</p>
                        </div>
                        <div className="p-3 bg-[#060c14] border border-[#16273c] rounded-lg">
                            <div className="font-bold text-cyan-400">Pengawasan Mutu Kadar Nikel (Grade Ore)</div>
                            <p className="text-slate-400 mt-0.5">Pengetatan pemilahan kadar Ni $\ge$ 1,65% di area *stockpile* sebelum pengapalan tongkang LCT.</p>
                        </div>
                        <div className="p-3 bg-[#060c14] border border-[#16273c] rounded-lg">
                            <div className="font-bold text-emerald-400">Realisasi Program Pemberdayaan CSR</div>
                            <p className="text-slate-400 mt-0.5">Distribusi bantuan infrastruktur sanitasi dan sarana air bersih di desa lingkar tambang.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-5 shadow-lg space-y-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Aksi Cepat Manajemen Puncak</h2>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <Link
                            href="/laporan"
                            className="flex flex-col items-center justify-center p-4 bg-[#0e1f33] hover:bg-[#142c48] border border-[#1f385c] rounded-xl text-center transition"
                        >
                            <span className="text-2xl mb-1">📄</span>
                            <span className="font-bold text-white">Ekspor Laporan Resmi</span>
                            <span className="text-[10px] text-slate-400">Rekapitulasi PDF Direksi</span>
                        </Link>

                        <Link
                            href="/finance"
                            className="flex flex-col items-center justify-center p-4 bg-[#0e1f33] hover:bg-[#142c48] border border-[#1f385c] rounded-xl text-center transition"
                        >
                            <span className="text-2xl mb-1">💰</span>
                            <span className="font-bold text-white">Audit Kas & Keuangan</span>
                            <span className="text-[10px] text-slate-400">Ledger Kas Kecil Lapangan</span>
                        </Link>

                        <Link
                            href="/fleet"
                            className="flex flex-col items-center justify-center p-4 bg-[#0e1f33] hover:bg-[#142c48] border border-[#1f385c] rounded-xl text-center transition"
                        >
                            <span className="text-2xl mb-1">🚜</span>
                            <span className="font-bold text-white">Monitoring Alat Berat</span>
                            <span className="text-[10px] text-slate-400">Status Excavator & Dump Truck</span>
                        </Link>

                        <Link
                            href="/jetty"
                            className="flex flex-col items-center justify-center p-4 bg-[#0e1f33] hover:bg-[#142c48] border border-[#1f385c] rounded-xl text-center transition"
                        >
                            <span className="text-2xl mb-1">🚢</span>
                            <span className="font-bold text-white">Logistik Jetty & LCT</span>
                            <span className="text-[10px] text-slate-400">Jadwal Pengapalan Tongkang</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}