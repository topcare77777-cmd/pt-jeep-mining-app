'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface VehicleLog {
    id: string
    created_at?: string
    plate_number?: string
    driver?: string
    destination?: string
    purpose?: string
    status?: string
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
    { key: 'radio', label: 'Radio Dispatch', icon: '📻', href: '/radio' },
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

export default function GaDashboard() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Staff GA')
    const [userRole, setUserRole] = useState('GA & Facilities')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState('kendaraan')
    const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input LV
    const [showModal, setShowModal] = useState(false)
    const [plateNumber, setPlateNumber] = useState('')
    const [driver, setDriver] = useState('')
    const [destination, setDestination] = useState('')
    const [purpose, setPurpose] = useState('')
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
                    setUserName(profile?.full_name || 'Staff GA & Logistik')
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
                                    (cleanDiv.includes('ga') && target.includes('ga')) ||
                                    (cleanDiv.includes('general') && target.includes('general'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['ga']
                            }
                        } else {
                            grantedKeys = ['ga']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('ga')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul GA & Fasilitas.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    // Data Log Kendaraan
                    const { data, error } = await supabase
                        .from('ga_vehicle_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setVehicleLogs(data)
                    } else {
                        setVehicleLogs([
                            {
                                id: '1',
                                plate_number: 'KT 8192 YZ (Hilux 4x4)',
                                driver: 'Rahmat Hidayat',
                                destination: 'Pit Front A ke Port Jetty',
                                purpose: 'Antar Inspector K3 & Pengawas Pit',
                                status: 'Dipakai',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error load GA:', err)
                if (isMounted) setLoading(false)
            }
        }

        initGa()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!plateNumber || !driver) return

        setSubmitting(true)
        const payload = {
            plate_number: plateNumber,
            driver,
            destination,
            purpose,
            status: 'Dipakai',
        }

        const { data, error } = await supabase.from('ga_vehicle_logs').insert([payload]).select()

        if (!error && data) {
            setVehicleLogs([data[0], ...vehicleLogs])
            setShowModal(false)
            setPlateNumber('')
            setDriver('')
            setDestination('')
            setPurpose('')
        } else {
            setVehicleLogs([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...vehicleLogs,
            ])
            setShowModal(false)
            setPlateNumber('')
            setDriver('')
            setDestination('')
            setPurpose('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    // AMAN DARI NILAI NULL / UNDEFINED
    const filteredLogs = vehicleLogs.filter((item) =>
        (item?.plate_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.driver || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.destination || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.purpose || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">
                    Sinkronisasi Sarana & Fasilitas PT. Jangkar Energi Eka Perkasa...
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Utama */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">🚙</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Dashboard General Affair & Logistik (GA) PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Armada LV, Tangki BBM, Mess, & Fasilitas Tambang</span>
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

                {/* Bilah Navigasi Dinamis */}
                {authorizedNavItems.length > 1 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        {authorizedNavItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                            ? 'bg-[#162d47] text-white border-emerald-400/80 shadow-sm'
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
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Akses Terbatas: Menampilkan modul berizin untuk divisi Anda.</span>
                    </div>
                )}
            </header>

            {/* Tabs Kategori Sarana GA */}
            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'kendaraan', label: 'LOG KENDARAAN LV', badge: `${vehicleLogs.length} LOG` },
                    { id: 'mess', label: 'MESS & AKOMODASI', badge: '100% OK' },
                    { id: 'genset', label: 'GENSET & POMPA AIR' },
                    { id: 'catering', label: 'CATERING & LOGISTIK' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${activeTab === tab.id
                                ? 'bg-[#1b3b5f] border-emerald-400 text-white shadow-lg'
                                : 'bg-[#0c1a2d] border-[#1b2e46] text-slate-400 hover:text-white'
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

            {/* Konten Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Catat Pemakaian Unit LV</div>
                            <div className="text-[10px] text-slate-400">Hilux, Triton, atau Bus Kru</div>
                        </div>
                    </div>

                    <Link
                        href="/bbm"
                        className="p-4 rounded-xl border border-[#1b2e46] bg-[#0c1a2d] hover:bg-[#12243d] hover:border-emerald-500/50 text-slate-200 transition flex items-center gap-3 block"
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

                <main className="lg:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-4">
                            <span className="text-[11px] text-slate-400 block uppercase font-bold">Kesiapan Armada LV</span>
                            <span className="text-xl font-black text-white font-mono mt-1 block">92% Ready</span>
                            <span className="text-[10px] text-emerald-400">Siap Operasional Pit & Mess</span>
                        </div>
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-4">
                            <span className="text-[11px] text-slate-400 block uppercase font-bold">Hunian Mess Camp</span>
                            <span className="text-xl font-black text-amber-400 font-mono mt-1 block">142 / 160 Bed</span>
                            <span className="text-[10px] text-slate-400">Kapasitas Nyaman Terjaga</span>
                        </div>
                        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-4">
                            <span className="text-[11px] text-slate-400 block uppercase font-bold">Genset Power Camp</span>
                            <span className="text-xl font-black text-cyan-400 font-mono mt-1 block">250 kVA</span>
                            <span className="text-[10px] text-emerald-400">✓ Suplai Listrik 24 Jam Aman</span>
                        </div>
                    </div>

                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                            <div className="w-full md:w-80">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari plat, driver, keperluan..."
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                            >
                                + Catat Kendaraan
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2.5">Nomor Unit LV</th>
                                        <th className="pb-2.5">Driver / Pemakai</th>
                                        <th className="pb-2.5">Tujuan Lapangan</th>
                                        <th className="pb-2.5">Keperluan Dinas</th>
                                        <th className="pb-2.5">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {filteredLogs.length > 0 ? (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-[#0c1a2d]/50 transition">
                                                <td className="py-3 font-mono font-bold text-amber-400">{log.plate_number || '-'}</td>
                                                <td className="font-semibold text-white">{log.driver || '-'}</td>
                                                <td className="text-slate-300">{log.destination || '-'}</td>
                                                <td className="text-slate-400">{log.purpose || '-'}</td>
                                                <td>
                                                    <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[10px] px-2 py-0.5 rounded font-bold">
                                                        {log.status || 'Dipakai'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                                                Belum ada data pemakaian kendaraan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Input Kendaraan */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Pencatatan Peminjaman Unit LV
                        </h2>
                        <form onSubmit={handleAddVehicle} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nomor Plat & Tipe LV</label>
                                <input
                                    type="text"
                                    required
                                    value={plateNumber}
                                    onChange={(e) => setPlateNumber(e.target.value)}
                                    placeholder="Contoh: KT 8192 YZ (Hilux 4x4)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Driver / Penanggung Jawab</label>
                                <input
                                    type="text"
                                    required
                                    value={driver}
                                    onChange={(e) => setDriver(e.target.value)}
                                    placeholder="Contoh: Rahmat Hidayat"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Rute / Tujuan</label>
                                <input
                                    type="text"
                                    required
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    placeholder="Contoh: Pit Front A ke Jetty"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Keperluan Operasional</label>
                                <input
                                    type="text"
                                    required
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Contoh: Antar Inspector K3"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
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
                                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Log LV'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}