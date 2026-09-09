'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface SparepartItem {
    id: string
    created_at?: string
    part_number: string
    part_name: string
    category: string
    unit_model: string
    stock_qty: number
    min_stock_qty: number
    rack_location: string
    unit_measure: string
    notes?: string
}

export default function SparepartWarehousePage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas Gudang')
    const [items, setItems] = useState<SparepartItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Sparepart Baru
    const [showModal, setShowModal] = useState(false)
    const [partNumber, setPartNumber] = useState('')
    const [partName, setPartName] = useState('')
    const [category, setCategory] = useState('Filter')
    const [unitModel, setUnitModel] = useState('Komatsu PC400')
    const [stockQty, setStockQty] = useState('')
    const [minStockQty, setMinStockQty] = useState('5')
    const [rackLocation, setRackLocation] = useState('Rak A-01')
    const [unitMeasure, setUnitMeasure] = useState('Pcs')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initWarehouse() {
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
                    setUserName(profile?.full_name || 'Warehouse Supervisor')

                    const { data, error } = await supabase
                        .from('warehouse_spareparts')
                        .select('*')
                        .order('part_name', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setItems(data)
                    } else {
                        setItems([
                            {
                                id: '1',
                                part_number: '600-211-1340',
                                part_name: 'Engine Oil Filter Cartridge',
                                category: 'Filter',
                                unit_model: 'Komatsu PC400LC-8',
                                stock_qty: 18,
                                min_stock_qty: 6,
                                rack_location: 'Rak FL-01',
                                unit_measure: 'Pcs',
                            },
                            {
                                id: '2',
                                part_number: '208-70-14152',
                                part_name: 'Bucket Teeth Point Tiger',
                                category: 'Undercarriage & GET',
                                unit_model: 'Komatsu PC400LC-8',
                                stock_qty: 4,
                                min_stock_qty: 8,
                                rack_location: 'Rak UC-03',
                                unit_measure: 'Pcs',
                            },
                            {
                                id: '3',
                                part_number: 'TY-1200R24',
                                part_name: 'Radial Hauler Tyre 12.00R24',
                                category: 'Tyre',
                                unit_model: 'Dump Truck Scania P380',
                                stock_qty: 8,
                                min_stock_qty: 4,
                                rack_location: 'Area Ban Gudang B',
                                unit_measure: 'Pcs',
                            },
                            {
                                id: '4',
                                part_number: 'HYD-HOSE-08',
                                part_name: 'Hydraulic High Pressure Hose 1/2 Inch',
                                category: 'Hydraulic',
                                unit_model: 'All Heavy Units',
                                stock_qty: 2,
                                min_stock_qty: 5,
                                rack_location: 'Rak HYD-02',
                                unit_measure: 'Roll',
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

        initWarehouse()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddSparepart = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!partNumber || !partName) return

        setSubmitting(true)

        const payload = {
            part_number: partNumber.toUpperCase().trim(),
            part_name: partName,
            category,
            unit_model: unitModel,
            stock_qty: parseInt(stockQty) || 0,
            min_stock_qty: parseInt(minStockQty) || 5,
            rack_location: rackLocation,
            unit_measure: unitMeasure,
        }

        const { data, error } = await supabase
            .from('warehouse_spareparts')
            .insert([payload])
            .select()

        if (!error && data) {
            setItems([...items, data[0]])
            setShowModal(false)
            setPartNumber('')
            setPartName('')
            setStockQty('')
        } else {
            alert('Gagal mendaftarkan sparepart: ' + (error?.message || 'Nomor part mungkin sudah ada.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    // Ringkasan Inventaris
    const totalSku = items.length
    const totalStockUnits = items.reduce((acc, curr) => acc + Number(curr.stock_qty || 0), 0)
    const lowStockItems = items.filter((item) => item.stock_qty <= item.min_stock_qty)

    const filteredItems = items.filter((item) =>
        item.part_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.unit_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/sparepart', label: 'Gudang Sparepart', icon: '📦' },
        { href: '/ritase', label: 'Ritase & Timbangan', icon: '🚛' },
        { href: '/jetty', label: 'Pelabuhan Jetty', icon: '🚢' },
        { href: '/lingkungan', label: 'Reklamasi Lingkungan', icon: '🌱' },
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
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Logistik Suku Cadang & Gudang Site...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">📦</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Gudang Suku Cadang & Logistik Site PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Spareparts Inventory, Fast-Moving Stock, & Bin-Rack Management</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Warehouse Dept
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

            {/* KPI Inventaris */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Jenis Suku Cadang (SKU)</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalSku} Item</div>
                    <p className="mt-2 text-[11px] text-slate-400">Terdaftar di Katalog Gudang</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Stok Fisik Tersedia</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        {totalStockUnits.toLocaleString('id-ID')} Pcs
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Siap Pakai untuk Perbaikan Unit</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Peringatan Stok Minimum</h3>
                    <div className={`text-2xl font-black font-mono ${lowStockItems.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {lowStockItems.length} Item
                    </div>
                    <p className="mt-2 text-[11px] text-rose-400/80 font-medium">Perlu Segera Diterbitkan PR</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kesiapan Sparepart Plant</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                        {totalSku > 0 ? (((totalSku - lowStockItems.length) / totalSku) * 100).toFixed(0) : 100}% Ready
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Mendukung Kesiapan Alat (PA/MA)</p>
                </div>
            </div>

            {/* Grid Tabel Inventaris */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari part number, nama part, unit..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Daftarkan Part Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Part Number (P/N)</th>
                                <th className="pb-2">Nama Suku Cadang</th>
                                <th className="pb-2">Kategori</th>
                                <th className="pb-2">Peruntukan Alat</th>
                                <th className="pb-2 text-center">Lokasi Rak</th>
                                <th className="pb-2 text-right">Stok Fisik</th>
                                <th className="pb-2 text-right">Batas Min</th>
                                <th className="pb-2 text-center">Status Stok</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    const isLow = item.stock_qty <= item.min_stock_qty
                                    return (
                                        <tr key={item.id}>
                                            <td className="py-2.5 font-bold font-mono text-amber-400">{item.part_number}</td>
                                            <td className="font-semibold text-white">{item.part_name}</td>
                                            <td className="text-slate-400">{item.category}</td>
                                            <td className="text-slate-300">{item.unit_model}</td>
                                            <td className="text-center font-mono text-slate-400">{item.rack_location}</td>
                                            <td className={`text-right font-mono font-bold ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {item.stock_qty} {item.unit_measure}
                                            </td>
                                            <td className="text-right font-mono text-slate-400">{item.min_stock_qty} {item.unit_measure}</td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLow
                                                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        }`}
                                                >
                                                    {isLow ? 'REORDER' : 'AMAN'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada suku cadang yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Part */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Katalog Suku Cadang Baru</h2>
                        <form onSubmit={handleAddSparepart} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Part Number (Pabrikan)</label>
                                <input
                                    type="text"
                                    required
                                    value={partNumber}
                                    onChange={(e) => setPartNumber(e.target.value)}
                                    placeholder="Contoh: 6732-71-6120"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Suku Cadang / Komponen</label>
                                <input
                                    type="text"
                                    required
                                    value={partName}
                                    onChange={(e) => setPartName(e.target.value)}
                                    placeholder="Contoh: Fuel Filter Cartridge"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori Part</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Filter">Filter (Oli, Solar, Udara)</option>
                                        <option value="Undercarriage & GET">Undercarriage & GET</option>
                                        <option value="Tyre">Tyre (Ban DT & Grader)</option>
                                        <option value="Hydraulic">Hydraulic & Seal Kit</option>
                                        <option value="Lubricant">Pelumas & Gemuk</option>
                                        <option value="Electrical">Elektrikal & Sensor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Peruntukan Model Unit</label>
                                    <input
                                        type="text"
                                        required
                                        value={unitModel}
                                        onChange={(e) => setUnitModel(e.target.value)}
                                        placeholder="Contoh: Komatsu PC400"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Stok Awal</label>
                                    <input
                                        type="number"
                                        required
                                        value={stockQty}
                                        onChange={(e) => setStockQty(e.target.value)}
                                        placeholder="10"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Batas Min</label>
                                    <input
                                        type="number"
                                        required
                                        value={minStockQty}
                                        onChange={(e) => setMinStockQty(e.target.value)}
                                        placeholder="5"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Satuan</label>
                                    <select
                                        value={unitMeasure}
                                        onChange={(e) => setUnitMeasure(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Pcs">Pcs</option>
                                        <option value="Set">Set</option>
                                        <option value="Roll">Roll</option>
                                        <option value="Drum">Drum</option>
                                        <option value="Pail">Pail</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Lokasi Rak / Bin Gudang</label>
                                <input
                                    type="text"
                                    value={rackLocation}
                                    onChange={(e) => setRackLocation(e.target.value)}
                                    placeholder="Contoh: Rak FL-02 / Bin 4"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Sparepart'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}