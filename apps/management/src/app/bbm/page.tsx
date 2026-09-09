'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface FuelItem {
    id: string
    created_at?: string
    transaction_date: string
    transaction_type: string
    unit_code: string
    liters: number
    hour_meter: number
    operator_driver: string
    fuel_man: string
}

export default function FuelManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Fuel Man Supervisor')
    const [fuelLogs, setFuelLogs] = useState<FuelItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Transaksi BBM Baru
    const [showModal, setShowModal] = useState(false)
    const [transactionType, setTransactionType] = useState('Pengisian')
    const [unitCode, setUnitCode] = useState('DT-012')
    const [liters, setLiters] = useState('450')
    const [hourMeter, setHourMeter] = useState('3420.5')
    const [operatorDriver, setOperatorDriver] = useState('')
    const [fuelMan, setFuelMan] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initFuel() {
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
                    setUserName(profile?.full_name || 'Plant & Fuel Superintendent')

                    const { data, error } = await supabase
                        .from('fuel_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setFuelLogs(data)
                    } else {
                        setFuelLogs([
                            {
                                id: '1',
                                transaction_date: '2026-09-09',
                                transaction_type: 'Penerimaan',
                                unit_code: 'TANGKI-UTAMA-01',
                                liters: 32000,
                                hour_meter: 0,
                                operator_driver: 'Supplier PT Solar Pasifik',
                                fuel_man: 'Hendra (Fuel Man)',
                            },
                            {
                                id: '2',
                                transaction_date: '2026-09-09',
                                transaction_type: 'Pengisian',
                                unit_code: 'EX-05 (Excavator PC200)',
                                liters: 450,
                                hour_meter: 4120.0,
                                operator_driver: 'Joko Operator',
                                fuel_man: 'Hendra (Fuel Man)',
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

        initFuel()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddFuelLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!unitCode || !liters) return

        setSubmitting(true)

        const payload = {
            transaction_type: transactionType,
            unit_code: unitCode.toUpperCase(),
            liters: parseFloat(liters) || 0,
            hour_meter: parseFloat(hourMeter) || 0,
            operator_driver: operatorDriver || 'Operator Pit',
            fuel_man: fuelMan || userName,
        }

        const { data, error } = await supabase
            .from('fuel_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setFuelLogs([data[0], ...fuelLogs])
            setShowModal(false)
            setUnitCode('DT-015')
            setLiters('350')
        } else {
            alert('Gagal menyimpan log BBM: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalIncoming = fuelLogs
        .filter((f) => f.transaction_type === 'Penerimaan')
        .reduce((acc, curr) => acc + Number(curr.liters || 0), 0)

    const totalOutgoing = fuelLogs
        .filter((f) => f.transaction_type === 'Pengisian')
        .reduce((acc, curr) => acc + Number(curr.liters || 0), 0)

    const filteredLogs = fuelLogs.filter((item) =>
        item.unit_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.transaction_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.operator_driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fuel_man.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/environment', label: 'Lingkungan', icon: '🌱' },
        { href: '/training', label: 'Pelatihan', icon: '🎓' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/performance', label: 'Kinerja', icon: '⭐' },
        { href: '/investor', label: 'Investor', icon: '📈' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal', icon: '⚖️' },
        { href: '/helpdesk', label: 'Helpdesk', icon: '🛠️' },
        { href: '/assets', label: 'Aset', icon: '🏷️' },
        { href: '/mess', label: 'Mess', icon: '🏠' },
        { href: '/vendor', label: 'Vendor', icon: '🤝' },
        { href: '/radio', label: 'Radio', icon: '📻' },
        { href: '/clinic', label: 'Klinik', icon: '🏥' },
        { href: '/security', label: 'Security', icon: '🛡️' },
        { href: '/ritase', label: 'Ritase', icon: '🚛' },
        { href: '/jetty', label: 'Jetty Port', icon: '🚢' },
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
                <p className="text-xs text-slate-400">Sinkronisasi Logistik BBM Solar Industri...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">⛽</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen BBM Solar Industri PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Stok Tangki Utama, Pengisian Alat Berat, & Efisiensi Burn Rate</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Fuel Management
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
                            <a
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                        ? 'bg-[#162d47] text-white border-amber-400/80 shadow-sm'
                                        : 'bg-[#0a1625] text-slate-400 border-[#1b2e46] hover:text-slate-200 hover:bg-[#0f2137]'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </a>
                        )
                    })}
                </div>
            </header>

            {/* KPI BBM */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Penerimaan BBM</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        {totalIncoming.toLocaleString('id-ID')} Liter
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Suplai Dari Vendor Resmi</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pengisian ke Unit</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                        {totalOutgoing.toLocaleString('id-ID')} Liter
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Konsumsi Alat Berat & DT</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimasi Stok Tangki Utama</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">
                        {(totalIncoming - totalOutgoing).toLocaleString('id-ID')} Liter
                    </div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-semibold">Tersedia di Fuel Station Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rekonsiliasi Fuel</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">Akurat 100%</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Tanpa Selisih Anomali</p>
                </div>
            </div>

            {/* Grid Tabel BBM */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari unit, operator, fuel man..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Catat Transaksi BBM Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Tanggal</th>
                                <th className="pb-2 text-center">Jenis Transaksi</th>
                                <th className="pb-2">Kode Unit / Tangki</th>
                                <th className="pb-2 text-right">Volume (Liter)</th>
                                <th className="pb-2 text-right">Hour Meter (HM)</th>
                                <th className="pb-2">Operator / Driver Penerima</th>
                                <th className="pb-2">Fuel Man Jaga</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((f) => {
                                    const isIncoming = f.transaction_type === 'Penerimaan'
                                    return (
                                        <tr key={f.id}>
                                            <td className="py-2.5 font-mono text-slate-400 text-[11px]">{f.transaction_date}</td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isIncoming
                                                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                        }`}
                                                >
                                                    {f.transaction_type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="font-bold text-white">{f.unit_code}</td>
                                            <td className={`text-right font-mono font-bold ${isIncoming ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {isIncoming ? '+ ' : '- '} {Number(f.liters).toLocaleString('id-ID')} Liter
                                            </td>
                                            <td className="text-right font-mono text-slate-300">{Number(f.hour_meter).toLocaleString('id-ID')} HM</td>
                                            <td className="text-slate-300">{f.operator_driver}</td>
                                            <td className="text-slate-400">{f.fuel_man}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data log BBM yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Transaksi BBM */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Distribusi & Penerimaan BBM Solar</h2>
                        <form onSubmit={handleAddFuelLog} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jenis Transaksi</label>
                                    <select
                                        value={transactionType}
                                        onChange={(e) => setTransactionType(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="Pengisian">Pengisian ke Unit (Outgoing)</option>
                                        <option value="Penerimaan">Penerimaan dari Supplier (Incoming)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kode Unit / Tangki</label>
                                    <input
                                        type="text"
                                        required
                                        value={unitCode}
                                        onChange={(e) => setUnitCode(e.target.value)}
                                        placeholder="Contoh: DT-012 atau EX-05"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Volume (Liter)</label>
                                    <input
                                        type="number"
                                        required
                                        value={liters}
                                        onChange={(e) => setLiters(e.target.value)}
                                        placeholder="450"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Posisi Hour Meter (HM)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={hourMeter}
                                        onChange={(e) => setHourMeter(e.target.value)}
                                        placeholder="3420.5"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Operator / Driver Penerima</label>
                                    <input
                                        type="text"
                                        required
                                        value={operatorDriver}
                                        onChange={(e) => setOperatorDriver(e.target.value)}
                                        placeholder="Nama operator"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Fuel Man (Petugas Dispenser)</label>
                                    <input
                                        type="text"
                                        required
                                        value={fuelMan}
                                        onChange={(e) => setFuelMan(e.target.value)}
                                        placeholder="Nama fuel man"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Log BBM'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}