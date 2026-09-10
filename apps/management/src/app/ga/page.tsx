'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface RadioUnit {
    id: string
    created_at?: string
    unit_code: string
    brand_model: string
    device_type: string
    holder_dept: string
    battery_status: string
    device_condition: string
    channel_notes: string
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

export default function RadioManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Staff Radio')
    const [userRole, setUserRole] = useState('Communications Dept')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [radioUnits, setRadioUnits] = useState<RadioUnit[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Modal State Input Radio Baru
    const [showModal, setShowModal] = useState(false)
    const [unitCode, setUnitCode] = useState('')
    const [brandModel, setBrandModel] = useState('')
    const [deviceType, setDeviceType] = useState('Handy Talkie (HT)')
    const [holderDept, setHolderDept] = useState('Pengawas Pit Barat')
    const [batteryStatus, setBatteryStatus] = useState('NORMAL')
    const [deviceCondition, setDeviceCondition] = useState('BAIK')
    const [channelNotes, setChannelNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initRadio() {
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
                    setUserName(profile?.full_name || 'Staff Dispatch Radio')
                    const division = (profile?.role || 'Umum').trim()
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
                                    (cleanDiv.includes('umum') && (target.includes('ga') || target.includes('general') || target.includes('umum'))) ||
                                    (cleanDiv.includes('ga') && (target.includes('ga') || target.includes('general')))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['radio', 'ga']
                            }
                        } else {
                            grantedKeys = ['radio', 'ga']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('radio')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Radio Komunikasi.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    // Data Radio dari Supabase
                    const { data, error } = await supabase
                        .from('radio_devices')
                        .select('*')
                        .order('unit_code', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setRadioUnits(data)
                    } else {
                        setRadioUnits([
                            {
                                id: '1',
                                unit_code: 'HT-PIT-01',
                                brand_model: 'Motorola GP328 VHF',
                                device_type: 'Handy Talkie (HT)',
                                holder_dept: 'Pengawas Pit Barat',
                                battery_status: 'NORMAL',
                                device_condition: 'BAIK',
                                channel_notes: 'Frekuensi Kanal 1 (Pit Operation)',
                            },
                            {
                                id: '2',
                                unit_code: 'RIG-DT-12',
                                brand_model: 'Icom IC-M2300 / Mobile Rig',
                                device_type: 'Rig Mobile (Vehicle)',
                                holder_dept: 'Hauling Contractor',
                                battery_status: 'NORMAL',
                                device_condition: 'BAIK',
                                channel_notes: 'Terpasang di Dump Truck Scania',
                            },
                            {
                                id: '3',
                                unit_code: 'HT-HSE-03',
                                brand_model: 'Kenwood TH-K20A',
                                device_type: 'Handy Talkie (HT)',
                                holder_dept: 'K3 & Lingkungan (HSE)',
                                battery_status: 'DROP',
                                device_condition: 'PERBAIKAN',
                                channel_notes: 'Ganti baterai cadangan di workshop',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error load radio:', err)
                if (isMounted) setLoading(false)
            }
        }

        initRadio()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddRadio = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!unitCode || !brandModel) return

        setSubmitting(true)
        const payload = {
            unit_code: unitCode.toUpperCase().trim(),
            brand_model: brandModel,
            device_type: deviceType,
            holder_dept: holderDept,
            battery_status: batteryStatus,
            device_condition: deviceCondition,
            channel_notes: channelNotes || 'Kanal Operasional Utama',
        }

        const { data, error } = await supabase.from('radio_devices').insert([payload]).select()

        if (!error && data) {
            setRadioUnits([...radioUnits, data[0]])
            setShowModal(false)
            setUnitCode('')
            setBrandModel('')
            setChannelNotes('')
        } else {
            setRadioUnits([
                ...radioUnits,
                {
                    id: Date.now().toString(),
                    ...payload,
                },
            ])
            setShowModal(false)
            setUnitCode('')
            setBrandModel('')
            setChannelNotes('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalUnits = radioUnits.length
    const goodUnits = radioUnits.filter((r) => (r.device_condition || '').toUpperCase() === 'BAIK').length
    const repairUnits = radioUnits.filter((r) => (r.device_condition || '').toUpperCase() !== 'BAIK').length

    const filteredUnits = radioUnits.filter((item) =>
        (item.unit_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand_model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.holder_dept || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.channel_notes || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Hanya tampilkan modul yang berizin
    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">
                    Sinkronisasi Frekuensi & Perangkat Radio PT. Jangkar Energi Eka Perkasa...
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
                        <span className="text-3xl">📻</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen Radio Komunikasi & HT PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Frekuensi Kanal VHF/UHF, Handy Talkie, & Rig Mobile Hauling Nikel</span>
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

                {/* Bilah Navigasi Dinamis Terfilter */}
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Unit Terdaftar</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalUnits} Unit</div>
                    <p className="mt-2 text-[11px] text-slate-400">HT, Rig Mobile & Repeater Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Berfungsi Baik</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{goodUnits} Unit</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">Komunikasi Lapangan Lancar</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dalam Perbaikan / Drop</h3>
                    <div className="text-2xl font-black text-rose-400 font-mono">{repairUnits} Unit</div>
                    <p className="mt-2 text-[11px] text-slate-400">Penanganan Tim IT / Komunikasi</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jangkauan Jaringan</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">VHF / UHF</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Sinyal Jangkauan Seluruh Pit & Jetty</p>
                </div>
            </div>

            {/* Grid Tabel Data Radio */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kode radio, merek, departemen..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> <span>Daftarkan Unit Radio Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2.5">Kode / No. Unit</th>
                                <th className="pb-2.5">Merek & Tipe Perangkat</th>
                                <th className="pb-2.5">Jenis Perangkat</th>
                                <th className="pb-2.5">Departemen / Pemegang</th>
                                <th className="pb-2.5 text-center">Status Baterai</th>
                                <th className="pb-2.5 text-center">Kondisi Alat</th>
                                <th className="pb-2.5">Catatan Kanal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredUnits.length > 0 ? (
                                filteredUnits.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-3 font-mono font-bold text-amber-400">{item.unit_code}</td>
                                        <td className="font-semibold text-white">{item.brand_model}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {item.device_type}
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{item.holder_dept}</td>
                                        <td className="text-center">
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${(item.battery_status || '').toUpperCase() === 'NORMAL'
                                                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                                                    : 'bg-rose-950/80 text-rose-400 border-rose-800/40'
                                                    }`}
                                            >
                                                {item.battery_status}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${(item.device_condition || '').toUpperCase() === 'BAIK'
                                                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                                                    : 'bg-amber-950/80 text-amber-400 border-amber-800/40'
                                                    }`}
                                            >
                                                {item.device_condition}
                                            </span>
                                        </td>
                                        <td className="text-slate-400 font-mono text-[11px]">{item.channel_notes}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Belum ada unit radio yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Radio */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Registrasi Perangkat Radio Site
                        </h2>
                        <form onSubmit={handleAddRadio} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kode / ID Radio</label>
                                    <input
                                        type="text"
                                        required
                                        value={unitCode}
                                        onChange={(e) => setUnitCode(e.target.value)}
                                        placeholder="Contoh: HT-PIT-05"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Merek & Seri Perangkat</label>
                                    <input
                                        type="text"
                                        required
                                        value={brandModel}
                                        onChange={(e) => setBrandModel(e.target.value)}
                                        placeholder="Contoh: Motorola GP328 VHF"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jenis Perangkat</label>
                                    <select
                                        value={deviceType}
                                        onChange={(e) => setDeviceType(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Handy Talkie (HT)">Handy Talkie (HT)</option>
                                        <option value="Rig Mobile (Vehicle)">Rig Mobile (Vehicle)</option>
                                        <option value="Base Station">Base Station Dispatch</option>
                                        <option value="Repeater">Repeater Tower</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Departemen / Pengguna</label>
                                    <input
                                        type="text"
                                        required
                                        value={holderDept}
                                        onChange={(e) => setHolderDept(e.target.value)}
                                        placeholder="Contoh: Pengawas Pit Barat"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Baterai</label>
                                    <select
                                        value={batteryStatus}
                                        onChange={(e) => setBatteryStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="NORMAL">NORMAL</option>
                                        <option value="DROP">DROP / LEMAH</option>
                                        <option value="CHARGING">SEDANG CHARGE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kondisi Alat</label>
                                    <select
                                        value={deviceCondition}
                                        onChange={(e) => setDeviceCondition(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="BAIK">BAIK (SIAP PAKAI)</option>
                                        <option value="PERBAIKAN">RUSAK / PERBAIKAN</option>
                                        <option value="STANDBY">STANDBY DI GUDANG</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Catatan Kanal Frekuensi</label>
                                <input
                                    type="text"
                                    value={channelNotes}
                                    onChange={(e) => setChannelNotes(e.target.value)}
                                    placeholder="Contoh: Kanal 1 (Pit Front), Kanal 2 (Hauling)"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Unit Radio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}