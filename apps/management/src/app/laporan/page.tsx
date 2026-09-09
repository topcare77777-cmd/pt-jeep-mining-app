'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function LaporanPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Staff Operasional')

    // Agregat Data Laporan
    const [totalOb, setTotalOb] = useState(0)
    const [totalCoal, setTotalCoal] = useState(0)
    const [totalRitase, setTotalRitase] = useState(0)
    const [totalNettoCoal, setTotalNettoCoal] = useState(0)
    const [totalFuel, setTotalFuel] = useState(0)
    const [totalExpense, setTotalExpense] = useState(0)
    const [activeUnitsCount, setActiveUnitsCount] = useState(0)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initLaporan() {
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
                    setUserName(profile?.full_name || 'Reporting Administrator')

                    // Tarik data ringkasan produksi
                    const { data: prodData } = await supabase.from('site_production_logs').select('*')
                    if (prodData && prodData.length > 0) {
                        setTotalOb(prodData.reduce((acc, curr) => acc + Number(curr.overburden_bcm || 0), 0))
                        setTotalCoal(prodData.reduce((acc, curr) => acc + Number(curr.coal_getting_ton || 0), 0))
                    }

                    // Tarik data hauling ritase
                    const { data: haulData } = await supabase.from('hauling_logs').select('netto_ton')
                    if (haulData && haulData.length > 0) {
                        setTotalRitase(haulData.length)
                        setTotalNettoCoal(haulData.reduce((acc, curr) => acc + Number(curr.netto_ton || 0), 0))
                    }

                    // Tarik data BBM
                    const { data: fuelData } = await supabase.from('fuel_logs').select('liters, transaction_type')
                    if (fuelData && fuelData.length > 0) {
                        setTotalFuel(
                            fuelData
                                .filter((f) => f.transaction_type === 'Pengisian')
                                .reduce((acc, curr) => acc + Number(curr.liters || 0), 0)
                        )
                    }

                    // Tarik data keuangan
                    const { data: finData } = await supabase.from('finance_transactions').select('amount, transaction_type')
                    if (finData && finData.length > 0) {
                        setTotalExpense(
                            finData
                                .filter((t) => (t.transaction_type || 'expense') === 'expense')
                                .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
                        )
                    }

                    // Tarik data alat berat aktif
                    const { data: fleetData } = await supabase.from('fleet_units').select('status')
                    if (fleetData && fleetData.length > 0) {
                        setActiveUnitsCount(fleetData.filter((u) => u.status === 'OP').length)
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error init laporan:', err)
                if (isMounted) setLoading(false)
            }
        }

        initLaporan()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const handlePrint = () => {
        window.print()
    }

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/ritase', label: 'Ritase', icon: '🚛' },
        { href: '/jetty', label: 'Jetty Port', icon: '🚢' },
        { href: '/lingkungan', label: 'Lingkungan', icon: '🌱' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/adm', label: 'ADM & Surat', icon: '📋' },
        { href: '/hrd', label: 'HRD & K3', icon: '👷‍♂️' },
        { href: '/ga', label: 'GA & Fasilitas', icon: '🚙' },
        { href: '/direktur', label: 'Eksekutif', icon: '🏛️' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Menyusun Data Laporan Operasional Tambang...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Interaktif (Sembunyi Saat Print) */}
            <div className="print:hidden space-y-3 mb-6">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">📄</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Pusat Rekapitulasi & Cetak Dokumen Resmi PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Daily Operation Report (DOR) & Konsolidasi Lapangan</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                        >
                            <span>🖨️</span>
                            <span>Cetak Laporan (PDF)</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                        >
                            Keluar
                        </button>
                    </div>
                </div>

                {/* Module Switcher */}
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
            </div>

            {/* Lembar Laporan Cetak (Kertas A4 Friendly) */}
            <main className="max-w-4xl mx-auto bg-[#0a1625] print:bg-white print:text-black border border-[#1b2e46] print:border-none rounded-xl p-8 shadow-2xl space-y-6">
                {/* Kop Surat Resmi */}
                <div className="border-b-2 border-[#1e3a5f] print:border-black pb-4 text-center">
                    <h2 className="text-xl md:text-2xl font-black tracking-wider uppercase">
                        PT. JANGKAR ENERGI EKA PERKASA
                    </h2>
                    <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                        Site Tambang Batubara: Kutai Barat / Tabang, Kalimantan Timur — Indonesia
                    </p>
                    <div className="inline-block mt-3 px-3 py-1 rounded bg-[#112233] print:bg-gray-200 text-amber-400 print:text-black text-xs font-bold font-mono">
                        REKAPITULASI RESMI OPERASIONAL & KEUANGAN SITE (DOR)
                    </div>
                </div>

                {/* Meta Info Tanggal */}
                <div className="flex justify-between text-xs text-slate-300 print:text-black border-b border-[#1b2e46] print:border-gray-300 pb-3">
                    <div>
                        <span>Tanggal Dokumen: </span>
                        <span className="font-bold">{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                    </div>
                    <div>
                        <span>Status Sinkronisasi: </span>
                        <span className="text-emerald-400 print:text-black font-bold">Terverifikasi Supabase</span>
                    </div>
                </div>

                {/* Tabel Ringkasan Divisi */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-black">
                        1. Metrik Kunci Produksi & Logistik Pit
                    </h3>
                    <table className="w-full text-xs text-left border border-[#1b2e46] print:border-black">
                        <thead className="bg-[#060c14] print:bg-gray-100 text-slate-400 print:text-black">
                            <tr>
                                <th className="p-2.5 border border-[#1b2e46] print:border-black">Indikator Operasional</th>
                                <th className="p-2.5 border border-[#1b2e46] print:border-black text-right">Volume / Tonase</th>
                                <th className="p-2.5 border border-[#1b2e46] print:border-black">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1b2e46] print:divide-black">
                            <tr>
                                <td className="p-2.5 font-semibold">Pengupasan Overburden (OB)</td>
                                <td className="p-2.5 text-right font-mono font-bold text-white print:text-black">
                                    {totalOb.toLocaleString('id-ID')} BCM
                                </td>
                                <td className="p-2.5 text-slate-400 print:text-black">Front Loading Pit Timur & Barat</td>
                            </tr>
                            <tr>
                                <td className="p-2.5 font-semibold">Produksi Batubara (Coal Getting)</td>
                                <td className="p-2.5 text-right font-mono font-bold text-amber-400 print:text-black">
                                    {totalCoal.toLocaleString('id-ID')} Ton
                                </td>
                                <td className="p-2.5 text-slate-400 print:text-black">Stockpile Pit Tambang</td>
                            </tr>
                            <tr>
                                <td className="p-2.5 font-semibold">Ritase Hauling ke Jetty</td>
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-400 print:text-black">
                                    {totalRitase} Rit ({totalNettoCoal.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton)
                                </td>
                                <td className="p-2.5 text-slate-400 print:text-black">Dump Truck Jembatan Timbang</td>
                            </tr>
                            <tr>
                                <td className="p-2.5 font-semibold">Pemakaian BBM Solar Industri</td>
                                <td className="p-2.5 text-right font-mono font-bold text-white print:text-black">
                                    {totalFuel.toLocaleString('id-ID')} Liter
                                </td>
                                <td className="p-2.5 text-slate-400 print:text-black">Unit Excavator, DT, & Genset Camp</td>
                            </tr>
                            <tr>
                                <td className="p-2.5 font-semibold">Kesiapan Armada Pit (Ready Units)</td>
                                <td className="p-2.5 text-right font-mono font-bold text-white print:text-black">
                                    {activeUnitsCount} Unit
                                </td>
                                <td className="p-2.5 text-slate-400 print:text-black">Operating di Pit</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Tabel Ringkasan Keuangan */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-black">
                        2. Realisasi Pengeluaran Kas Site (Finance)
                    </h3>
                    <div className="bg-[#060c14] print:bg-gray-50 border border-[#1b2e46] print:border-black p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <div className="text-xs text-slate-400 print:text-gray-700">Total Akumulasi Transaksi Pengeluaran:</div>
                            <div className="text-xl font-black text-rose-400 print:text-black font-mono mt-1">
                                Rp {totalExpense.toLocaleString('id-ID')}
                            </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-400 print:text-gray-700">
                            <div>BBM Solar, Sparepart, Workshop & Logistik Mess</div>
                            <div className="text-emerald-400 print:text-black font-semibold mt-0.5">✓ Tercatat di Buku Kas Terverifikasi</div>
                        </div>
                    </div>
                </div>

                {/* Kolom Tanda Tangan */}
                <div className="pt-8 border-t border-[#1b2e46] print:border-black grid grid-cols-3 gap-4 text-center text-xs">
                    <div>
                        <p className="text-slate-400 print:text-black">Dibuat Oleh,</p>
                        <div className="h-16"></div>
                        <p className="font-bold border-t border-[#1b2e46] print:border-black pt-1 inline-block min-w-[120px]">
                            {userName}
                        </p>
                        <p className="text-[10px] text-slate-500 print:text-black">Site Administration</p>
                    </div>
                    <div>
                        <p className="text-slate-400 print:text-black">Diperiksa Oleh,</p>
                        <div className="h-16"></div>
                        <p className="font-bold border-t border-[#1b2e46] print:border-black pt-1 inline-block min-w-[120px]">
                            Kepala Teknik Tambang
                        </p>
                        <p className="text-[10px] text-slate-500 print:text-black">KTT / Site Manager</p>
                    </div>
                    <div>
                        <p className="text-slate-400 print:text-black">Mengetahui,</p>
                        <div className="h-16"></div>
                        <p className="font-bold border-t border-[#1b2e46] print:border-black pt-1 inline-block min-w-[120px]">
                            Direktur Utama
                        </p>
                        <p className="text-[10px] text-slate-500 print:text-black">PT. JEEP Pusat</p>
                    </div>
                </div>
            </main>
        </div>
    )
}