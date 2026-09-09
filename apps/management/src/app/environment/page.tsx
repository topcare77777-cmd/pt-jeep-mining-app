'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface EnvironmentItem {
    id: string
    created_at?: string
    monitoring_date: string
    location_point: string
    parameter_type: string
    ph_level: number
    tss_level: number
    b3_waste_volume?: string
    compliance_status: string
    inspector_env: string
}

export default function EnvironmentManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Environment Officer')
    const [envLogs, setEnvLogs] = useState<EnvironmentItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Pantau Lingkungan Baru
    const [showModal, setShowModal] = useState(false)
    const [locationPoint, setLocationPoint] = useState('Settling Pond 01 Pit Barat')
    const [parameterType, setParameterType] = useState('Kualitas Air (pH & TSS)')
    const [phLevel, setPhLevel] = useState('7.2')
    const [tssLevel, setTssLevel] = useState('32.5')
    const [b3WasteVolume, setB3WasteVolume] = useState('0')
    const [complianceStatus, setComplianceStatus] = useState('Memenuhi Baku Mutu')
    const [inspectorEnv, setInspectorEnv] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initEnvironment() {
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
                    setUserName(profile?.full_name || 'HSE & Environment Superintendent')

                    const { data, error } = await supabase
                        .from('environmental_compliance_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setEnvLogs(data)
                    } else {
                        setEnvLogs([
                            {
                                id: '1',
                                monitoring_date: '2026-09-09',
                                location_point: 'Settling Pond 01 Pit Barat (Outlet)',
                                parameter_type: 'Kualitas Air (pH & TSS)',
                                ph_level: 7.4,
                                tss_level: 28.5,
                                b3_waste_volume: '-',
                                compliance_status: 'Memenuhi Baku Mutu',
                                inspector_env: 'Ir. Bambang S.',
                            },
                            {
                                id: '2',
                                monitoring_date: '2026-09-09',
                                location_point: 'TPS Limbah B3 Workshop Utama',
                                parameter_type: 'Penyimpanan Limbah B3',
                                ph_level: 7.0,
                                tss_level: 0.0,
                                b3_waste_volume: '1.5 Ton Oli Bekas',
                                compliance_status: 'Memenuhi Baku Mutu',
                                inspector_env: 'Rian Environment',
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

        initEnvironment()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddEnvLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!locationPoint) return

        setSubmitting(true)

        const payload = {
            location_point: locationPoint,
            parameter_type: parameterType,
            ph_level: parseFloat(phLevel) || 7.0,
            tss_level: parseFloat(tssLevel) || 25.0,
            b3_waste_volume: b3WasteVolume || '-',
            compliance_status: complianceStatus,
            inspector_env: inspectorEnv || userName,
        }

        const { data, error } = await supabase
            .from('environmental_compliance_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setEnvLogs([data[0], ...envLogs])
            setShowModal(false)
            setLocationPoint('Settling Pond 02 Pit Timur')
        } else {
            alert('Gagal menyimpan log lingkungan: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalLogs = envLogs.length
    const compliantCount = envLogs.filter((l) => l.compliance_status.includes('Memenuhi')).length

    const filteredLogs = envLogs.filter((item) =>
        item.location_point.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.parameter_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.inspector_env.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/environment', label: 'Lingkungan Hidup', icon: '🌱' },
        { href: '/training', label: 'Pelatihan', icon: '🎓' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/performance', label: 'Kinerja', icon: '⭐' },
        { href: '/investor', label: 'Investor', icon: '📈' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal', icon: '⚖️' },
        { href: '/helpdesk', label: 'Helpdesk', icon: '🛠️' },
        { href: '/assets', label: 'Aset', icon: '🏷️' },
        { href: '/mess', label: 'Mess', icon: '🏠' },
        { href: '/vendor', label: 'Vendor', icon: '🤝' },
        { href: '/radio', label: 'Radio', icon: '📻' },
        { href: '/clinic', label: 'Klinik', icon: '🏥' },
        { href: '/security', label: 'Security', icon: '🛡️' },
        { href: '/ritase', label: 'Ritase', icon: '🚛' },
        { href: '/jetty', label: 'Jetty Port', icon: '🚢' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
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
                <p className="text-xs text-slate-400">Sinkronisasi Pemantauan Lingkungan & Limbah B3...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🌱</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Kepatuhan Lingkungan & Limbah B3 PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Pemantauan Kolam Pengendapan (Settling Pond pH & TSS) & Pengelolaan Limbah B3</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Environment Dept
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

            {/* KPI Lingkungan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Titik Pemantauan</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalLogs} Titik</div>
                    <p className="mt-2 text-[11px] text-slate-400">Settling Pond & TPS Limbah B3</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Memenuhi Baku Mutu</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{compliantCount} Titik</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Sesuai Standar AMDAL & KLHK</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Standar pH Air Optimal</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">6.0 - 9.0</div>
                    <p className="mt-2 text-[11px] text-slate-400">Netral & Aman Bagi Ekosistem</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Lingkungan</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">100% Lulus</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Zero Environmental Breach</p>
                </div>
            </div>

            {/* Grid Tabel Lingkungan */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari titik pantau, parameter, petugas..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Catat Pemantauan Lingkungan Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Tanggal</th>
                                <th className="pb-2">Titik Pantau / Lokasi</th>
                                <th className="pb-2">Parameter / Jenis</th>
                                <th className="pb-2 text-right">Kadar pH</th>
                                <th className="pb-2 text-right">Kadar TSS (mg/L)</th>
                                <th className="pb-2">Volume Limbah B3</th>
                                <th className="pb-2 text-center">Status Mutu</th>
                                <th className="pb-2">Petugas HSE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((l) => (
                                    <tr key={l.id}>
                                        <td className="py-2.5 font-mono text-slate-400 text-[11px]">{l.monitoring_date}</td>
                                        <td className="font-bold text-white">{l.location_point}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {l.parameter_type}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono font-bold text-emerald-400">{Number(l.ph_level).toFixed(1)}</td>
                                        <td className="text-right font-mono text-slate-300">{Number(l.tss_level).toFixed(1)} mg/L</td>
                                        <td className="font-mono text-amber-400 text-[11px]">{l.b3_waste_volume || '-'}</td>
                                        <td className="text-center">
                                            <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                                                {l.compliance_status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{l.inspector_env}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data pemantauan lingkungan yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Pemantauan */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Pemantauan Lingkungan & Limbah B3</h2>
                        <form onSubmit={handleAddEnvLog} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Titik Pantau / Lokasi</label>
                                <input
                                    type="text"
                                    required
                                    value={locationPoint}
                                    onChange={(e) => setLocationPoint(e.target.value)}
                                    placeholder="Contoh: Settling Pond 01 / TPS B3 Workshop"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Jenis Parameter</label>
                                <select
                                    value={parameterType}
                                    onChange={(e) => setParameterType(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                >
                                    <option value="Kualitas Air (pH & TSS)">Kualitas Air (pH & TSS)</option>
                                    <option value="Penyimpanan Limbah B3">Penyimpanan Limbah B3</option>
                                    <option value="Uji Emisi Genset & Unit">Uji Emisi Genset & Unit</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kadar pH Air (6-9)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={phLevel}
                                        onChange={(e) => setPhLevel(e.target.value)}
                                        placeholder="7.2"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kadar TSS (mg/L)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={tssLevel}
                                        onChange={(e) => setTssLevel(e.target.value)}
                                        placeholder="30.5"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Volume Limbah B3 (Opsional)</label>
                                    <input
                                        type="text"
                                        value={b3WasteVolume}
                                        onChange={(e) => setB3WasteVolume(e.target.value)}
                                        placeholder="Contoh: 1.5 Ton Oli Bekas"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Petugas HSE</label>
                                    <input
                                        type="text"
                                        required
                                        value={inspectorEnv}
                                        onChange={(e) => setInspectorEnv(e.target.value)}
                                        placeholder="Nama petugas"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Pemantauan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}