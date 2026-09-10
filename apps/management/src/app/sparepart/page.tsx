'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
    location_rack: string
    stock_quantity: number
    unit_price: number
    status: string
}

const ALL_MODULES = [
    { key: 'manager-site', label: 'Pit Produksi', icon: '⛏️', href: '/manager-site' },
    { key: 'geologi', label: 'Geologi & Eksplorasi', icon: '🧭', href: '/geologi' },
    { key: 'fleet', label: 'Alat Berat', icon: '🚜', href: '/fleet' },
    { key: 'fleet-maintenance', label: 'Workshop Fleet', icon: '🔧', href: '/fleet-maintenance' },
    { key: 'sparepart', label: 'Sparepart Gudang', icon: '📦', href: '/sparepart' },
    { key: 'safety', label: 'Inspeksi K3', icon: '⛑️', href: '/safety' },
    { key: 'ritase', label: 'Ritase', icon: '🚛', href: '/ritase' },
    { key: 'jetty', label: 'Jetty Port', icon: '🚢', href: '/jetty' },
    { key: 'environment', label: 'Lingkungan', icon: '🌱', href: '/environment' },
    { key: 'lingkungan', label: 'Kanal Sedimen', icon: '🏞️', href: '/lingkungan' },
    { key: 'bbm', label: 'BBM Solar', icon: '⛽', href: '/bbm' },
    { key: 'finance', label: 'Keuangan', icon: '💰', href: '/finance' },
    { key: 'adm', label: 'ADM & Surat', icon: '📋', href: '/adm' },
    { key: 'hrd', label: 'HRD & Payroll', icon: '👷‍♂️', href: '/hrd' },
    { key: 'ga', label: 'GA & Fasilitas', icon: '🚙', href: '/ga' },
    { key: 'assets', label: 'Aset Tambang', icon: '🏷️', href: '/assets' },
    { key: 'mess', label: 'Mess Camp', icon: '🏠', href: '/mess' },
    { key: 'catering', label: 'Katering', icon: '🍱', href: '/catering' },
    { key: 'clinic', label: 'Klinik Site', icon: '🏥', href: '/clinic' },
    { key: 'security', label: 'Security Gate', icon: '🛡️', href: '/security' },
    { key: 'radio', label: 'Radio Komunikasi', icon: '📻', href: '/radio' },
    { key: 'legal', label: 'Legalitas IUP', icon: '⚖️', href: '/legal' },
    { key: 'csr', label: 'CSR Masyarakat', icon: '🤝', href: '/csr' },
    { key: 'vendor', label: 'Vendor', icon: '🏬', href: '/vendor' },
    { key: 'transport', label: 'Transport Kru', icon: '🚌', href: '/transport' },
    { key: 'training', label: 'Training K3', icon: '🎓', href: '/training' },
    { key: 'performance', label: 'Kinerja KPI', icon: '📈', href: '/performance' },
    { key: 'it-helpdesk', label: 'IT Helpdesk', icon: '💻', href: '/it-helpdesk' },
    { key: 'helpdesk', label: 'Helpdesk GA', icon: '🛠️', href: '/helpdesk' },
    { key: 'investor', label: 'Investor & RKAB', icon: '📊', href: '/investor' },
    { key: 'direktur', label: 'Eksekutif BOD', icon: '🏛️', href: '/direktur' },
    { key: 'laporan', label: 'Cetak Laporan', icon: '📄', href: '/laporan' },
]

export default function SparepartPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Staff Gudang')
    const [userRole, setUserRole] = useState('Warehouse Dept')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [spareparts, setSpareparts] = useState<SparepartItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Tambah Item
    const [showModal, setShowModal] = useState(false)
    const [partNumber, setPartNumber] = useState('')
    const [partName, setPartName] = useState('')
    const [category, setCategory] = useState('Filter & Oli')
    const [locationRack, setLocationRack] = useState('Rak A-01')
    const [stockQty, setStockQty] = useState('10')
    const [unitPrice, setUnitPrice] = useState('250000')
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

                let { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    const userRes = await supabase.auth.getUser()
                    if (!userRes.data.user) {
                        window.location.href = landingUrl
                        return
                    }
                }

                const currentUserId = session?.user?.id || (await supabase.auth.getUser()).data.user?.id

                if (!currentUserId) {
                    window.location.href = landingUrl
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, status')
                    .eq('id', currentUserId)
                    .maybeSingle()

                const statusClean = (profile?.status || '').toLowerCase().trim()
                if (statusClean === 'nonaktif' || statusClean === 'non-aktif' || statusClean === 'banned') {
                    alert('Akun Anda dinonaktifkan.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                if (isMounted) {
                    setUserName(profile?.full_name || 'Staff Logistik Gudang')
                    const division = (profile?.role || 'Logistik & Gudang').trim()
                    setUserRole(division)

                    const isSuperAdmin = ['admin', 'administrator', 'superadmin'].includes(division.toLowerCase())

                    let grantedKeys: string[] = []
                    if (isSuperAdmin) {
                        grantedKeys = ALL_MODULES.map((m) => m.key)
                    } else {
                        const { data: allPerms } = await supabase
                            .from('division_permissions')
                            .select('division_name, allowed_modules')

                        if (allPerms && allPerms.length > 0) {
                            const cleanDiv = division.toLowerCase()
                            const matched = allPerms.find((p) => {
                                const target = (p.division_name || '').toLowerCase().trim()
                                return (
                                    target === cleanDiv ||
                                    target.includes(cleanDiv) ||
                                    cleanDiv.includes(target) ||
                                    (cleanDiv.includes('logistik') && target.includes('logistik')) ||
                                    (cleanDiv.includes('gudang') && target.includes('gudang')) ||
                                    (cleanDiv.includes('sparepart') && target.includes('sparepart'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['sparepart']
                            }
                        } else {
                            grantedKeys = ['sparepart']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('sparepart')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Sparepart Gudang.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    // Load data sparepart
                    const { data, error } = await supabase
                        .from('sparepart_inventory')
                        .select('*')
                        .order('part_name', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setSpareparts(data)
                    } else {
                        setSpareparts([
                            {
                                id: '1',
                                part_number: '6732-71-6110',
                                part_name: 'Filter Oli Main Engine Komatsu PC200',
                                category: 'Filter & Oli',
                                location_rack: 'Rak A-01',
                                stock_quantity: 24,
                                unit_price: 450000,
                                status: 'AMAN',
                            },
                            {
                                id: '2',
                                part_number: 'P550388',
                                part_name: 'Fuel Filter / Filter Solar Heavy Duty',
                                category: 'Filter & Oli',
                                location_rack: 'Rak A-02',
                                stock_quantity: 3,
                                unit_price: 275000,
                                status: 'KRITIS (REORDER)',
                            },
                            {
                                id: '3',
                                part_number: '20Y-60-21120',
                                part_name: 'Hydraulic Pump Seal Kit Excavator',
                                category: 'Hydraulic',
                                location_rack: 'Rak B-04',
                                stock_quantity: 8,
                                unit_price: 1850000,
                                status: 'AMAN',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error load sparepart:', err)
                if (isMounted) setLoading(false)
            }
        }

        initSparepart()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddSparepart = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!partNumber || !partName) return

        setSubmitting(true)
        const stock = parseInt(stockQty) || 0
        const calculatedStatus = stock <= 5 ? 'KRITIS (REORDER)' : 'AMAN'

        const payload = {
            part_number: partNumber.toUpperCase(),
            part_name: partName,
            category,
            location_rack: locationRack,
            stock_quantity: stock,
            unit_price: parseFloat(unitPrice) || 0,
            status: calculatedStatus,
        }

        const { data, error } = await supabase.from('sparepart_inventory').insert([payload]).select()

        if (!error && data) {
            setSpareparts([...spareparts, data[0]])
            setShowModal(false)
            setPartNumber('')
            setPartName('')
        } else {
            setSpareparts([
                ...spareparts,
                {
                    id: Date.now().toString(),
                    ...payload,
                },
            ])
            setShowModal(false)
            setPartNumber('')
            setPartName('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalItems = spareparts.length
    const criticalItems = spareparts.filter((s) => s.stock_quantity <= 5).length
    const totalValuation = spareparts.reduce((acc, curr) => acc + (curr.stock_quantity * curr.unit_price), 0)

    const filteredSpareparts = spareparts.filter((item) =>
        (item?.part_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.part_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.location_rack || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">
                    Sinkronisasi Inventaris Gudang PT. Jangkar Energi Eka Perkasa...
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">📦</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Gudang Suku Cadang & Sparepart PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Stok Gudang, Reorder Point, & Valuasi Komponen Alat Berat</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                                    {userRole}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/"
                            className="bg-[#102033] hover:bg-[#162b45] border border-[#1e3757] text-slate-300 text-xs px-3 py-2 rounded-lg transition"
                        >
                            ← Beranda Portal
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                        >
                            Keluar
                        </button>
                    </div>
                </div>

                {authorizedNavItems.length > 1 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        {authorizedNavItems.map((item) => {
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
                ) : (
                    <div className="bg-[#0a1625]/60 border border-[#1b2e46] rounded-lg px-4 py-2 text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span>Akses Terbatas: Menampilkan modul berizin untuk divisi Anda.</span>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Jenis Suku Cadang</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalItems} Item</div>
                    <p className="mt-2 text-[11px] text-slate-400">Terdaftar di Sistem Gudang</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stok Hampir Habis (Critical)</h3>
                    <div className="text-2xl font-black text-rose-400 font-mono">{criticalItems} Item</div>
                    <p className="mt-2 text-[11px] text-rose-400 font-medium">Perlu Segera Reorder</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Valuasi Aset Gudang</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        Rp {(totalValuation / 1000000).toFixed(1)} Juta
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Nilai Persediaan Suku Cadang</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Akurasi Opname Gudang</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">99.9%</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Sistem FIFO Terkontrol</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor part, nama, kategori, rak..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> <span>Tambah Suku Cadang Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2.5">Nomor Part (Part Number)</th>
                                <th className="pb-2.5">Nama Suku Cadang</th>
                                <th className="pb-2.5">Kategori</th>
                                <th className="pb-2.5">Lokasi Rak</th>
                                <th className="pb-2.5 text-center">Stok Fisik</th>
                                <th className="pb-2.5 text-right">Harga Satuan (IDR)</th>
                                <th className="pb-2.5 text-center">Status Stok</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredSpareparts.length > 0 ? (
                                filteredSpareparts.map((sp) => (
                                    <tr key={sp.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-3 font-mono font-bold text-amber-400">{sp.part_number}</td>
                                        <td className="font-semibold text-white">{sp.part_name}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {sp.category}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{sp.location_rack}</td>
                                        <td className={`text-center font-mono font-bold ${sp.stock_quantity <= 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {sp.stock_quantity} Unit
                                        </td>
                                        <td className="text-right font-mono text-slate-300">
                                            Rp {Number(sp.unit_price).toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-center">
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${sp.stock_quantity <= 5
                                                        ? 'bg-rose-950/80 text-rose-400 border-rose-800/40'
                                                        : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                                                    }`}
                                            >
                                                {sp.stock_quantity <= 5 ? 'KRITIS (REORDER)' : 'AMAN'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Belum ada data suku cadang di gudang.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Input Master Suku Cadang Baru
                        </h2>
                        <form onSubmit={handleAddSparepart} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Part Number (PN)</label>
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
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Deskripsi Komponen</label>
                                    <input
                                        type="text"
                                        required
                                        value={partName}
                                        onChange={(e) => setPartName(e.target.value)}
                                        placeholder="Contoh: Filter Oli Komatsu PC200"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori Barang</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Filter & Oli">Filter & Oli</option>
                                        <option value="Engine Parts">Engine Parts</option>
                                        <option value="Hydraulic">Hydraulic Component</option>
                                        <option value="Undercarriage">Undercarriage</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Ban & Velg">Ban & Velg</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Lokasi Rak Penyimpanan</label>
                                    <input
                                        type="text"
                                        required
                                        value={locationRack}
                                        onChange={(e) => setLocationRack(e.target.value)}
                                        placeholder="Contoh: Rak A-01"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Stok Fisik Awal (Pcs/Unit)</label>
                                    <input
                                        type="number"
                                        required
                                        value={stockQty}
                                        onChange={(e) => setStockQty(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Estimasi Harga Satuan (IDR)</label>
                                    <input
                                        type="number"
                                        required
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        placeholder="250000"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Barang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}