'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import NavigationHeader from '@/components/NavigationHeader'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface HaulingLog {
    id: string
    created_at?: string
    truck_no: string
    driver_name: string
    gross_ton: number
    tare_ton: number
    netto_ton: number
    loading_point: string
    dumping_point: string
    status: string
}

export default function RitasePage() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas Timbangan')
    const [logs, setLogs] = useState<HaulingLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Modal Input Ritase
    const [showModal, setShowModal] = useState(false)
    const [truckNo, setTruckNo] = useState('')
    const [driverName, setDriverName] = useState('')
    const [gross, setGross] = useState('')
    const [tare, setTare] = useState('')
    const [loadingPoint, setLoadingPoint] = useState('Front Pit Timur')
    const [dumpingPoint, setDumpingPoint] = useState('Stockpile Jetty A')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initHauling() {
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
                    setUserName(profile?.full_name || 'Operator Weighbridge')

                    const { data, error } = await supabase
                        .from('hauling_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data) {
                        setLogs(data)
                    }
                    setLoading(false)
                }
            } catch (err) {
                console.error(err)
                if (isMounted) setLoading(false)
            }
        }

        initHauling()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddRitase = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!truckNo || !driverName) return

        setSubmitting(true)
        const grossVal = parseFloat(gross) || 0
        const tareVal = parseFloat(tare) || 0
        const nettoVal = grossVal > tareVal ? grossVal - tareVal : 0

        const payload = {
            truck_no: truckNo.toUpperCase(),
            driver_name: driverName,
            gross_ton: grossVal,
            tare_ton: tareVal,
            netto_ton: nettoVal,
            loading_point: loadingPoint,
            dumping_point: dumpingPoint,
            status: 'Selesai Timbang',
        }

        const { data, error } = await supabase
            .from('hauling_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setLogs([data[0], ...logs])
            setShowModal(false)
            setTruckNo('')
            setDriverName('')
            setGross('')
            setTare('')
        } else {
            alert('Gagal menyimpan tiket ritase: ' + (error?.message || ''))
        }
        setSubmitting(false)
    }

    // Filter pencarian live (nomor unit atau nama driver)
    const filteredLogs = logs.filter((item) =>
        item.truck_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.driver_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalNetto = logs.reduce((acc, curr) => acc + Number(curr.netto_ton || 0), 0)

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Jembatan Timbang & Ritase...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Global Header */}
            <NavigationHeader
                title="Tiket & Rekap Timbangan Hauling (Ritase)"
                subtitle="Verifikasi Tonase Dump Truck Pit ke Jetty Stockpile"
                userName={userName}
                roleBadge="Weighbridge Admin"
                accentColor="amber"
            />

            {/* Ringkasan Cepat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Muatan Bersih (Netto)</h3>
                    <div className="text-2xl font-black text-emerald-400">
                        {totalNetto.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ton
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Batubara siap barging / tongkang</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Ritase Selesai</h3>
                    <div className="text-2xl font-black text-amber-400">
                        {logs.length} Rit
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Tercatat di jembatan timbang</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-Rata Muatan / Unit</h3>
                    <div className="text-2xl font-black text-white">
                        {logs.length > 0 ? (totalNetto / logs.length).toFixed(2) : '0.00'} Ton
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Payload sesuai kapasitas jalan hauling</p>
                </div>
            </div>

            {/* Konten Utama */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari no lambung / driver..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Tiket Ritase Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Waktu</th>
                                <th className="pb-2">No. Lambung</th>
                                <th className="pb-2">Driver</th>
                                <th className="pb-2 text-right">Gross (Ton)</th>
                                <th className="pb-2 text-right">Tare (Ton)</th>
                                <th className="pb-2 text-right">Netto (Ton)</th>
                                <th className="pb-2">Loading Point</th>
                                <th className="pb-2">Dumping Point</th>
                                <th className="pb-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                                            {item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="py-2.5 font-bold font-mono text-amber-400">{item.truck_no}</td>
                                        <td className="text-white font-medium">{item.driver_name}</td>
                                        <td className="text-right font-mono">{Number(item.gross_ton || 0).toFixed(2)}</td>
                                        <td className="text-right font-mono">{Number(item.tare_ton || 0).toFixed(2)}</td>
                                        <td className="text-right font-bold text-emerald-400 font-mono">{Number(item.netto_ton || 0).toFixed(2)}</td>
                                        <td className="text-slate-400">{item.loading_point}</td>
                                        <td className="text-slate-400">{item.dumping_point}</td>
                                        <td className="text-center">
                                            <span className="bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 px-2 py-0.5 rounded text-[10px]">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada tiket ritase yang cocok.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Ritase */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tiket Timbangan Ritase Baru</h2>
                        <form onSubmit={handleAddRitase} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Lambung DT</label>
                                    <input
                                        type="text"
                                        required
                                        value={truckNo}
                                        onChange={(e) => setTruckNo(e.target.value)}
                                        placeholder="Contoh: DT-104"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Driver</label>
                                    <input
                                        type="text"
                                        required
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        placeholder="Contoh: Samsul"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Gross / Bruto (Ton)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={gross}
                                        onChange={(e) => setGross(e.target.value)}
                                        placeholder="32.50"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tare / Kosong (Ton)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={tare}
                                        onChange={(e) => setTare(e.target.value)}
                                        placeholder="12.10"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Loading Point (Pit)</label>
                                <input
                                    type="text"
                                    value={loadingPoint}
                                    onChange={(e) => setLoadingPoint(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Dumping Point (Stockpile/Jetty)</label>
                                <input
                                    type="text"
                                    value={dumpingPoint}
                                    onChange={(e) => setDumpingPoint(e.target.value)}
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Tiket Timbangan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}