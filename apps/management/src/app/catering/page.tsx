'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface CateringItem {
    id: string
    created_at?: string
    meal_date: string
    catering_vendor: string
    meal_session: string
    portion_count: number
    hygiene_score: number
    status_quality: string
    inspector_ga: string
}

export default function CateringManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Pengawas Konsumsi GA')
    const [logs, setLogs] = useState<CateringItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Menu Katering Baru
    const [showModal, setShowModal] = useState(false)
    const [vendorName, setVendorName] = useState('PT Boga Selaras Mandiri')
    const [mealSession, setMealSession] = useState('Lunch (Makan Siang)')
    const [portionCount, setPortonCount] = useState('180')
    const [hygieneScore, setHygieneScore] = useState('92.0')
    const [statusQuality, setStatusQuality] = useState('Baik')
    const [inspectorGa, setInspectorGa] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initCatering() {
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
                    setUserName(profile?.full_name || 'General Affair Catering Supervisor')

                    const { data, error } = await supabase
                        .from('ga_catering_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setLogs(data)
                    } else {
                        setLogs([
                            {
                                id: '1',
                                meal_date: '2026-09-09',
                                catering_vendor: 'PT Boga Selaras Mandiri',
                                meal_session: 'Lunch (Makan Siang)',
                                portion_count: 185,
                                hygiene_score: 93.5,
                                status_quality: 'Baik',
                                inspector_ga: 'Slamet Riyadi',
                            },
                            {
                                id: '2',
                                meal_date: '2026-09-09',
                                catering_vendor: 'PT Boga Selaras Mandiri',
                                meal_session: 'Breakfast (Makan Pagi)',
                                portion_count: 170,
                                hygiene_score: 91.0,
                                status_quality: 'Baik',
                                inspector_ga: 'Slamet Riyadi',
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

        initCatering()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddCatering = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!vendorName || !portionCount) return

        setSubmitting(true)

        const payload = {
            catering_vendor: vendorName,
            meal_session: mealSession,
            portion_count: parseInt(portionCount) || 150,
            hygiene_score: parseFloat(hygieneScore) || 90.0,
            status_quality: statusQuality,
            inspector_ga: inspectorGa || userName,
        }

        const { data, error } = await supabase
            .from('ga_catering_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setLogs([data[0], ...logs])
            setShowModal(false)
            setPortonCount('180')
        } else {
            alert('Gagal menyimpan log katering: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalPortions = logs.reduce((acc, curr) => acc + Number(curr.portion_count || 0), 0)
    const avgScore = logs.length > 0
        ? (logs.reduce((acc, curr) => acc + Number(curr.hygiene_score || 0), 0) / logs.length).toFixed(1)
        : '0.0'

    const filteredLogs = logs.filter((item) =>
        item.catering_vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.meal_session.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.inspector_ga.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/mess', label: 'Mess & Camp', icon: '🏠' },
        { href: '/catering', label: 'Katering & Mess Hall', icon: '🍲' },
        { href: '/transport', label: 'Transportasi Kru', icon: '🚐' },
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
                <p className="text-xs text-slate-400">Sinkronisasi Logistik Katering & Konsumsi Mess...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🍲</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Manajemen Katering & Mess Hall PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Porsi Makanan, Higienitas Dapur, & Evaluasi Vendor Konsumsi</span>
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

            {/* KPI Katering */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Porsi Disajikan</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalPortions} Porsi</div>
                    <p className="mt-2 text-[11px] text-slate-400">Akumulasi Distribusi Makan Kru</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-Rata Skor Higienitas</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{avgScore} / 100</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Standar Kualitas Dapur Sehat</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor Katering Aktif</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">1 Vendor</div>
                    <p className="mt-2 text-[11px] text-slate-400">PT Boga Selaras Mandiri</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kepuasan Konsumsi Kru</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">Sangat Baik</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Menu Bergizi & Tepat Waktu</p>
                </div>
            </div>

            {/* Grid Tabel Katering */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari vendor, sesi makan, pengawas..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Catat Distribusi Makanan Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Tanggal</th>
                                <th className="pb-2">Vendor Katering</th>
                                <th className="pb-2">Sesi Makan</th>
                                <th className="pb-2 text-right">Jumlah Porsi</th>
                                <th className="pb-2 text-right">Skor Higienitas</th>
                                <th className="pb-2 text-center">Status Kualitas</th>
                                <th className="pb-2">Pengawas GA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((l) => (
                                    <tr key={l.id}>
                                        <td className="py-2.5 font-mono text-slate-400 text-[11px]">{l.meal_date}</td>
                                        <td className="font-bold text-white">{l.catering_vendor}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {l.meal_session}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono text-slate-300">{l.portion_count} Porsi</td>
                                        <td className="text-right font-mono font-bold text-emerald-400">{Number(l.hygiene_score).toFixed(1)}</td>
                                        <td className="text-center">
                                            <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                                                {l.status_quality.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{l.inspector_ga}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data katering yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Katering */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Distribusi Katering & Mess Hall</h2>
                        <form onSubmit={handleAddCatering} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Vendor Katering</label>
                                <input
                                    type="text"
                                    required
                                    value={vendorName}
                                    onChange={(e) => setVendorName(e.target.value)}
                                    placeholder="Contoh: PT Boga Selaras Mandiri"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Sesi Makan</label>
                                <select
                                    value={mealSession}
                                    onChange={(e) => setMealSession(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                >
                                    <option value="Breakfast (Makan Pagi)">Breakfast (Makan Pagi)</option>
                                    <option value="Lunch (Makan Siang)">Lunch (Makan Siang)</option>
                                    <option value="Dinner (Makan Malam)">Dinner (Makan Malam)</option>
                                    <option value="Night Supper (Makan Malam Shift 2)">Night Supper (Makan Malam Shift 2)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jumlah Porsi</label>
                                    <input
                                        type="number"
                                        required
                                        value={portionCount}
                                        onChange={(e) => setPortonCount(e.target.value)}
                                        placeholder="180"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Skor Higienitas (0-100)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={hygieneScore}
                                        onChange={(e) => setHygieneScore(e.target.value)}
                                        placeholder="92.0"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Kualitas</label>
                                    <select
                                        value={statusQuality}
                                        onChange={(e) => setStatusQuality(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Baik">Baik & Higienis</option>
                                        <option value="Catatan Khusus">Catatan Khusus (Perbaikan Menu)</option>
                                        <option value="Evaluasi">Evaluasi Vendor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Pengawas GA</label>
                                    <input
                                        type="text"
                                        required
                                        value={inspectorGa}
                                        onChange={(e) => setInspectorGa(e.target.value)}
                                        placeholder="Nama pengawas"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Log Katering'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}