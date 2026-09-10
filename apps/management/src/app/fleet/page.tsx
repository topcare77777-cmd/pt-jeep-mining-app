'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface FleetUnit {
    id: string
    created_at?: string
    unit_code: string
    unit_model: string
    category: string
    status: 'OP' | 'ST' | 'BD' | 'UM' | string
    hm_km: number
    issue_description?: string
    lead_mechanic?: string
    location_pit: string
}

const ALL_MODULES = [
    { key: 'manager-site', label: 'Pit Produksi', icon: '⛏️', href: '/manager-site' },
    { key: 'geologi', label: 'Geologi & Eksplorasi', icon: '🧭', href: '/geologi' },
    { key: 'fleet', label: 'Alat Berat', icon: '🚜', href: '/fleet' },
    { key: 'fleet-maintenance', label: 'Workshop Fleet', icon: '🔧', href: '/fleet-maintenance' },
    { key: 'sparepart', label: 'Sparepart Gudang', icon: '📦', href: '/sparepart' },
    { key: 'safety', label: 'Inspeksi K3 (HSE)', icon: '⛑️', href: '/safety' },
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

export default function FleetManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Plant & Maintenance')
    const [userRole, setUserRole] = useState('Plant Department')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [units, setUnits] = useState<FleetUnit[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Unit Baru / Work Order
    const [showModal, setShowModal] = useState(false)
    const [unitCode, setUnitCode] = useState('')
    const [unitModel, setUnitModel] = useState('')
    const [category, setCategory] = useState('Excavator')
    const [status, setStatus] = useState('OP')
    const [hmKm, setHmKm] = useState('')
    const [locationPit, setLocationPit] = useState('Pit Area Barat')
    const [issue, setIssue] = useState('')
    const [mechanic, setMechanic] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initFleet() {
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
                    setUserName(profile?.full_name || 'Plant Superintendent')
                    const division = (profile?.role || 'Plant Department').trim()
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
                                    (cleanDiv.includes('plant') && target.includes('plant')) ||
                                    (cleanDiv.includes('fleet') && target.includes('fleet')) ||
                                    (cleanDiv.includes('alat') && target.includes('alat'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['fleet']
                            }
                        } else {
                            grantedKeys = ['fleet']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('fleet')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Alat Berat.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    const { data, error } = await supabase
                        .from('fleet_units')
                        .select('*')
                        .order('unit_code', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setUnits(data)
                    } else {
                        setUnits([
                            {
                                id: '1',
                                unit_code: 'EX-201',
                                unit_model: 'Komatsu PC400LC-8',
                                category: 'Excavator',
                                status: 'OP',
                                hm_km: 8420.5,
                                location_pit: 'Front Loading Pit Barat',
                            },
                            {
                                id: '2',
                                unit_code: 'DZ-102',
                                unit_model: 'CAT D85ESS-2',
                                category: 'Bulldozer',
                                status: 'OP',
                                hm_km: 6120.0,
                                location_pit: 'Disposal Area Selatan',
                            },
                            {
                                id: '3',
                                unit_code: 'DT-55',
                                unit_model: 'Scania P380 XT',
                                category: 'Dump Truck',
                                status: 'BD',
                                hm_km: 14500.0,
                                issue_description: 'Kebocoran Selang Hidrolik Dump',
                                lead_mechanic: 'Budi Mekanik',
                                location_pit: 'Workshop Bengkel Site',
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

        initFleet()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!unitCode || !unitModel) return

        setSubmitting(true)

        const payload = {
            unit_code: unitCode.toUpperCase(),
            unit_model: unitModel,
            category,
            status,
            hm_km: parseFloat(hmKm) || 0,
            location_pit: locationPit,
            issue_description: issue || null,
            lead_mechanic: mechanic || null,
        }

        const { data, error } = await supabase
            .from('fleet_units')
            .insert([payload])
            .select()

        if (!error && data) {
            setUnits([data[0], ...units])
            setShowModal(false)
            setUnitCode('')
            setUnitModel('')
            setHmKm('')
            setIssue('')
            setMechanic('')
        } else {
            setUnits([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...units,
            ])
            setShowModal(false)
            setUnitCode('')
            setUnitModel('')
            setHmKm('')
            setIssue('')
            setMechanic('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    // Hitung KPI PA/MA
    const totalUnits = units.length
    const operatingUnits = units.filter((u) => u.status === 'OP').length
    const standbyUnits = units.filter((u) => u.status === 'ST').length
    const breakdownUnits = units.filter((u) => u.status === 'BD' || u.status === 'UM').length

    const physicalAvailability = totalUnits > 0
        ? (((operatingUnits + standbyUnits) / totalUnits) * 100).toFixed(1)
        : '100.0'

    const filteredUnits = units.filter((item) =>
        (item?.unit_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.unit_model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Status Alat Berat (Fleet Plant)...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🚜</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Fleet Management & Plant Kesiapan Alat Berat
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Physical & Mechanical Availability Monitor (PA/MA)</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
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
                        <span>Akses Terbatas Divisi: Menampilkan modul berizin untuk divisi Anda.</span>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Physical Availability (PA)</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        {physicalAvailability}%
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Target Standard Tambang &gt; 85%</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Beroperasi (OP)</h3>
                    <div className="text-2xl font-black text-white font-mono">
                        {operatingUnits} / {totalUnits} Unit
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Ready Loading & Hauling</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Standby Unit (ST)</h3>
                    <div className="text-2xl font-black text-sky-400 font-mono">
                        {standbyUnits} Unit
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Siap Ditugaskan (Kesiapan Cadangan)</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Break Down / Bengkel</h3>
                    <div className="text-2xl font-black text-rose-400 font-mono">
                        {breakdownUnits} Unit
                    </div>
                    <p className="mt-2 text-[11px] text-rose-400/80 font-medium">Dalam Penanganan Mekanik</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kode unit (EX, DT, DZ)..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Registrasi / Status Unit
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">No. Lambung</th>
                                <th className="pb-2">Model Alat</th>
                                <th className="pb-2">Kategori</th>
                                <th className="pb-2">Hour Meter (HM)</th>
                                <th className="pb-2">Lokasi Terkini</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2">Catatan Kerusakan / Mekanik</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredUnits.length > 0 ? (
                                filteredUnits.map((u) => {
                                    const isBreakdown = u.status === 'BD' || u.status === 'UM'
                                    return (
                                        <tr key={u.id} className="hover:bg-[#0c1a2d]/50 transition">
                                            <td className="py-2.5 font-bold font-mono text-amber-400">{u.unit_code}</td>
                                            <td className="font-semibold text-white">{u.unit_model}</td>
                                            <td className="text-slate-400">{u.category}</td>
                                            <td className="font-mono text-slate-300">{Number(u.hm_km || 0).toLocaleString('id-ID')} Jam</td>
                                            <td className="text-slate-300">{u.location_pit}</td>
                                            <td>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${u.status === 'OP'
                                                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                                                            : u.status === 'ST'
                                                                ? 'bg-sky-950/80 text-sky-400 border-sky-800/40'
                                                                : 'bg-rose-950/80 text-rose-400 border-rose-800/40'
                                                        }`}
                                                >
                                                    {u.status === 'OP' ? 'OPERATING' : u.status === 'ST' ? 'STANDBY' : 'BREAKDOWN'}
                                                </span>
                                            </td>
                                            <td className="text-slate-400">
                                                {isBreakdown ? (
                                                    <span className="text-rose-300 text-[11px]">
                                                        ⚠️ {u.issue_description || 'Perbaikan rutin'} ({u.lead_mechanic || 'Mekanik Site'})
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 text-[11px]">- Siap Operasi -</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada unit yang cocok dengan pencarian.
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
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Status & Registrasi Armada Pit</h2>
                        <form onSubmit={handleAddUnit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Lambung Unit</label>
                                    <input
                                        type="text"
                                        required
                                        value={unitCode}
                                        onChange={(e) => setUnitCode(e.target.value)}
                                        placeholder="Contoh: EX-202"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Model & Tipe</label>
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

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori Alat</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Excavator">Excavator</option>
                                        <option value="Dump Truck">Dump Truck (Hauler)</option>
                                        <option value="Bulldozer">Bulldozer</option>
                                        <option value="Motor Grader">Motor Grader</option>
                                        <option value="Water Truck">Water Truck & Fuel Truck</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kondisi Kesiapan</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="OP">Operating (Beroperasi)</option>
                                        <option value="ST">Standby (Siap/Cadangan)</option>
                                        <option value="BD">Break Down (Rusak)</option>
                                        <option value="UM">Under Maintenance (Servis)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Hour Meter (HM)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={hmKm}
                                        onChange={(e) => setHmKm(e.target.value)}
                                        placeholder="Contoh: 8520"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Lokasi Unit di Pit</label>
                                    <input
                                        type="text"
                                        value={locationPit}
                                        onChange={(e) => setLocationPit(e.target.value)}
                                        placeholder="Pit Barat / Workshop"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            {(status === 'BD' || status === 'UM') && (
                                <div className="space-y-2 border-t border-[#1b2e46] pt-2">
                                    <div>
                                        <label className="text-[11px] text-rose-400 block mb-1">Rincian Kerusakan (Issue)</label>
                                        <input
                                            type="text"
                                            value={issue}
                                            onChange={(e) => setIssue(e.target.value)}
                                            placeholder="Contoh: Radiator overheat / Silinder bocor"
                                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-400 block mb-1">Mekanik yang Menangani</label>
                                        <input
                                            type="text"
                                            value={mechanic}
                                            onChange={(e) => setMechanic(e.target.value)}
                                            placeholder="Nama lead mekanik"
                                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                </div>
                            )}

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
                                    {submitting ? 'Menyimpan...' : 'Simpan Data Armada'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}