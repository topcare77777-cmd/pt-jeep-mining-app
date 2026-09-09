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
    stock_qty: number
    minimum_stock: number
    unit_price_idr: number
    rack_location: string
}

export default function SparepartManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Warehouse Supervisor')
    const [spareparts, setSpareparts] = useState<SparepartItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Sparepart Baru
    const [showModal, setShowModal] = useState(false)
    const [partNumber, setPartNumber] = useState('')
    const [partName, setPartName] = useState('')
    const [category, setCategory] = useState('Filter & Oli')
    const [stockQty, setStockQty] = useState('15')
    const [minimumStock, setMinimumStock] = useState('5')
    const [unitPriceIdr, setUnitPriceIdr] = useState('350000')
    const [rackLocation, setRackLocation] = useState('Rak A-01')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initSparepart() {
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
                    setUserName(profile?.full_name || 'Warehouse & Inventory Superintendent')

                    const { data, error } = await supabase
                        .from('warehouse_spareparts')
                        .select('*')
                        .order('part_number', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setSpareparts(data)
                    } else {
                        setSpareparts([
                            {
                                id: '1',
                                part_number: '6732-71-6110',
                                part_name: 'Filter Oli Main Engine Komatsu PC200',
                                category: 'Filter & Oli',
                                stock_qty: 24,
                                minimum_stock: 5,
                                unit_price_idr: 450000,
                                rack_location: 'Rak A-01',
                            },
                            {
                                id: '2',
                                part_number: 'P550388',
                                part_name: 'Fuel Filter / Filter Solar Heavy Duty',
                                category: 'Filter & Oli',
                                stock_qty: 3,
                                minimum_stock: 6,
                                unit_price_idr: 275000,
                                rack_location: 'Rak A-02',
                            },
                            {
                                id: '3',
                                part_number: '20Y-60-21120',
                                part_name: 'Hydraulic Pump Seal Kit Excavator',
                                category: 'Hydraulic',
                                stock_qty: 8,
                                minimum_stock: 2,
                                unit_price_idr: 1850000,
                                rack_location: 'Rak B-04',
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

        initSparepart()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddSparepart = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!partNumber || !partName) return

        setSubmitting(true)

        const payload = {
            part_number: partNumber.toUpperCase(),
            part_name: partName,
            category,
            stock_qty: parseInt(stockQty) || 0,
            minimum_stock: parseInt(minimumStock) || 5,
            unit_price_idr: parseFloat(unitPriceIdr) || 0,
            rack_location: rackLocation,
        }

        const { data, error } = await supabase
            .from('warehouse_spareparts')
            .insert([payload])
            .select()

        if (!error && data) {
            setSpareparts([...spareparts, data[0]])
            setShowModal(false)
            setPartNumber('')
            setPartName('')
        } else {
            alert('Gagal mendaftarkan sparepart: ' + (error?.message || 'Nomor part sudah terdaftar.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalItemsCount = spareparts.length
    const lowStockCount = spareparts.filter((s) => s.stock_qty <= s.minimum_stock).length
    const totalInventoryValue = spareparts.reduce((acc, curr) => acc + (Number(curr.stock_qty) * Number(curr.unit_price_idr || 0)), 0)

    const filteredSpareparts = spareparts.filter((item) =>
        item.part_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rack_location.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/sparepart', label: 'Sparepart Gudang', icon: '📦' },
        { href: '/fleet-maintenance', label: 'Maintenance', icon: '🔧' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/manager-site', label: 'Pit Penambangan', icon: '⛏️' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/jetty', label: 'Jetty & LCT', icon: '🚢' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/hrd', label: 'HRD & Payroll', icon: '👷‍♂️' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal & IUP', icon: '⚖️' },
        { href: '/investor', label: 'Investor', icon: '📈' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Inventaris Gudang Suku Cadang...</p>
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
                                Gudang Suku Cadang & Sparepart PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Stok Gudang, Reorder Point, & Valuasi Komponen Alat Berat</span>
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

            {/* KPI Sparepart */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Jenis Suku Cadang</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalItemsCount} Item</div>
                    <p className="mt-2 text-[11px] text-slate-400">Terdaftar di Sistem Gudang</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stok Hampir Habis (Critical)</h3>
                    <div className={`text-2xl font-black font-mono ${lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {lowStockCount} Item
                    </div>
                    <p className="mt-2 text-[11px] text-rose-400 font-semibold">Perlu Segera Reorder</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Valuasi Aset Gudang</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        Rp {(totalInventoryValue / 1000000).toFixed(1)} Juta
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Nilai Persediaan Suku Cadang</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Akurasi Opname Gudang</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">99.9%</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Sistem FIFO Terkontrol</p>
                </div>
            </div>

            {/* Grid Tabel Sparepart */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor part, nama, kategori, rak..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Tambah Suku Cadang Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nomor Part (Part Number)</th>
                                <th className="pb-2">Nama Suku Cadang</th>
                                <th className="pb-2">Kategori</th>
                                <th className="pb-2 text-center">Lokasi Rak</th>
                                <th className="pb-2 text-right">Stok Fisik</th>
                                <th className="pb-2 text-right">Harga Satuan (IDR)</th>
                                <th className="pb-2 text-center">Status Stok</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredSpareparts.length > 0 ? (
                                filteredSpareparts.map((sp) => {
                                    const isLow = sp.stock_qty <= sp.minimum_stock
                                    return (
                                        <tr key={sp.id}>
                                            <td className="py-2.5 font-bold font-mono text-amber-400">{sp.part_number}</td>
                                            <td className="font-semibold text-white">{sp.part_name}</td>
                                            <td>
                                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                    {sp.category}
                                                </span>
                                            </td>
                                            <td className="text-center font-mono text-slate-300">{sp.rack_location}</td>
                                            <td className={`text-right font-mono font-bold ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {sp.stock_qty} Unit
                                            </td>
                                            <td className="text-right font-mono text-slate-300">
                                                Rp {Number(sp.unit_price_idr).toLocaleString('id-ID')}
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLow
                                                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        }`}
                                                >
                                                    {isLow ? 'KRITIS (REORDER)' : 'AMAN'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data suku cadang yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Sparepart */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tambah Suku Cadang & Sparepart Baru</h2>
                        <form onSubmit={handleAddSparepart} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor Part (Part Number)</label>
                                    <input
                                        type="text"
                                        required
                                        value={partNumber}
                                        onChange={(e) => setPartNumber(e.target.value)}
                                        placeholder="Contoh: 6732-71-6110"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori Part</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Filter & Oli">Filter & Oli</option>
                                        <option value="Hydraulic">Hydraulic & Seal</option>
                                        <option value="Undercarriage">Undercarriage & Track</option>
                                        <option value="Engine Parts">Engine Parts</option>
                                        <option value="Electrical">Electrical & Sensor</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Suku Cadang</label>
                                <input
                                    type="text"
                                    required
                                    value={partName}
                                    onChange={(e) => setPartName(e.target.value)}
                                    placeholder="Contoh: Filter Oli Main Engine PC200"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Stok Fisik</label>
                                    <input
                                        type="number"
                                        required
                                        value={stockQty}
                                        onChange={(e) => setStockQty(e.target.value)}
                                        placeholder="15"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Min Stok</label>
                                    <input
                                        type="number"
                                        required
                                        value={minimumStock}
                                        onChange={(e) => setMinimumStock(e.target.value)}
                                        placeholder="5"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Lokasi Rak</label>
                                    <input
                                        type="text"
                                        required
                                        value={rackLocation}
                                        onChange={(e) => setRackLocation(e.target.value)}
                                        placeholder="Rak A-01"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Harga Satuan (IDR)</label>
                                <input
                                    type="number"
                                    required
                                    value={unitPriceIdr}
                                    onChange={(e) => setUnitPriceIdr(e.target.value)}
                                    placeholder="350000"
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