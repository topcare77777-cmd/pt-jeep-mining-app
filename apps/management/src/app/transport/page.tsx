'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TransportItem {
    id: string
    created_at?: string
    route_name: string
    vehicle_unit: string
    driver_name: string
    shift_schedule: string
    capacity_seats: number
    status: string
}

const ALL_MODULES = [
    { key: 'manager-site', label: 'Pit Produksi', icon: '⛏️', href: '/manager-site' },
    { key: 'geologi', label: 'Geologi & Eksplorasi', icon: '🧭', href: '/geologi' },
    { key: 'fleet', label: 'Alat Berat', icon: '🚜', href: '/fleet' },
    { key: 'fleet-maintenance', label: 'Workshop Fleet', icon: '🔧', href: '/fleet-maintenance' },
    { key: 'sparepart', label: 'Sparepart', icon: '📦', href: '/sparepart' },
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

export default function TransportManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Koordinator Transportasi GA')
    const [userRole, setUserRole] = useState('General Affair')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [transports, setTransports] = useState<TransportItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Jadwal Shuttle Baru
    const [showModal, setShowModal] = useState(false)
    const [routeName, setRouteName] = useState('')
    const [vehicleUnit, setVehicleUnit] = useState('')
    const [driverName, setDriverName] = useState('')
    const [shiftSchedule, setShiftSchedule] = useState('Shift 1 (Pagi: 06:00 WITA)')
    const [capacitySeats, setCapacitySeats] = useState('15')
    const [status, setStatus] = useState('Siap Berangkat')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initTransport() {
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
                    setUserName(profile?.full_name || 'General Affair Transport Supervisor')
                    const division = (profile?.role || 'General Affair & Logistik').trim()
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
                                    (cleanDiv.includes('transport') && target.includes('transport')) ||
                                    (cleanDiv.includes('ga') && target.includes('ga'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['transport']
                            }
                        } else {
                            grantedKeys = ['transport']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('transport')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Transportasi Kru.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    const { data, error } = await supabase
                        .from('ga_transport_shuttle')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setTransports(data)
                    } else {
                        setTransports([
                            {
                                id: '1',
                                route_name: 'Mess Camp Utama -> Front Pit Barat',
                                vehicle_unit: 'LV-BUS-01 (Toyota Hiace)',
                                driver_name: 'Herman Susanto',
                                shift_schedule: 'Shift 1 (Pagi: 06:00 WITA)',
                                capacity_seats: 15,
                                status: 'Siap Berangkat',
                            },
                            {
                                id: '2',
                                route_name: 'Workshop -> Jetty Port Loading',
                                vehicle_unit: 'LV-4WD-04 (Hilux Double Cabin)',
                                driver_name: 'Yusuf Bahtiar',
                                shift_schedule: 'Operasional Rutin Siang',
                                capacity_seats: 5,
                                status: 'Dalam Perjalanan',
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

        initTransport()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddTransport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!routeName || !vehicleUnit) return

        setSubmitting(true)

        const payload = {
            route_name: routeName,
            vehicle_unit: vehicleUnit.toUpperCase(),
            driver_name: driverName || 'Driver GA',
            shift_schedule: shiftSchedule,
            capacity_seats: parseInt(capacitySeats) || 15,
            status,
        }

        const { data, error } = await supabase
            .from('ga_transport_shuttle')
            .insert([payload])
            .select()

        if (!error && data) {
            setTransports([data[0], ...transports])
            setShowModal(false)
            setRouteName('')
            setVehicleUnit('')
            setDriverName('')
        } else {
            setTransports([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...transports,
            ])
            setShowModal(false)
            setRouteName('')
            setVehicleUnit('')
            setDriverName('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalSchedules = transports.length
    const readyVehicles = transports.filter((t) => t.status === 'Siap Berangkat').length

    const filteredTransports = transports.filter((item) =>
        (item?.route_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.vehicle_unit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.driver_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.shift_schedule || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Transportasi & Shuttle Kru...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🚐</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen Transportasi & Shuttle Kru PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Jadwal Antar-Jemput Mess, Armada Bus, & Sarana Light Vehicle</span>
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Jadwal / Rute</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalSchedules} Rute</div>
                    <p className="mt-2 text-[11px] text-slate-400">Antar-Jemput Mess & Pit</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Armada Siap Berangkat</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{readyVehicles} Unit</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Bus & LV Siap Operasi</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ketepatan Waktu Shift</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">99.5%</div>
                    <p className="mt-2 text-[11px] text-slate-400">Rotasi Kru Tepat Waktu</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kesiapan Sarana</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">Optimal</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Maintenance GA Rutin</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari rute, kendaraan, driver, shift..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Tambah Jadwal Shuttle Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Rute Perjalanan</th>
                                <th className="pb-2">Kendaraan / Unit</th>
                                <th className="pb-2">Pengemudi (Driver)</th>
                                <th className="pb-2">Jadwal / Shift</th>
                                <th className="pb-2 text-center">Kapasitas Kursi</th>
                                <th className="pb-2 text-center">Status Armada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredTransports.length > 0 ? (
                                filteredTransports.map((t) => (
                                    <tr key={t.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-2.5 font-bold text-white">{t.route_name}</td>
                                        <td className="font-mono text-amber-400">{t.vehicle_unit}</td>
                                        <td className="text-slate-300">{t.driver_name}</td>
                                        <td className="text-slate-300">{t.shift_schedule}</td>
                                        <td className="text-center font-mono text-slate-300">{t.capacity_seats} Kursi</td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${t.status === 'Siap Berangkat'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                                                        : 'bg-amber-950/80 text-amber-400 border-amber-800/40'
                                                    }`}
                                            >
                                                {t.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada jadwal transportasi yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tambah Jadwal Transportasi & Shuttle Kru</h2>
                        <form onSubmit={handleAddTransport} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Rute Perjalanan</label>
                                <input
                                    type="text"
                                    required
                                    value={routeName}
                                    onChange={(e) => setRouteName(e.target.value)}
                                    placeholder="Contoh: Mess Camp Utama -> Front Pit Barat"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kendaraan / Unit</label>
                                    <input
                                        type="text"
                                        required
                                        value={vehicleUnit}
                                        onChange={(e) => setVehicleUnit(e.target.value)}
                                        placeholder="LV-BUS-01 (Toyota Hiace)"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Pengemudi</label>
                                    <input
                                        type="text"
                                        required
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        placeholder="Nama Driver"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Jadwal / Shift Operasional</label>
                                <select
                                    value={shiftSchedule}
                                    onChange={(e) => setShiftSchedule(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                >
                                    <option value="Shift 1 (Pagi: 06:00 WITA)">Shift 1 (Pagi: 06:00 WITA)</option>
                                    <option value="Shift 2 (Malam: 18:00 WITA)">Shift 2 (Malam: 18:00 WITA)</option>
                                    <option value="Operasional Rutin Siang">Operasional Rutin Siang</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kapasitas Kursi</label>
                                    <input
                                        type="number"
                                        required
                                        value={capacitySeats}
                                        onChange={(e) => setCapacitySeats(e.target.value)}
                                        placeholder="15"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Armada</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Siap Berangkat">Siap Berangkat</option>
                                        <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                                        <option value="Selesai">Selesai</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Jadwal Shuttle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}