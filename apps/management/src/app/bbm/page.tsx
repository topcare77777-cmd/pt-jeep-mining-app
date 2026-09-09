'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import NavigationHeader from '@/components/NavigationHeader'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface FuelLog {
    id: string
    created_at?: string
    transaction_type: string
    unit_no: string
    liters: number
    operator_driver: string
    storage_tank: string
    notes?: string
}

export default function FuelManagementPage() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Fuelman Site')
    const [logs, setLogs] = useState<FuelLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Modal State
    const [showModal, setShowModal] = useState(false)
    const [txType, setTxType] = useState('Pengisian')
    const [unitNo, setUnitNo] = useState('')
    const [liters, setLiters] = useState('')
    const [pic, setPic] = useState('')
    const [storageTank, setStorageTank] = useState('Tangki Induk 01 (Kapasitas 45.000 L)')
    const [notes, setNotes] = useState('')
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
                    setUserName(profile?.full_name || 'Fuel & Tank Supervisor')

                    const { data, error } = await supabase
                        .from('fuel_logs')
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

        initFuel()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    // Perhitungan Stok
    const initialStock = 40000
    const totalIn = logs
        .filter((item) => item.transaction_type === 'Penerimaan')
        .reduce((acc, curr) => acc + Number(curr.liters || 0), 0)
    const totalOut = logs
        .filter((item) => item.transaction_type === 'Pengisian')
        .reduce((acc, curr) => acc + Number(curr.liters || 0), 0)
    const currentStock = initialStock + totalIn - totalOut

    const handleAddFuelLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!liters || !pic) return

        setSubmitting(true)

        const payload = {
            transaction_type: txType,
            unit_no: txType === 'Pengisian' ? unitNo.toUpperCase() || 'GENSET / FASILITAS' : unitNo,
            liters: parseFloat(liters),
            operator_driver: pic,
            storage_tank: storageTank,
            notes,
        }

        const { data, error } = await supabase
            .from('fuel_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setLogs([data[0], ...logs])
            setShowModal(false)
            setUnitNo('')
            setLiters('')
            setPic('')
            setNotes('')
        } else {
            alert('Gagal mencatat log BBM: ' + (error?.message || 'Terjadi kesalahan sistem'))
        }

        setSubmitting(false)
    }

    // Filter pencarian live
    const filteredLogs = logs.filter((item) =>
        item.unit_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.operator_driver.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Tangki & Stok Solar...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Global Header */}
            <NavigationHeader
                title="Pusat Manajemen BBM Solar & Tangki Site"
                subtitle="Kontrol Burn Rate, Pengisian Alat Berat, & Penerimaan Tangki"
                userName={userName}
                roleBadge="Fuel & Logistics"
                accentColor="amber"
            />

            {/* Metrik Stok Tangki */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sisa Stok Solar Saat Ini</h3>
                    <div className="text-2xl font-black text-emerald-400">
                        {currentStock.toLocaleString('id-ID')} Liter
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Level Aman Cadangan Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pengisian Unit (Keluar)</h3>
                    <div className="text-2xl font-black text-amber-400">
                        {totalOut.toLocaleString('id-ID')} Liter
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Excavator, DT, & Fasilitas</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Penerimaan (Masuk)</h3>
                    <div className="text-2xl font-black text-sky-400">
                        {totalIn.toLocaleString('id-ID')} Liter
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Dari Vendor Supplier</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kapasitas Tangki Induk</h3>
                    <div className="text-2xl font-black text-white">45.000 Liter</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Sensor Flowmeter Kalibrasi Valid</p>
                </div>
            </div>

            {/* Tabel Log Transaksi BBM */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari unit atau nama operator..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Catat Pengisian / Penerimaan
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Waktu Catat</th>
                                <th className="pb-2">Jenis Transaksi</th>
                                <th className="pb-2">Nomor Unit / Vendor</th>
                                <th className="pb-2 text-right">Volume (Liter)</th>
                                <th className="pb-2">Operator / Driver</th>
                                <th className="pb-2">Tangki Asal</th>
                                <th className="pb-2">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                                            {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : 'Hari ini'}
                                        </td>
                                        <td>
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.transaction_type === 'Penerimaan'
                                                        ? 'bg-sky-950/80 text-sky-400 border border-sky-800/40'
                                                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                    }`}
                                            >
                                                {item.transaction_type}
                                            </span>
                                        </td>
                                        <td className="font-bold text-white font-mono">{item.unit_no}</td>
                                        <td className="font-mono font-bold text-emerald-400 text-right">
                                            {Number(item.liters || 0).toLocaleString('id-ID')} L
                                        </td>
                                        <td>{item.operator_driver}</td>
                                        <td className="text-slate-400">{item.storage_tank}</td>
                                        <td className="text-slate-500">{item.notes || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada log transaksi BBM yang cocok.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input BBM */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pencatatan Solar Lapangan</h2>
                        <form onSubmit={handleAddFuelLog} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Jenis Aktivitas</label>
                                <select
                                    value={txType}
                                    onChange={(e) => setTxType(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                >
                                    <option value="Pengisian">Pengisian ke Unit Lapangan (Keluar)</option>
                                    <option value="Penerimaan">Penerimaan dari Supplier BBM (Masuk)</option>
                                </select>
                            </div>

                            {txType === 'Pengisian' ? (
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor Unit Alat Berat / Truk</label>
                                    <input
                                        type="text"
                                        required
                                        value={unitNo}
                                        onChange={(e) => setUnitNo(e.target.value)}
                                        placeholder="Contoh: EX-02 atau DT-14"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Vendor Supplier Solar</label>
                                    <input
                                        type="text"
                                        required
                                        value={unitNo}
                                        onChange={(e) => setUnitNo(e.target.value)}
                                        placeholder="Contoh: PT Solar Pasifik (16.000 L)"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Volume Solar (Liter)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={liters}
                                    onChange={(e) => setLiters(e.target.value)}
                                    placeholder="Contoh: 350"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Operator / Driver / Petugas Fuelman</label>
                                <input
                                    type="text"
                                    required
                                    value={pic}
                                    onChange={(e) => setPic(e.target.value)}
                                    placeholder="Nama petugas nozzle / penerima"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Tangki Penyimpanan</label>
                                <select
                                    value={storageTank}
                                    onChange={(e) => setStorageTank(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                >
                                    <option value="Tangki Induk 01 (Kapasitas 45.000 L)">Tangki Induk 01 (Kapasitas 45.000 L)</option>
                                    <option value="Fuel Truck Mobile (Kapasitas 5.000 L)">Fuel Truck Mobile (Kapasitas 5.000 L)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Keterangan Tambahan (Opsional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Shift 1 Pit Timur"
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