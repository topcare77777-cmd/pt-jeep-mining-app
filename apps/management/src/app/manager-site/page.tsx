'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ProductionLog {
    id: string
    created_at?: string
    date: string
    shift: string
    overburden_bcm: number
    coal_getting_ton: number
    fuel_consumed_liter: number
    active_units: number
    weather_condition: string
}

export default function ManagerSiteDashboard() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [managerName, setManagerName] = useState('Site Manager')
    const [activeTab, setActiveTab] = useState('produksi')
    const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Modal Input Laporan Harian Pit (DOR)
    const [showModal, setShowModal] = useState(false)
    const [shift, setShift] = useState('Shift 1 (Siang)')
    const [obBcm, setObBcm] = useState('')
    const [coalTon, setCoalTon] = useState('')
    const [fuelLiter, setFuelLiter] = useState('')
    const [activeUnits, setActiveUnits] = useState('24')
    const [weather, setWeather] = useState('Cerah Berawan')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initManager() {
            try {
                if (typeof window !== 'undefined') {
                    let accessToken = ''
                    let refreshToken = ''

                    if (window.location.hash && window.location.hash.includes('access_token')) {
                        const hashClean = window.location.hash.startsWith('#')
                            ? window.location.hash.substring(1)
                            : window.location.hash
                        const hashParams = new URLSearchParams(hashClean)
                        accessToken = hashParams.get('access_token') || ''
                        refreshToken = hashParams.get('refresh_token') || ''
                    } else if (window.location.search && window.location.search.includes('access_token')) {
                        const searchParams = new URLSearchParams(window.location.search)
                        accessToken = searchParams.get('access_token') || ''
                        refreshToken = searchParams.get('refresh_token') || ''
                    }

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
                    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
                        if (currentSession && isMounted) {
                            await loadUserData(currentSession)
                        } else if (!currentSession && isMounted) {
                            window.location.href = landingUrl
                        }
                    })
                    return () => {
                        authListener.subscription.unsubscribe()
                    }
                }

                if (isMounted) {
                    await loadUserData(session)
                }
            } catch (err) {
                console.error('Error init site manager:', err)
                if (isMounted) setLoading(false)
            }
        }

        async function loadUserData(session: any) {
            try {
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

                setManagerName(
                    profile?.full_name ||
                    session.user.user_metadata?.full_name ||
                    session.user.email?.split('@')[0] ||
                    'Kepala Teknik Tambang / Site Manager'
                )

                const { data: logsData, error } = await supabase
                    .from('site_production_logs')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (!error && logsData && logsData.length > 0) {
                    setProductionLogs(logsData)
                } else {
                    setProductionLogs([
                        {
                            id: '1',
                            date: '2026-09-09',
                            shift: 'Shift 1 (Siang)',
                            overburden_bcm: 4850,
                            coal_getting_ton: 1820,
                            fuel_consumed_liter: 6420,
                            active_units: 24,
                            weather_condition: 'Cerah Berawan',
                        },
                        {
                            id: '2',
                            date: '2026-09-08',
                            shift: 'Shift 2 (Malam)',
                            overburden_bcm: 4200,
                            coal_getting_ton: 1650,
                            fuel_consumed_liter: 5890,
                            active_units: 22,
                            weather_condition: 'Hujan Ringan',
                        },
                    ])
                }
            } catch (e) {
                console.error('Error fetching logs:', e)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        initManager()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddProductionLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!obBcm || !coalTon) return

        setSubmitting(true)

        const payload = {
            shift,
            overburden_bcm: parseFloat(obBcm),
            coal_getting_ton: parseFloat(coalTon),
            fuel_consumed_liter: parseFloat(fuelLiter) || 0,
            active_units: parseInt(activeUnits) || 0,
            weather_condition: weather,
        }

        const { data, error } = await supabase
            .from('site_production_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setProductionLogs([data[0], ...productionLogs])
            setShowModal(false)
            setObBcm('')
            setCoalTon('')
            setFuelLiter('')
        } else {
            alert('Gagal menyimpan laporan produksi: ' + (error?.message || 'Terjadi kesalahan sistem'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const filteredLogs = productionLogs.filter((log) =>
        (log.shift || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.weather_condition || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.date || '').includes(searchQuery)
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/ritase', label: 'Ritase & Timbangan', icon: '🚛' },
        { href: '/bbm', label: 'Tangki BBM', icon: '⛽' },
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
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Menghubungkan Komando Site Tambang...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
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

            {/* Nav Tabs Status */}
            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'produksi', label: 'PRODUKSI & OVERBURDEN', badge: `${productionLogs.length} LOG TERDATA` },
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

            {/* Konten Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Action Bar */}
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Input Laporan Shift Baru</div>
                            <div className="text-[10px] text-slate-400">Overburden, Batubara, & BBM</div>
                        </div>
                    </div>

                    <Link
                        href="/laporan"
                        className="p-4 rounded-xl border border-[#1b2e46] bg-[#0c1a2d] hover:bg-[#12243d] hover:border-emerald-500/50 text-slate-200 transition flex items-center gap-3 block"
                    >
                        <span className="text-xl">📄</span>
                        <div>
                            <div className="text-xs font-bold text-emerald-400">Cetak Rekapitulasi DOR</div>
                            <div className="text-[10px] text-slate-400">Format Resmi Laporan Harian Site (PDF)</div>
                        </div>
                    </Link>

                    <Link
                        href="/ritase"
                        className="p-4 rounded-xl border border-[#1b2e46] bg-[#0c1a2d] hover:bg-[#12243d] hover:border-amber-500/50 text-slate-200 transition flex items-center gap-3 block"
                    >
                        <span className="text-xl">🚛</span>
                        <div>
                            <div className="text-xs font-bold text-amber-400">Log Ritase & Timbangan</div>
                            <div className="text-[10px] text-slate-400">Dump Truck ke Jetty Stockpile</div>
                        </div>
                    </Link>

                    <Link
                        href="/bbm"
                        className="p-4 rounded-xl border border-[#1b2e46] bg-[#0c1a2d] hover:bg-[#12243d] hover:border-sky-500/50 text-slate-200 transition flex items-center gap-3 block"
                    >
                        <span className="text-xl">⛽</span>
                        <div>
                            <div className="text-xs font-bold text-sky-400">Manajemen Tangki Solar</div>
                            <div className="text-[10px] text-slate-400">Stok & Burn Rate Bahan Bakar</div>
                        </div>
                    </Link>

                    <div className="p-4 rounded-xl border border-[#16273c] bg-[#0a1625] text-slate-400 space-y-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Database Produksi</span>
                        <div className="text-[11px] flex justify-between">
                            <span>Tabel Supabase</span>
                            <span className="text-emerald-400 font-semibold">site_production_logs</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Total Laporan</span>
                            <span className="text-slate-200 font-bold">{productionLogs.length} entri</span>
                        </div>
                    </div>
                </aside>

                {/* Kolom Kanan: Panel Tabel */}
                <main className="lg:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overburden (OB) Terakhir</h3>
                            <div className="text-2xl font-black text-white">
                                {productionLogs[0]?.overburden_bcm ? Number(productionLogs[0].overburden_bcm).toLocaleString('id-ID') : 0} BCM
                            </div>
                            <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Target Stripping Tercapai</p>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coal Getting Terakhir</h3>
                            <div className="text-2xl font-black text-amber-400">
                                {productionLogs[0]?.coal_getting_ton ? Number(productionLogs[0].coal_getting_ton).toLocaleString('id-ID') : 0} Ton
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400">Stockpile Pit Siap Hauling</p>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kesiapan Armada Pit</h3>
                            <div className="text-2xl font-black text-emerald-400">
                                {productionLogs[0]?.active_units || 24} Unit
                            </div>
                            <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Excavator & Hauler Ready</p>
                        </div>
                    </div>

                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                            <div className="w-full md:w-72">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari shift, tanggal, cuaca..."
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-bold px-3.5 py-2 rounded-lg transition cursor-pointer"
                            >
                                + Input Shift Baru
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">Tanggal & Shift</th>
                                        <th className="pb-2">Overburden (BCM)</th>
                                        <th className="pb-2">Coal Getting (Ton)</th>
                                        <th className="pb-2">BBM Solar (Liter)</th>
                                        <th className="pb-2">Armada Aktif</th>
                                        <th className="pb-2">Cuaca</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {filteredLogs.length > 0 ? (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td className="py-2.5 font-bold text-white">
                                                    {log.date ? String(log.date) : 'Hari ini'} • {log.shift}
                                                </td>
                                                <td className="font-semibold text-emerald-400 font-mono">
                                                    {Number(log.overburden_bcm || 0).toLocaleString('id-ID')} BCM
                                                </td>
                                                <td className="font-semibold text-amber-400 font-mono">
                                                    {Number(log.coal_getting_ton || 0).toLocaleString('id-ID')} Ton
                                                </td>
                                                <td className="text-slate-300 font-mono">
                                                    {Number(log.fuel_consumed_liter || 0).toLocaleString('id-ID')} L
                                                </td>
                                                <td>{log.active_units} Unit</td>
                                                <td>
                                                    <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                        {log.weather_condition || 'Normal'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                                                Tidak ada catatan shift yang sesuai dengan pencarian.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Form Tambah Laporan Produksi */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Laporan Produksi Harian (DOR)</h2>
                        <form onSubmit={handleAddProductionLog} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Shift Operasional</label>
                                <select
                                    value={shift}
                                    onChange={(e) => setShift(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                >
                                    <option value="Shift 1 (Siang)">Shift 1 (Siang: 07:00 – 18:00)</option>
                                    <option value="Shift 2 (Malam)">Shift 2 (Malam: 19:00 – 06:00)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Overburden (BCM)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={obBcm}
                                        onChange={(e) => setObBcm(e.target.value)}
                                        placeholder="Contoh: 4500"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Coal Getting (Ton)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={coalTon}
                                        onChange={(e) => setCoalTon(e.target.value)}
                                        placeholder="Contoh: 1800"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Konsumsi Solar (Liter)</label>
                                    <input
                                        type="number"
                                        value={fuelLiter}
                                        onChange={(e) => setFuelLiter(e.target.value)}
                                        placeholder="Contoh: 6200"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Armada Aktif (Unit)</label>
                                    <input
                                        type="number"
                                        value={activeUnits}
                                        onChange={(e) => setActiveUnits(e.target.value)}
                                        placeholder="24"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Kondisi Cuaca Pit</label>
                                <select
                                    value={weather}
                                    onChange={(e) => setWeather(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                >
                                    <option value="Cerah">Cerah</option>
                                    <option value="Cerah Berawan">Cerah Berawan</option>
                                    <option value="Hujan Ringan (Slippery)">Hujan Ringan (Slippery)</option>
                                    <option value="Hujan Lebat (Rain Out)">Hujan Lebat (Rain Out)</option>
                                </select>
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
                                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Laporan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}