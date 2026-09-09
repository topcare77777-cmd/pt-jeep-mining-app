'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface VehicleLog {
    id: string
    created_at?: string
    vehicle_no: string
    driver_name: string
    purpose: string
    destination: string
    status: string
}

export default function GaDashboard() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas GA')
    const [activeTab, setActiveTab] = useState('armada')
    const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Peminjaman Kendaraan LV
    const [showModal, setShowModal] = useState(false)
    const [vehicleNo, setVehicleNo] = useState('')
    const [driverName, setDriverName] = useState('')
    const [purpose, setPurpose] = useState('')
    const [destination, setDestination] = useState('Pit Area Barat')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initGa() {
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

                if (isMounted) {
                    setUserName(profile?.full_name || 'Petugas GA / Logistik')

                    const { data: logsData, error } = await supabase
                        .from('ga_vehicle_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && logsData && logsData.length > 0) {
                        setVehicleLogs(logsData)
                    } else {
                        setVehicleLogs([
                            {
                                id: '1',
                                vehicle_no: 'KT-8842-JP (LV Hilux 01)',
                                driver_name: 'Dedi Saputra',
                                purpose: 'Inspeksi Jalur Hauling & Pit Barat',
                                destination: 'Front Pit Barat',
                                status: 'Keluar',
                            },
                            {
                                id: '2',
                                vehicle_no: 'KT-1204-JP (Bus Karyawan 02)',
                                driver_name: 'Agus Santoso',
                                purpose: 'Antar Jemput Kru Shift Siang',
                                destination: 'Mess Camp Utama',
                                status: 'Selesai',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error GA init:', err)
                if (isMounted) setLoading(false)
            }
        }

        initGa()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddVehicleLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!vehicleNo || !driverName) return

        setSubmitting(true)

        const payload = {
            vehicle_no: vehicleNo,
            driver_name: driverName,
            purpose,
            destination,
            status: 'Keluar',
        }

        const { data, error } = await supabase
            .from('ga_vehicle_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setVehicleLogs([data[0], ...vehicleLogs])
            setShowModal(false)
            setVehicleNo('')
            setDriverName('')
            setPurpose('')
        } else {
            setVehicleLogs([
                {
                    id: Math.random().toString(),
                    created_at: new Date().toISOString(),
                    ...payload,
                },
                ...vehicleLogs,
            ])
            setShowModal(false)
            setVehicleNo('')
            setDriverName('')
            setPurpose('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const cleanQuery = (searchQuery || '').toLowerCase().trim()
    const filteredLogs = vehicleLogs.filter((item) => {
        const vNo = (item.vehicle_no || '').toLowerCase()
        const dName = (item.driver_name || '').toLowerCase()
        const purp = (item.purpose || '').toLowerCase()
        const dest = (item.destination || '').toLowerCase()

        return (
            vNo.includes(cleanQuery) ||
            dName.includes(cleanQuery) ||
            purp.includes(cleanQuery) ||
            dest.includes(cleanQuery)
        )
    })

    const navLinks = [
        { href: '/ga', label: 'GA & Fasilitas', icon: '🚙' },
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/bbm', label: 'Tangki BBM', icon: '⛽' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/hrd', label: 'HRD & K3', icon: '👷‍♂️' },
        { href: '/direktur', label: 'Eksekutif', icon: '🏛️' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Logistik & Fasilitas GA...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white flex items-center gap-2">
                            Dashboard General Affair & Logistik (GA) PT. JEEP
                        </h1>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Armada LV, Tangki BBM, Mess, & Fasilitas Tambang</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-300 font-semibold">{userName}</span>
                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                GA & Facilities
                            </span>
                        </p>
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

            {/* Nav Tabs */}
            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'armada', label: 'LOG KENDARAAN LV', badge: `${vehicleLogs.length} LOG` },
                    { id: 'mess', label: 'MESS & AKOMODASI', badge: '100% OK' },
                    { id: 'sarana', label: 'GENSET & POMPA AIR', badge: '' },
                    { id: 'catering', label: 'CATERING & LOGISTIK', badge: '' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${activeTab === tab.id
                                ? 'bg-[#1b3b5f] border-amber-400 text-white shadow-lg shadow-amber-950/40'
                                : 'bg-[#0c1a2d] border-[#1b2e46] text-slate-400 hover:text-white hover:bg-[#12243d]'
                            }`}
                    >
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded font-black">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Grid Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Navigasi Aksi */}
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-amber-500/50 bg-amber-950/20 hover:bg-amber-900/30 text-amber-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Catat Pemakaian Unit LV</div>
                            <div className="text-[10px] text-slate-400">Hilux, Triton, atau Bus Kru</div>
                        </div>
                    </div>

                    <Link
                        href="/bbm"
                        className="p-4 rounded-xl border border-[#1b2e46] bg-[#0c1a2d] hover:bg-[#12243d] hover:border-amber-500/50 text-slate-200 transition flex items-center gap-3 block"
                    >
                        <span className="text-xl">⛽</span>
                        <div>
                            <div className="text-xs font-bold text-amber-400">Manajemen Tangki Solar</div>
                            <div className="text-[10px] text-slate-400">Stok Tangki & Pengisian BBM</div>
                        </div>
                    </Link>

                    <div className="p-4 rounded-xl border border-[#16273c] bg-[#0a1625] text-slate-400 space-y-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Status Sarana GA</span>
                        <div className="text-[11px] flex justify-between">
                            <span>Tabel Supabase</span>
                            <span className="text-emerald-400 font-semibold">ga_vehicle_logs</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Total Peminjaman LV</span>
                            <span className="text-slate-200 font-bold">{vehicleLogs.length} unit</span>
                        </div>
                    </div>
                </aside>

                {/* Kolom Kanan: Panel Tabel */}
                <main className="lg:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kesiapan Armada LV</h3>
                            <div className="text-2xl font-black text-white">92% Ready</div>
                            <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Siap Operasional Pit & Mess</p>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hunian Mess Camp</h3>
                            <div className="text-2xl font-black text-amber-400">142 / 160 Bed</div>
                            <p className="mt-2 text-[11px] text-slate-400">Kapasitas Nyaman Terjaga</p>
                        </div>

                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Genset Power Camp</h3>
                            <div className="text-2xl font-black text-emerald-400">250 kVA</div>
                            <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Suplai Listrik 24 Jam Aman</p>
                        </div>
                    </div>

                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                            <div className="w-full md:w-72">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari plat, driver, keperluan..."
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold px-3.5 py-2 rounded-lg transition cursor-pointer"
                            >
                                + Catat Kendaraan
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">Nomor Unit LV</th>
                                        <th className="pb-2">Driver / Pemakai</th>
                                        <th className="pb-2">Tujuan Lapangan</th>
                                        <th className="pb-2">Keperluan Dinas</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {filteredLogs.length > 0 ? (
                                        filteredLogs.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-2.5 font-bold font-mono text-amber-400">{item.vehicle_no || '-'}</td>
                                                <td className="font-semibold text-white">{item.driver_name || '-'}</td>
                                                <td>{item.destination || '-'}</td>
                                                <td className="text-slate-400">{item.purpose || '-'}</td>
                                                <td>
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${(item.status || '') === 'Keluar'
                                                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                            }`}
                                                    >
                                                        {item.status || 'Aktif'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                                                Tidak ada catatan unit yang cocok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Tambah Log Kendaraan */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Pemakaian Unit Kendaraan LV</h2>
                        <form onSubmit={handleAddVehicleLog} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nomor Unit / Plat</label>
                                <input
                                    type="text"
                                    required
                                    value={vehicleNo}
                                    onChange={(e) => setVehicleNo(e.target.value)}
                                    placeholder="Contoh: KT-8842-JP (LV Hilux 01)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Driver / Pemakai</label>
                                <input
                                    type="text"
                                    required
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    placeholder="Contoh: Dedi Saputra"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Tujuan</label>
                                <input
                                    type="text"
                                    required
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    placeholder="Contoh: Pit Front Barat / Pelabuhan Jetty"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Keperluan Pemakaian</label>
                                <input
                                    type="text"
                                    required
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Contoh: Antar Logistik Part Excavator"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}