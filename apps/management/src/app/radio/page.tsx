'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface RadioItem {
    id: string
    created_at?: string
    radio_code: string
    brand_model: string
    device_type: string
    department_holder: string
    condition_status: string
    battery_status?: string
    notes?: string
}

export default function RadioManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Dispatcher Radio')
    const [radios, setRadios] = useState<RadioItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Radio Baru
    const [showModal, setShowModal] = useState(false)
    const [radioCode, setRadioCode] = useState('')
    const [brandModel, setBrandModel] = useState('Motorola GP328')
    const [deviceType, setDeviceType] = useState('Handy Talkie (HT)')
    const [departmentHolder, setDepartmentHolder] = useState('Operasional Pit')
    const [conditionStatus, setConditionStatus] = useState('Baik')
    const [batteryStatus, setBatteryStatus] = useState('Normal')
    const [notes, setNotes] = useState('')
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
                    setUserName(profile?.full_name || 'Radio Communications Supervisor')

                    const { data, error } = await supabase
                        .from('radio_inventory')
                        .select('*')
                        .order('radio_code', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setRadios(data)
                    } else {
                        setRadios([
                            {
                                id: '1',
                                radio_code: 'HT-PIT-01',
                                brand_model: 'Motorola GP328 VHF',
                                device_type: 'Handy Talkie (HT)',
                                department_holder: 'Pengawas Pit Barat',
                                condition_status: 'Baik',
                                battery_status: 'Normal',
                                notes: 'Frekuensi Kanal 1 (Pit Operation)',
                            },
                            {
                                id: '2',
                                radio_code: 'RIG-DT-12',
                                brand_model: 'Icom IC-M2300 / Mobile Rig',
                                device_type: 'Rig Mobile (Vehicle)',
                                department_holder: 'Hauling Contractor',
                                condition_status: 'Baik',
                                battery_status: 'Normal',
                                notes: 'Terpasang di Dump Truck Scania',
                            },
                            {
                                id: '3',
                                radio_code: 'HT-HSE-03',
                                brand_model: 'Kenwood TH-K20A',
                                device_type: 'Handy Talkie (HT)',
                                department_holder: 'K3 & Lingkungan (HSE)',
                                condition_status: 'Perbaikan',
                                battery_status: 'Drop',
                                notes: 'Ganti baterai cadangan di workshop',
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

        initRadio()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddRadio = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!radioCode || !brandModel) return

        setSubmitting(true)

        const payload = {
            radio_code: radioCode.toUpperCase(),
            brand_model: brandModel,
            device_type: deviceType,
            department_holder: departmentHolder,
            condition_status: conditionStatus,
            battery_status: batteryStatus,
            notes,
        }

        const { data, error } = await supabase
            .from('radio_inventory')
            .insert([payload])
            .select()

        if (!error && data) {
            setRadios([...radios, data[0]])
            setShowModal(false)
            setRadioCode('')
            setNotes('')
        } else {
            alert('Gagal mendaftarkan unit radio: ' + (error?.message || 'Kode radio sudah terdaftar.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalRadios = radios.length
    const activeRadios = radios.filter((r) => r.condition_status === 'Baik').length
    const repairRadios = radios.filter((r) => r.condition_status === 'Perbaikan' || r.condition_status === 'Rusak').length

    const filteredRadios = radios.filter((item) =>
        item.radio_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department_holder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.device_type.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/mess', label: 'Mess & Camp', icon: '🏠' },
        { href: '/vendor', label: 'Vendor', icon: '🤝' },
        { href: '/radio', label: 'Radio Komunikasi', icon: '📻' },
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
                <p className="text-xs text-slate-400">Sinkronisasi Jaringan Radio Komunikasi Site...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">📻</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen Radio Komunikasi & HT PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Frekuensi Kanal VHF/UHF, Handty Talkie, & Rig Mobile Hauling</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Communications Dept
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

            {/* KPI Radio */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Unit Terdaftar</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalRadios} Unit</div>
                    <p className="mt-2 text-[11px] text-slate-400">HT, Rig Mobile & Repeater</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Berfungsi Baik</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{activeRadios} Unit</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Komunikasi Lapangan Lancar</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dalam Perbaikan / Drop</h3>
                    <div className={`text-2xl font-black font-mono ${repairRadios > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {repairRadios} Unit
                    </div>
                    <p className="mt-2 text-[11px] text-rose-400/80 font-medium">Penanganan Tim IT / Komunikasi</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kandungan Jaringan</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">VHF / UHF</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Sinyal Jangkauan Seluruh Pit</p>
                </div>
            </div>

            {/* Grid Tabel Radio */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kode radio, merek, departemen..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Daftarkan Unit Radio Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Kode / No. Unit</th>
                                <th className="pb-2">Merek & Tipe Perangkat</th>
                                <th className="pb-2">Jenis Perangkat</th>
                                <th className="pb-2">Departemen / Pemegang</th>
                                <th className="pb-2 text-center">Status Baterai</th>
                                <th className="pb-2 text-center">Kondisi Alat</th>
                                <th className="pb-2">Catatan Kanal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredRadios.length > 0 ? (
                                filteredRadios.map((r) => (
                                    <tr key={r.id}>
                                        <td className="py-2.5 font-bold font-mono text-amber-400">{r.radio_code}</td>
                                        <td className="font-semibold text-white">{r.brand_model}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {r.device_type}
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{r.department_holder}</td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.battery_status === 'Normal'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                                    }`}
                                            >
                                                {r.battery_status?.toUpperCase() || 'NORMAL'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.condition_status === 'Baik'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                                    }`}
                                            >
                                                {r.condition_status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{r.notes || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada unit radio yang cocok dengan pencarian.
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
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Registrasi Perangkat Radio Komunikasi Baru</h2>
                        <form onSubmit={handleAddRadio} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Kode / Nomor Unit Radio</label>
                                <input
                                    type="text"
                                    required
                                    value={radioCode}
                                    onChange={(e) => setRadioCode(e.target.value)}
                                    placeholder="Contoh: HT-PIT-05 atau RIG-EX-02"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Merek & Tipe Perangkat</label>
                                <input
                                    type="text"
                                    required
                                    value={brandModel}
                                    onChange={(e) => setBrandModel(e.target.value)}
                                    placeholder="Contoh: Motorola GP328 VHF"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
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
                                        <option value="Repeater Station">Repeater Station</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Departemen / Pengguna</label>
                                    <input
                                        type="text"
                                        required
                                        value={departmentHolder}
                                        onChange={(e) => setDepartmentHolder(e.target.value)}
                                        placeholder="Contoh: Pengawas Pit Barat"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kondisi Alat</label>
                                    <select
                                        value={conditionStatus}
                                        onChange={(e) => setConditionStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Baik">Baik & Berfungsi</option>
                                        <option value="Perbaikan">Dalam Perbaikan</option>
                                        <option value="Rusak">Rusak Total</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Baterai</label>
                                    <select
                                        value={batteryStatus}
                                        onChange={(e) => setBatteryStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Normal">Normal (Optimal)</option>
                                        <option value="Drop">Drop (Perlu Cas/Ganti)</option>
                                        <option value="Baru">Baterai Baru</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Catatan Kanal Frekuensi (Opsional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Frekuensi Kanal 1 (Pit Operation)"
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