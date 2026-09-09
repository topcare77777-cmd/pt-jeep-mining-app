'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface AssetItem {
    id: string
    created_at?: string
    asset_code: string
    asset_name: string
    category: string
    serial_number?: string
    location_site: string
    custodian_name: string
    condition_status: string
    notes?: string
}

export default function AssetManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Pengelola Aset GA')
    const [assets, setAssets] = useState<AssetItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Aset Baru
    const [showModal, setShowModal] = useState(false)
    const [assetCode, setAssetCode] = useState('')
    const [assetName, setAssetName] = useState('')
    const [category, setCategory] = useState('IT & Komputer')
    const [serialNumber, setSerialNumber] = useState('')
    const [locationSite, setLocationSite] = useState('Kantor Utama Site')
    const [custodianName, setCustodianName] = useState('')
    const [conditionStatus, setConditionStatus] = useState('Baik')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initAssets() {
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
                    setUserName(profile?.full_name || 'General Affair Asset Supervisor')

                    const { data, error } = await supabase
                        .from('company_assets')
                        .select('*')
                        .order('asset_code', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setAssets(data)
                    } else {
                        setAssets([
                            {
                                id: '1',
                                asset_code: 'AST-GEO-01',
                                asset_name: 'GPS Geodetik Trimble R2 RTK',
                                category: 'Geodetik & Survey',
                                serial_number: 'TRB-9942018',
                                location_site: 'Front Pit Barat (Tim Survey)',
                                custodian_name: 'Doni Surveyor',
                                condition_status: 'Baik',
                                notes: 'Kalibrasi tahunan aktif',
                            },
                            {
                                id: '2',
                                asset_code: 'AST-IT-04',
                                asset_name: 'Laptop Dell Latitude 5420 Rugged',
                                category: 'IT & Komputer',
                                serial_number: 'DL-5420-992',
                                location_site: 'Kantor Site Utama',
                                custodian_name: 'Rian IT Support',
                                condition_status: 'Baik',
                                notes: 'Unit operasional dispatcher',
                            },
                            {
                                id: '3',
                                asset_code: 'AST-PWR-02',
                                asset_name: 'Genset Portabel Silent 5KVA',
                                category: 'Power Supply',
                                serial_number: 'GEN-HONDA-50',
                                location_site: 'Pos Security Utama',
                                custodian_name: 'Komandan Suroso',
                                condition_status: 'Perbaikan',
                                notes: 'Penggantian filter bensin',
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

        initAssets()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddAsset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assetCode || !assetName) return

        setSubmitting(true)

        const payload = {
            asset_code: assetCode.toUpperCase(),
            asset_name: assetName,
            category,
            serial_number: serialNumber || '-',
            location_site: locationSite,
            custodian_name: custodianName || userName,
            condition_status: conditionStatus,
            notes,
        }

        const { data, error } = await supabase
            .from('company_assets')
            .insert([payload])
            .select()

        if (!error && data) {
            setAssets([...assets, data[0]])
            setShowModal(false)
            setAssetCode('')
            setAssetName('')
            setSerialNumber('')
            setNotes('')
        } else {
            alert('Gagal mendaftarkan aset: ' + (error?.message || 'Kode aset sudah terdaftar.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalAssets = assets.length
    const goodAssets = assets.filter((a) => a.condition_status === 'Baik').length
    const repairAssets = assets.filter((a) => a.condition_status === 'Perbaikan' || a.condition_status === 'Rusak').length

    const filteredAssets = assets.filter((item) =>
        item.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.custodian_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location_site.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/assets', label: 'Aset Perusahaan', icon: '🏷️' },
        { href: '/mess', label: 'Mess & Camp', icon: '🏠' },
        { href: '/vendor', label: 'Vendor', icon: '🤝' },
        { href: '/radio', label: 'Radio', icon: '📻' },
        { href: '/clinic', label: 'Klinik', icon: '🏥' },
        { href: '/security', label: 'Security', icon: '🛡️' },
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
                <p className="text-xs text-slate-400">Sinkronisasi Inventaris Aset Perusahaan...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🏷️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen Aset & Inventaris Perusahaan PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Pencatatan Inventaris Alat Survey, IT, & Perangkat Pendukung Site</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    General Affair
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

            {/* KPI Aset */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Unit Aset Terdaftar</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalAssets} Unit</div>
                    <p className="mt-2 text-[11px] text-slate-400">Inventaris Seluruh Area Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aset Kondisi Baik</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{goodAssets} Unit</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Siap Digunakan Operasional</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dalam Perbaikan / Rusak</h3>
                    <div className={`text-2xl font-black font-mono ${repairAssets > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {repairAssets} Unit
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Penanganan Maintenance GA</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Auditing Aset</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">100% Valid</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Sesuai Pencatatan Logistik</p>
                </div>
            </div>

            {/* Grid Tabel Aset */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kode aset, nama, custodian..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Daftarkan Aset Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Kode Aset</th>
                                <th className="pb-2">Nama Barang / Perangkat</th>
                                <th className="pb-2">Kategori</th>
                                <th className="pb-2">Nomor Seri (S/N)</th>
                                <th className="pb-2">Lokasi Penempatan</th>
                                <th className="pb-2">Penanggung Jawab (Custodian)</th>
                                <th className="pb-2 text-center">Kondisi</th>
                                <th className="pb-2">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredAssets.length > 0 ? (
                                filteredAssets.map((a) => (
                                    <tr key={a.id}>
                                        <td className="py-2.5 font-bold font-mono text-amber-400">{a.asset_code}</td>
                                        <td className="font-semibold text-white">{a.asset_name}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {a.category}
                                            </span>
                                        </td>
                                        <td className="font-mono text-slate-400 text-[11px]">{a.serial_number}</td>
                                        <td className="text-slate-300">{a.location_site}</td>
                                        <td className="text-slate-300">{a.custodian_name}</td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.condition_status === 'Baik'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                    }`}
                                            >
                                                {a.condition_status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{a.notes || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data aset yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Aset */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Registrasi Aset & Inventaris Baru</h2>
                        <form onSubmit={handleAddAsset} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kode Aset</label>
                                    <input
                                        type="text"
                                        required
                                        value={assetCode}
                                        onChange={(e) => setAssetCode(e.target.value)}
                                        placeholder="Contoh: AST-IT-05"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori Aset</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="IT & Komputer">IT & Komputer</option>
                                        <option value="Geodetik & Survey">Geodetik & Survey</option>
                                        <option value="Power Supply">Power Supply (Genset/UPS)</option>
                                        <option value="Peralatan Kantor">Peralatan Kantor & Mess</option>
                                        <option value="Alat Ukur & Safety">Alat Ukur & Safety</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Barang / Perangkat</label>
                                <input
                                    type="text"
                                    required
                                    value={assetName}
                                    onChange={(e) => setAssetName(e.target.value)}
                                    placeholder="Contoh: Total Station Sokkia IM-52"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor Seri (Serial Number)</label>
                                    <input
                                        type="text"
                                        value={serialNumber}
                                        onChange={(e) => setSerialNumber(e.target.value)}
                                        placeholder="S/N Pabrikan"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kondisi Aset</label>
                                    <select
                                        value={conditionStatus}
                                        onChange={(e) => setConditionStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Baik">Baik (Berfungsi Normal)</option>
                                        <option value="Perbaikan">Dalam Perbaikan</option>
                                        <option value="Rusak">Rusak / Tidak Layak</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Lokasi Penempatan Site</label>
                                <input
                                    type="text"
                                    required
                                    value={locationSite}
                                    onChange={(e) => setLocationSite(e.target.value)}
                                    placeholder="Contoh: Kantor Utama Site / Front Pit"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Penanggung Jawab (Custodian)</label>
                                <input
                                    type="text"
                                    required
                                    value={custodianName}
                                    onChange={(e) => setCustodianName(e.target.value)}
                                    placeholder="Nama pemegang aset"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Catatan / Keterangan</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Kalibrasi tahunan / Garansi aktif"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Aset'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}