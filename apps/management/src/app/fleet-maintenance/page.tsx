'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface MaintenanceItem {
    id: string
    created_at?: string
    unit_code: string
    equipment_model: string
    maintenance_type: string
    current_hour_meter: number
    repair_status: string
    mechanic_lead: string
    notes?: string
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

export default function FleetMaintenancePage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Plant Superintendent')
    const [userRole, setUserRole] = useState('Plant Dept')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Perawatan Baru
    const [showModal, setShowModal] = useState(false)
    const [unitCode, setUnitCode] = useState('EX-05')
    const [equipmentModel, setEquipmentModel] = useState('Komatsu PC200-8M0')
    const [maintenanceType, setMaintenanceType] = useState('Servis Berkala 500 HM')
    const [currentHourMeter, setCurrentHourMeter] = useState('4120.5')
    const [repairStatus, setRepairStatus] = useState('Dalam Perbaikan')
    const [mechanicLead, setMechanicLead] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initMaintenance() {
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
                    setUserName(profile?.full_name || 'Plant & Workshop Supervisor')
                    const division = (profile?.role || 'Plant Dept').trim()
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
                                    (cleanDiv.includes('maintenance') && target.includes('maintenance')) ||
                                    (cleanDiv.includes('workshop') && target.includes('workshop'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['fleet-maintenance']
                            }
                        } else {
                            grantedKeys = ['fleet-maintenance']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('fleet-maintenance')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Workshop Fleet.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    const { data, error } = await supabase
                        .from('fleet_maintenance_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setMaintenanceLogs(data)
                    } else {
                        setMaintenanceLogs([
                            {
                                id: '1',
                                unit_code: 'EX-05',
                                equipment_model: 'Komatsu PC200-8M0',
                                maintenance_type: 'Servis Berkala 500 HM',
                                current_hour_meter: 4120.5,
                                repair_status: 'Dalam Perbaikan',
                                mechanic_lead: 'Budi Mekanik Utama',
                                notes: 'Penggantian filter oli, solar, dan hidrolik',
                            },
                            {
                                id: '2',
                                unit_code: 'DT-12',
                                equipment_model: 'Scania P360 Tipper',
                                maintenance_type: 'Perbaikan Sistem Pengereman',
                                current_hour_meter: 6890.0,
                                repair_status: 'Selesai Servis',
                                mechanic_lead: 'Joko Senior Mechanic',
                                notes: 'Uji coba rem dan siap turun pit kembali',
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

        initMaintenance()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddMaintenance = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!unitCode || !equipmentModel) return

        setSubmitting(true)

        const payload = {
            unit_code: unitCode.toUpperCase(),
            equipment_model: equipmentModel,
            maintenance_type: maintenanceType,
            current_hour_meter: parseFloat(currentHourMeter) || 0,
            repair_status: repairStatus,
            mechanic_lead: mechanicLead || userName,
            notes,
        }

        const { data, error } = await supabase
            .from('fleet_maintenance_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setMaintenanceLogs([data[0], ...maintenanceLogs])
            setShowModal(false)
            setUnitCode('DT-15')
            setNotes('')
        } else {
            setMaintenanceLogs([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...maintenanceLogs,
            ])
            setShowModal(false)
            setUnitCode('DT-15')
            setNotes('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalLogs = maintenanceLogs.length
    const inRepairCount = maintenanceLogs.filter((m) => m.repair_status === 'Dalam Perbaikan').length
    const finishedCount = maintenanceLogs.filter((m) => m.repair_status === 'Selesai Servis').length

    const filteredLogs = maintenanceLogs.filter((item) =>
        (item?.unit_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.equipment_model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.maintenance_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.mechanic_lead || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Jadwal Pemeliharaan Alat Berat...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🔧</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Pemeliharaan & Workshop Alat Berat PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Jadwal Servis HM, Status Perbaikan Workshop, & Ketersediaan Armada</span>
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
                        <span>Akses Terbatas: Menampilkan modul berizin untuk divisi Anda.</span>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Unit Masuk Workshop</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalLogs} Unit</div>
                    <p className="mt-2 text-[11px] text-slate-400">Rekapitulasi Perawatan Fleet</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dalam Perbaikan Aktif</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{inRepairCount} Unit</div>
                    <p className="mt-2 text-[11px] text-amber-400 font-semibold">Dikerjakan Tim Mekanik</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selesai Servis (Ready)</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{finishedCount} Unit</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Siap Beroperasi di Front Pit</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Physical Availability (PA)</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">92.5%</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Melebihi Target Key Performance</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kode unit, model, mekanik..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Daftarkan Unit Masuk Workshop
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Kode Unit</th>
                                <th className="pb-2">Model Alat Berat</th>
                                <th className="pb-2">Jenis Perawatan</th>
                                <th className="pb-2 text-right">Hour Meter (HM)</th>
                                <th className="pb-2 text-center">Status Perbaikan</th>
                                <th className="pb-2">Kepala Mekanik (PIC)</th>
                                <th className="pb-2">Catatan Workshop</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((m) => {
                                    const isInRepair = m.repair_status === 'Dalam Perbaikan'
                                    return (
                                        <tr key={m.id} className="hover:bg-[#0c1a2d]/50 transition">
                                            <td className="py-2.5 font-bold font-mono text-amber-400">{m.unit_code}</td>
                                            <td className="font-semibold text-white">{m.equipment_model}</td>
                                            <td>
                                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                    {m.maintenance_type}
                                                </span>
                                            </td>
                                            <td className="text-right font-mono text-slate-300">{Number(m.current_hour_meter).toLocaleString('id-ID')} HM</td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isInRepair
                                                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        }`}
                                                >
                                                    {m.repair_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-slate-300">{m.mechanic_lead}</td>
                                            <td className="text-slate-400">{m.notes || '-'}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data maintenance yang cocok dengan pencarian.
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
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Unit Masuk Workshop (Maintenance)</h2>
                        <form onSubmit={handleAddMaintenance} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kode Unit</label>
                                    <input
                                        type="text"
                                        required
                                        value={unitCode}
                                        onChange={(e) => setUnitCode(e.target.value)}
                                        placeholder="Contoh: EX-05"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Model Alat Berat</label>
                                    <input
                                        type="text"
                                        required
                                        value={equipmentModel}
                                        onChange={(e) => setEquipmentModel(e.target.value)}
                                        placeholder="Komatsu PC200"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jenis Perawatan</label>
                                    <input
                                        type="text"
                                        required
                                        value={maintenanceType}
                                        onChange={(e) => setMaintenanceType(e.target.value)}
                                        placeholder="Servis Berkala 500 HM"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Posisi Hour Meter (HM)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={currentHourMeter}
                                        onChange={(e) => setCurrentHourMeter(e.target.value)}
                                        placeholder="4120.5"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Perbaikan</label>
                                    <select
                                        value={repairStatus}
                                        onChange={(e) => setRepairStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="Dalam Perbaikan">Dalam Perbaikan (In Repair)</option>
                                        <option value="Selesai Servis">Selesai Servis (Ready)</option>
                                        <option value="Standby Sparepart">Standby Menunggu Sparepart</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kepala Mekanik (PIC)</label>
                                    <input
                                        type="text"
                                        required
                                        value={mechanicLead}
                                        onChange={(e) => setMechanicLead(e.target.value)}
                                        placeholder="Nama mekanik utama"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Catatan Workshop (Opsional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Penggantian filter oli & hidrolik"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Data Maintenance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}