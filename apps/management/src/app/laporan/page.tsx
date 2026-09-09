'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface DorReport {
    id: string
    created_at?: string
    report_date: string
    pit_location: string
    overburden_bcm: number
    coal_production_ton: number // Menggambarkan produksi ore nikel
    heavy_equipment_units: number
    weather_condition: string
    supervisor_name: string
}

export default function LaporanPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Superintendent Produksi')
    const [reports, setReports] = useState<DorReport[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Laporan DOR Baru
    const [showModal, setShowModal] = useState(false)
    const [pitLocation, setPitLocation] = useState('Pit Nikel Utama (Blok A)')
    const [overburdenBcm, setOverburdenBcm] = useState('3500')
    const [oreProductionTon, setOreProductionTon] = useState('1200')
    const [heavyEquipmentUnits, setHeavyEquipmentUnits] = useState('14')
    const [weatherCondition, setWeatherCondition] = useState('Cerah Berawan')
    const [supervisorName, setSupervisorName] = useState('')
    const [submitting, setSubmitting] = useState(false)

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
                    setUserName(profile?.full_name || 'Production Superintendent')

                    const { data, error } = await supabase
                        .from('dor_reports')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setReports(data)
                    } else {
                        setReports([
                            {
                                id: '1',
                                report_date: '2026-09-09',
                                pit_location: 'Pit Nikel Utama (Blok A)',
                                overburden_bcm: 3800,
                                coal_production_ton: 1250, // Ore Nikel Ton
                                heavy_equipment_units: 14,
                                weather_condition: 'Cerah',
                                supervisor_name: 'Slamet Riyadi',
                            },
                            {
                                id: '2',
                                report_date: '2026-09-08',
                                pit_location: 'Pit Ekspansi (Blok B)',
                                overburden_bcm: 4200,
                                coal_production_ton: 1400, // Ore Nikel Ton
                                heavy_equipment_units: 16,
                                weather_condition: 'Hujan Ringan',
                                supervisor_name: 'Dedi Saputra',
                            },
                        ])
                    }
                    setLoading(false)
                }
            } catch (err) {
                console.error(err)
                if (isMounted) setLoading(false)
            }
        }

        initLaporan()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddReport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pitLocation) return

        setSubmitting(true)

        const payload = {
            pit_location: pitLocation,
            overburden_bcm: parseFloat(overburdenBcm) || 0,
            coal_production_ton: parseFloat(oreProductionTon) || 0, // Ore Nikel
            heavy_equipment_units: parseInt(heavyEquipmentUnits) || 10,
            weather_condition: weatherCondition,
            supervisor_name: supervisorName || userName,
        }

        const { data, error } = await supabase
            .from('dor_reports')
            .insert([payload])
            .select()

        if (!error && data) {
            setReports([data[0], ...reports])
            setShowModal(false)
            setOverburdenBcm('3500')
            setOreProductionTon('1200')
        } else {
            alert('Gagal menyimpan laporan DOR: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalOre = reports.reduce((acc, curr) => acc + Number(curr.coal_production_ton || 0), 0)
    const totalOB = reports.reduce((acc, curr) => acc + Number(curr.overburden_bcm || 0), 0)

    const filteredReports = reports.filter((item) =>
        item.pit_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supervisor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.weather_condition.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/laporan', label: 'Cetak Laporan DOR', icon: '📄' },
        { href: '/direktur', label: 'Eksekutif Nikel', icon: '🏛️' },
        { href: '/manager-site', label: 'Pit Penambangan', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/jetty', label: 'Jetty & LCT', icon: '🚢' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal & IUP', icon: '⚖️' },
        { href: '/investor', label: 'Investor', icon: '📈' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Laporan Harian Operasi Nikel (DOR)...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">📄</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Cetak & Rekap Laporan Harian Operasi (DOR) Nikel PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Dokumentasi Produksi Ore Nikel, Overburden, & Kinerja Alat Berat Harian</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Reporting Dept
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

            {/* KPI Laporan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Akumulasi Ore Nikel</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        {totalOre.toLocaleString('id-ID')} Ton
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Bijih Nikel Siap Kirim</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Stripping Overburden</h3>
                    <div className="text-2xl font-black text-white font-mono">
                        {totalOB.toLocaleString('id-ID')} BCM
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Lapisan Tanah Penutup</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Laporan Tercatat</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{reports.length} Laporan</div>
                    <p className="mt-2 text-[11px] text-slate-400">Arsip DOR Site Tervalidasi</p>
                </div>
            </div>

            {/* Grid Tabel Laporan */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari pit, supervisor, cuaca..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="bg-[#1b2e46] hover:bg-[#253f5e] text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                        >
                            🖨️ Cetak Laporan (PDF)
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                        >
                            + Buat DOR Nikel Baru
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Tanggal</th>
                                <th className="pb-2">Lokasi Pit Penambangan</th>
                                <th className="pb-2 text-right">Overburden (OB)</th>
                                <th className="pb-2 text-right">Produksi Ore Nikel</th>
                                <th className="pb-2 text-center">Alat Beroperasi</th>
                                <th className="pb-2">Kondisi Cuaca</th>
                                <th className="pb-2">Supervisor (Pengawas)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((r) => (
                                    <tr key={r.id}>
                                        <td className="py-2.5 font-mono text-slate-400 text-[11px]">{r.report_date}</td>
                                        <td className="font-bold text-white">{r.pit_location}</td>
                                        <td className="text-right font-mono text-slate-300">
                                            {Number(r.overburden_bcm).toLocaleString('id-ID')} BCM
                                        </td>
                                        <td className="text-right font-mono font-bold text-emerald-400">
                                            {Number(r.coal_production_ton).toLocaleString('id-ID')} Ton Ore
                                        </td>
                                        <td className="text-center font-mono text-slate-300">{r.heavy_equipment_units} Unit</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {r.weather_condition}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{r.supervisor_name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada laporan DOR yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input DOR */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Buat Laporan Harian Operasi (DOR) Nikel</h2>
                        <form onSubmit={handleAddReport} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Lokasi Pit Penambangan</label>
                                <input
                                    type="text"
                                    required
                                    value={pitLocation}
                                    onChange={(e) => setPitLocation(e.target.value)}
                                    placeholder="Contoh: Pit Nikel Utama (Blok A)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Overburden (BCM)</label>
                                    <input
                                        type="number"
                                        required
                                        value={overburdenBcm}
                                        onChange={(e) => setOverburdenBcm(e.target.value)}
                                        placeholder="3500"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Produksi Ore Nikel (Ton)</label>
                                    <input
                                        type="number"
                                        required
                                        value={oreProductionTon}
                                        onChange={(e) => setOreProductionTon(e.target.value)}
                                        placeholder="1200"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jumlah Alat Berat Aktif</label>
                                    <input
                                        type="number"
                                        required
                                        value={heavyEquipmentUnits}
                                        onChange={(e) => setHeavyEquipmentUnits(e.target.value)}
                                        placeholder="14"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kondisi Cuaca</label>
                                    <select
                                        value={weatherCondition}
                                        onChange={(e) => setWeatherCondition(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Cerah">Cerah</option>
                                        <option value="Cerah Berawan">Cerah Berawan</option>
                                        <option value="Hujan Ringan">Hujan Ringan</option>
                                        <option value="Hujan Lebat (Stop Pit)">Hujan Lebat (Stop Pit)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Supervisor (Pengawas Lapangan)</label>
                                <input
                                    type="text"
                                    required
                                    value={supervisorName}
                                    onChange={(e) => setSupervisorName(e.target.value)}
                                    placeholder="Nama pengawas pit"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-[#1b2e46] text-slate-400 hover:text-white text-xs transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Laporan DOR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}