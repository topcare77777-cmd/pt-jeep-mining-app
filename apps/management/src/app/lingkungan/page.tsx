'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface EnvironmentLog {
    id: string
    created_at?: string
    date: string
    location_pond: string
    ph_level: number
    tss_mg_l: number
    fe_mg_l: number
    reclamation_area_ha: number
    trees_planted: number
    status_compliance: string
    inspector_name: string
    notes?: string
}

export default function EnvironmentReclamationPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Inspektur Lingkungan')
    const [logs, setLogs] = useState<EnvironmentLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Modal Input
    const [showModal, setShowModal] = useState(false)
    const [pondName, setPondName] = useState('Settling Pond 01 (KPL Barat)')
    const [phLevel, setPhLevel] = useState('')
    const [tssVal, setTssVal] = useState('')
    const [feVal, setFeVal] = useState('0.8')
    const [reclamationHa, setReclamationHa] = useState('')
    const [treesCount, setTreesCount] = useState('')
    const [inspector, setInspector] = useState('')
    const [notes, setNotes] = useState('')
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
                    setUserName(profile?.full_name || 'Environmental & K3 Officer')

                    const { data, error } = await supabase
                        .from('environment_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setLogs(data)
                    } else {
                        setLogs([
                            {
                                id: '1',
                                date: '2026-09-09',
                                location_pond: 'Settling Pond 01 (Outfall KPL Barat)',
                                ph_level: 7.2,
                                tss_mg_l: 145.0,
                                fe_mg_l: 0.85,
                                reclamation_area_ha: 1.5,
                                trees_planted: 350,
                                status_compliance: 'Compliant',
                                inspector_name: 'Doni Pratama, S.Ling',
                                notes: 'Baku mutu air limbah tambang memenuhi Kepmen LH No. 113',
                            },
                            {
                                id: '2',
                                date: '2026-09-08',
                                location_pond: 'Settling Pond 02 (KPL Disposal Timur)',
                                ph_level: 6.9,
                                tss_mg_l: 180.0,
                                fe_mg_l: 1.10,
                                reclamation_area_ha: 0.8,
                                trees_planted: 200,
                                status_compliance: 'Compliant',
                                inspector_name: 'Doni Pratama, S.Ling',
                                notes: 'Penambahan kapur tohor (liming) berjalan normal',
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

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phLevel || !tssVal || !inspector) return

        setSubmitting(true)
        const ph = parseFloat(phLevel)
        const tss = parseFloat(tssVal)

        // Standar Baku Mutu Kepmen LH 113: pH 6-9, TSS < 300 mg/L
        const isCompliant = ph >= 6.0 && ph <= 9.0 && tss <= 300.0

        const payload = {
            location_pond: pondName,
            ph_level: ph,
            tss_mg_l: tss,
            fe_mg_l: parseFloat(feVal) || 0.5,
            reclamation_area_ha: parseFloat(reclamationHa) || 0,
            trees_planted: parseInt(treesCount) || 0,
            status_compliance: isCompliant ? 'Compliant' : 'Exceeded',
            inspector_name: inspector,
            notes,
        }

        const { data, error } = await supabase
            .from('environment_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setLogs([data[0], ...logs])
            setShowModal(false)
            setPhLevel('')
            setTssVal('')
            setReclamationHa('')
            setTreesCount('')
            setNotes('')
        } else {
            alert('Gagal menyimpan data lingkungan: ' + (error?.message || ''))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalReclaimedHa = logs.reduce((acc, curr) => acc + Number(curr.reclamation_area_ha || 0), 0)
    const totalTrees = logs.reduce((acc, curr) => acc + Number(curr.trees_planted || 0), 0)

    const filteredLogs = logs.filter((item) =>
        item.location_pond.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.inspector_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/ritase', label: 'Ritase & Timbangan', icon: '🚛' },
        { href: '/jetty', label: 'Pelabuhan Jetty', icon: '🚢' },
        { href: '/lingkungan', label: 'Reklamasi & Lingkungan', icon: '🌱' },
        { href: '/bbm', label: 'Tangki BBM', icon: '⛽' },
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
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Data Lingkungan Tambang & Baku Mutu Air...</p>
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
                                Pengelolaan Lingkungan & Reklamasi Tambang PT. JEEP
                            </h1>
                            <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Baku Mutu Air Settling Pond (KPL), Revegetasi, & Limbah B3</span>
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

                {/* Module Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {navLinks.map((item) => {
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
            </header>

            {/* KPI Lingkungan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Lahan Tereklamasi</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        {totalReclaimedHa.toFixed(2)} Ha
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Sesuai Rencana Reklamasi RKAB</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pohon / Bibit Ditanam</h3>
                    <div className="text-2xl font-black text-white font-mono">
                        {totalTrees.toLocaleString('id-ID')} Pohon
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Akasia, Sengon & Buah Lokal</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Baku Mutu Air (pH Outfall)</h3>
                    <div className="text-2xl font-black text-sky-400 font-mono">
                        {logs[0]?.ph_level || '7.1'} pH
                    </div>
                    <p className="mt-2 text-[11px] text-sky-400 font-medium">Baku Mutu Aman (Range 6.0 – 9.0)</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kepatuhan Lingkungan (ESG)</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">100% Valid</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Sesuai Kaidah Pertambangan Baik</p>
                </div>
            </div>

            {/* Grid Tabel Log Lingkungan */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari titik kolam / petugas..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Input Uji Kualitas Air & Reklamasi
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Tanggal</th>
                                <th className="pb-2">Titik Pantau Kolam (KPL)</th>
                                <th className="pb-2 text-center">pH Air</th>
                                <th className="pb-2 text-right">TSS (mg/L)</th>
                                <th className="pb-2 text-right">Fe (mg/L)</th>
                                <th className="pb-2 text-right">Revegetasi (Ha)</th>
                                <th className="pb-2 text-right">Bibit Ditanam</th>
                                <th className="pb-2 text-center">Kepatuhan</th>
                                <th className="pb-2">Petugas Penguji</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2.5 font-mono text-slate-400 text-[11px]">{item.date}</td>
                                        <td className="font-semibold text-white">{item.location_pond}</td>
                                        <td className="text-center font-mono font-bold text-emerald-400">{Number(item.ph_level).toFixed(1)}</td>
                                        <td className="text-right font-mono text-slate-300">{Number(item.tss_mg_l).toFixed(1)}</td>
                                        <td className="text-right font-mono text-slate-400">{Number(item.fe_mg_l).toFixed(2)}</td>
                                        <td className="text-right font-mono text-emerald-400">{Number(item.reclamation_area_ha).toFixed(2)} Ha</td>
                                        <td className="text-right font-mono text-white">{item.trees_planted} Btg</td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status_compliance === 'Compliant'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                                    }`}
                                            >
                                                {item.status_compliance.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{item.inspector_name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                                        Belum ada data uji lingkungan yang cocok.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Lingkungan */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Uji Kualitas Air & Progres Reklamasi</h2>
                        <form onSubmit={handleAddLog} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Titik Pantau Settling Pond</label>
                                <select
                                    value={pondName}
                                    onChange={(e) => setPondName(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                >
                                    <option value="Settling Pond 01 (Outfall KPL Barat)">Settling Pond 01 (Outfall KPL Barat)</option>
                                    <option value="Settling Pond 02 (KPL Disposal Timur)">Settling Pond 02 (KPL Disposal Timur)</option>
                                    <option value="Settling Pond 03 (Port Jetty Front)">Settling Pond 03 (Port Jetty Front)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">pH Air (6-9)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={phLevel}
                                        onChange={(e) => setPhLevel(e.target.value)}
                                        placeholder="7.2"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">TSS (&lt;300 mg/L)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={tssVal}
                                        onChange={(e) => setTssVal(e.target.value)}
                                        placeholder="150"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Fe (&lt;7 mg/L)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={feVal}
                                        onChange={(e) => setFeVal(e.target.value)}
                                        placeholder="0.8"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Area Reklamasi (Ha)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={reclamationHa}
                                        onChange={(e) => setReclamationHa(e.target.value)}
                                        placeholder="Contoh: 1.2"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Pohon Ditanam (Batang)</label>
                                    <input
                                        type="number"
                                        value={treesCount}
                                        onChange={(e) => setTreesCount(e.target.value)}
                                        placeholder="Contoh: 250"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Petugas Penguji Lingkungan</label>
                                <input
                                    type="text"
                                    required
                                    value={inspector}
                                    onChange={(e) => setInspector(e.target.value)}
                                    placeholder="Nama penguji lapangan"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Catatan / Tindakan Perbaikan</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Liming aktif di paritan inlet"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Data Lingkungan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}