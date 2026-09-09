'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface BargingLog {
    id: string
    created_at?: string
    barge_name: string
    tugboat_name: string
    capacity_feet: number
    target_ton: number
    loaded_ton: number
    coal_quality: string
    buyer_name: string
    status: string
    spb_number?: string
}

export default function JettyManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas Jetty')
    const [barges, setBarges] = useState<BargingLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Tongkang Baru
    const [showModal, setShowModal] = useState(false)
    const [bargeName, setBargeName] = useState('')
    const [tugboatName, setTugboatName] = useState('')
    const [capacityFeet, setCapacityFeet] = useState('300')
    const [targetTon, setTargetTon] = useState('')
    const [loadedTon, setLoadedTon] = useState('')
    const [coalQuality, setCoalQuality] = useState('GAR 4200')
    const [buyerName, setBuyerName] = useState('')
    const [status, setStatus] = useState('Loading')
    const [spbNumber, setSpbNumber] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initJetty() {
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
                    setUserName(profile?.full_name || 'Jetty Port Superintendent')

                    const { data, error } = await supabase
                        .from('jetty_barging_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setBarges(data)
                    } else {
                        setBarges([
                            {
                                id: '1',
                                barge_name: 'BG Robby 301',
                                tugboat_name: 'TB Mega Power',
                                capacity_feet: 300,
                                target_ton: 7500,
                                loaded_ton: 7520.4,
                                coal_quality: 'GAR 4200 (Sub-bituminous)',
                                buyer_name: 'PT PLN Energi Primer',
                                status: 'Completed',
                                spb_number: 'SPB/JEEP/09/2026-004',
                            },
                            {
                                id: '2',
                                barge_name: 'BG Marine Star 28',
                                tugboat_name: 'TB Khatulistiwa',
                                capacity_feet: 300,
                                target_ton: 7800,
                                loaded_ton: 4200,
                                coal_quality: 'GAR 3800',
                                buyer_name: 'PT Semen Indonesia',
                                status: 'Loading',
                                spb_number: '-',
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

        initJetty()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddBarge = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bargeName || !targetTon) return

        setSubmitting(true)

        const payload = {
            barge_name: bargeName.toUpperCase(),
            tugboat_name: tugboatName.toUpperCase(),
            capacity_feet: parseInt(capacityFeet) || 300,
            target_ton: parseFloat(targetTon) || 0,
            loaded_ton: parseFloat(loadedTon) || 0,
            coal_quality: coalQuality,
            buyer_name: buyerName,
            status,
            spb_number: spbNumber || null,
        }

        const { data, error } = await supabase
            .from('jetty_barging_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setBarges([data[0], ...barges])
            setShowModal(false)
            setBargeName('')
            setTugboatName('')
            setTargetTon('')
            setLoadedTon('')
            setBuyerName('')
            setSpbNumber('')
        } else {
            alert('Gagal menyimpan jadwal barging: ' + (error?.message || ''))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    // Agregat Muatan Jetty
    const totalShippedTon = barges
        .filter((b) => b.status === 'Completed' || b.status === 'Departed')
        .reduce((acc, curr) => acc + Number(curr.loaded_ton || 0), 0)

    const ongoingLoadingTon = barges
        .filter((b) => b.status === 'Loading')
        .reduce((acc, curr) => acc + Number(curr.loaded_ton || 0), 0)

    const activeBargesCount = barges.filter((b) => b.status === 'Loading' || b.status === 'Berthing').length

    const filteredBarges = barges.filter((item) =>
        item.barge_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tugboat_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.buyer_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/ritase', label: 'Ritase & Timbangan', icon: '🚛' },
        { href: '/jetty', label: 'Pelabuhan Jetty', icon: '🚢' },
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
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Menghubungkan Radar Pelabuhan Jetty & Tongkang...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🚢</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Jetty Port & Coal Barging Terminal PT. JEEP
                            </h1>
                            <p className="text-xs text-cyan-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                                <span>Barge Loading Conveyor, Draught Survey, & SPB Shipping</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Port & Shipping
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

                {/* Module Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {navLinks.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                        ? 'bg-[#162d47] text-white border-cyan-400/80 shadow-sm'
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

            {/* KPI Jetty Port */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Batubara Terkirim (Shipped)</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        {totalShippedTon.toLocaleString('id-ID')} Ton
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Tongkang Selesai Berlayar (SPB)</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sedang Dimuat (Conveyor)</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                        {ongoingLoadingTon.toLocaleString('id-ID')} Ton
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Proses Loading di Jetty Front</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tongkang Aktif di Dermaga</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">
                        {activeBargesCount} Armada
                    </div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">Sandar & Pemuatan Aktif</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Draft Sungai / Kedalaman</h3>
                    <div className="text-2xl font-black text-white font-mono">5.2 Meter</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Aman untuk Tongkang 300 Ft</p>
                </div>
            </div>

            {/* Grid Tabel Tongkang */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama tongkang / buyer..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Jadwal Sandar Tongkang
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Tongkang / Tugboat</th>
                                <th className="pb-2">Ukuran</th>
                                <th className="pb-2">Pembeli / Tujuan</th>
                                <th className="pb-2">Spesifikasi Kalori</th>
                                <th className="pb-2 text-right">Target (Ton)</th>
                                <th className="pb-2 text-right">Terisi (Ton)</th>
                                <th className="pb-2 text-center">Status</th>
                                <th className="pb-2">No. SPB</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredBarges.length > 0 ? (
                                filteredBarges.map((b) => (
                                    <tr key={b.id}>
                                        <td className="py-2.5 font-bold text-white">
                                            <div className="text-cyan-400 font-mono">{b.barge_name}</div>
                                            <div className="text-[10px] text-slate-400">{b.tugboat_name}</div>
                                        </td>
                                        <td className="font-mono text-slate-300">{b.capacity_feet} Feet</td>
                                        <td className="text-slate-200">{b.buyer_name}</td>
                                        <td className="text-slate-400">{b.coal_quality}</td>
                                        <td className="text-right font-mono text-slate-300">{Number(b.target_ton || 0).toLocaleString('id-ID')}</td>
                                        <td className="text-right font-mono font-bold text-emerald-400">
                                            {Number(b.loaded_ton || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === 'Completed' || b.status === 'Departed'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        : b.status === 'Loading'
                                                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                            : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40'
                                                    }`}
                                            >
                                                {b.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-400 font-mono text-[11px]">{b.spb_number || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada tongkang yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Sandar Tongkang */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Jadwal Sandar & Pemuatan Tongkang</h2>
                        <form onSubmit={handleAddBarge} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Tongkang (Barge)</label>
                                    <input
                                        type="text"
                                        required
                                        value={bargeName}
                                        onChange={(e) => setBargeName(e.target.value)}
                                        placeholder="Contoh: BG ROBBY 301"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kapal Tunda (Tugboat)</label>
                                    <input
                                        type="text"
                                        required
                                        value={tugboatName}
                                        onChange={(e) => setTugboatName(e.target.value)}
                                        placeholder="Contoh: TB MEGA POWER"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Ukuran Tongkang</label>
                                    <select
                                        value={capacityFeet}
                                        onChange={(e) => setCapacityFeet(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                                    >
                                        <option value="270">270 Feet (~5.000 Ton)</option>
                                        <option value="300">300 Feet (~7.500–8.000 Ton)</option>
                                        <option value="330">330 Feet (~10.000 Ton)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Target Muat (Ton)</label>
                                    <input
                                        type="number"
                                        required
                                        value={targetTon}
                                        onChange={(e) => setTargetTon(e.target.value)}
                                        placeholder="Contoh: 7500"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Realisasi Terisi (Ton)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={loadedTon}
                                        onChange={(e) => setLoadedTon(e.target.value)}
                                        placeholder="0 atau hasil survey"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Pemuatan</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                                    >
                                        <option value="Berthing">Berthing (Sandar)</option>
                                        <option value="Loading">Loading (Muat Batubara)</option>
                                        <option value="Completed">Completed (Selesai Muat)</option>
                                        <option value="Departed">Departed (Berlayar)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Kualitas Batubara (Seam/Spec)</label>
                                <input
                                    type="text"
                                    value={coalQuality}
                                    onChange={(e) => setCoalQuality(e.target.value)}
                                    placeholder="Contoh: GAR 4200 (Low Ash)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Pembeli / Buyer / Tujuan</label>
                                <input
                                    type="text"
                                    required
                                    value={buyerName}
                                    onChange={(e) => setBuyerName(e.target.value)}
                                    placeholder="Contoh: PT PLN Energi Primer Indonesia"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nomor Surat Persetujuan Berlayar (SPB)</label>
                                <input
                                    type="text"
                                    value={spbNumber}
                                    onChange={(e) => setSpbNumber(e.target.value)}
                                    placeholder="Diisi oleh Syahbandar (jika sudah terbit)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400 font-mono"
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
                                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Data Tongkang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}