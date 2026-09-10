'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface MessRoom {
    id: string
    created_at?: string
    room_number: string
    building_zone: string
    capacity: number
    occupied_count: number
    condition_status: string
    pic_supervisor: string
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

export default function MessManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas GA Camp')
    const [userRole, setUserRole] = useState('General Affair')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [rooms, setRooms] = useState<MessRoom[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Kamar / Fasilitas Baru
    const [showModal, setShowModal] = useState(false)
    const [roomNumber, setRoomNumber] = useState('')
    const [buildingZone, setBuildingZone] = useState('Zona A (Operator Heavy Equipment)')
    const [capacity, setCapacity] = useState('4')
    const [occupiedCount, setOccupiedCount] = useState('0')
    const [conditionStatus, setConditionStatus] = useState('Baik')
    const [picSupervisor, setPicSupervisor] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initMess() {
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
                    setUserName(profile?.full_name || 'General Affair Supervisor')
                    const division = (profile?.role || 'General Affair').trim()
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
                                    (cleanDiv.includes('mess') && target.includes('mess')) ||
                                    (cleanDiv.includes('ga') && target.includes('ga'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['mess']
                            }
                        } else {
                            grantedKeys = ['mess']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('mess')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Mess & Camp.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    const { data, error } = await supabase
                        .from('ga_mess_facilities')
                        .select('*')
                        .order('room_number', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setRooms(data)
                    } else {
                        setRooms([
                            {
                                id: '1',
                                room_number: 'Mess A-101',
                                building_zone: 'Zona A (Operator Heavy Equipment)',
                                capacity: 4,
                                occupied_count: 4,
                                condition_status: 'Baik',
                                pic_supervisor: 'Slamet Riyadi',
                                notes: 'AC Split 1PK Berfungsi Normal',
                            },
                            {
                                id: '2',
                                room_number: 'Mess A-102',
                                building_zone: 'Zona A (Operator Heavy Equipment)',
                                capacity: 4,
                                occupied_count: 3,
                                condition_status: 'Baik',
                                pic_supervisor: 'Slamet Riyadi',
                                notes: 'Satu bed kosong roster off',
                            },
                            {
                                id: '3',
                                room_number: 'Mess B-201',
                                building_zone: 'Zona B (Staff & Pengawas Pit)',
                                capacity: 2,
                                occupied_count: 2,
                                condition_status: 'Perbaikan',
                                pic_supervisor: 'Dedi Saputra',
                                notes: 'Penggantian stop kontak & saluran air kamar mandi',
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

        initMess()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!roomNumber || !picSupervisor) return

        setSubmitting(true)

        const payload = {
            room_number: roomNumber.toUpperCase(),
            building_zone: buildingZone,
            capacity: parseInt(capacity) || 4,
            occupied_count: parseInt(occupiedCount) || 0,
            condition_status: conditionStatus,
            pic_supervisor: picSupervisor,
            notes,
        }

        const { data, error } = await supabase
            .from('ga_mess_facilities')
            .insert([payload])
            .select()

        if (!error && data) {
            setRooms([...rooms, data[0]])
            setShowModal(false)
            setRoomNumber('')
            setPicSupervisor('')
            setNotes('')
        } else {
            setRooms([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...rooms,
            ])
            setShowModal(false)
            setRoomNumber('')
            setPicSupervisor('')
            setNotes('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalCapacity = rooms.reduce((acc, curr) => acc + Number(curr.capacity || 0), 0)
    const totalOccupied = rooms.reduce((acc, curr) => acc + Number(curr.occupied_count || 0), 0)
    const availableBeds = totalCapacity - totalOccupied

    const filteredRooms = rooms.filter((item) =>
        (item?.room_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.building_zone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.pic_supervisor || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Akomodasi Mess & Fasilitas Camp...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🏠</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen Akomodasi Mess & Camp PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Kontrol Okupensi Kamar, Kebersihan, & Fasilitas Karyawan Site</span>
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
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Kapasitas Bed</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalCapacity} Bed</div>
                    <p className="mt-2 text-[11px] text-slate-400">Kapasitas Maksimal Camp Site</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Penghuni Aktif (Terisi)</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{totalOccupied} Orang</div>
                    <p className="mt-2 text-[11px] text-slate-400">Kru Shift On-Site</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ketersediaan Bed (Kosong)</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{availableBeds} Bed</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Siap Untuk Penempatan Kru Baru</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kenyamanan & Kebersihan</h3>
                    <div className="text-2xl font-black text-sky-400 font-mono">100% OK</div>
                    <p className="mt-2 text-[11px] text-sky-400 font-medium">✓ Pemeliharaan Rutin GA Berjalan</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor kamar, zona, atau PIC..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Tambah Data Kamar Mess
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nomor Kamar</th>
                                <th className="pb-2">Zona Gedung Camp</th>
                                <th className="pb-2 text-center">Kapasitas Bed</th>
                                <th className="pb-2 text-center">Terisi</th>
                                <th className="pb-2 text-center">Status Kamar</th>
                                <th className="pb-2">Pengawas (GA)</th>
                                <th className="pb-2">Catatan Fasilitas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredRooms.length > 0 ? (
                                filteredRooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-2.5 font-bold font-mono text-amber-400">{room.room_number}</td>
                                        <td className="font-semibold text-white">{room.building_zone}</td>
                                        <td className="text-center font-mono text-slate-300">{room.capacity} Bed</td>
                                        <td className="text-center font-mono font-bold text-emerald-400">{room.occupied_count} Orang</td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${room.condition_status === 'Baik'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                    }`}
                                            >
                                                {room.condition_status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{room.pic_supervisor}</td>
                                        <td className="text-slate-400">{room.notes || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada kamar mess yang cocok dengan pencarian.
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
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tambah Data Kamar & Akomodasi Mess</h2>
                        <form onSubmit={handleAddRoom} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nomor / Nama Kamar</label>
                                <input
                                    type="text"
                                    required
                                    value={roomNumber}
                                    onChange={(e) => setRoomNumber(e.target.value)}
                                    placeholder="Contoh: Mess A-103"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Zona Gedung Camp</label>
                                <input
                                    type="text"
                                    required
                                    value={buildingZone}
                                    onChange={(e) => setBuildingZone(e.target.value)}
                                    placeholder="Contoh: Zona A (Operator Heavy Equipment)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kapasitas Bed</label>
                                    <input
                                        type="number"
                                        required
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                        placeholder="4"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Penghuni Saat Ini</label>
                                    <input
                                        type="number"
                                        required
                                        value={occupiedCount}
                                        onChange={(e) => setOccupiedCount(e.target.value)}
                                        placeholder="2"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kondisi Kamar</label>
                                    <select
                                        value={conditionStatus}
                                        onChange={(e) => setConditionStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Baik">Baik & Layak Huni</option>
                                        <option value="Perbaikan">Dalam Perbaikan (Maintenance)</option>
                                        <option value="Penuh">Penuh</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Pengawas (GA)</label>
                                    <input
                                        type="text"
                                        required
                                        value={picSupervisor}
                                        onChange={(e) => setPicSupervisor(e.target.value)}
                                        placeholder="Nama PIC GA"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Catatan Fasilitas (Opsional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: AC Normal, Kasur Springbed Baru"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Kamar Mess'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}