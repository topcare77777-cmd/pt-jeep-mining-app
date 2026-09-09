'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface HazardReport {
    id: string
    created_at?: string
    hazard_code: string
    location: string
    hazard_type: string
    risk_level: 'Low' | 'Medium' | 'High' | 'Critical' | string
    description: string
    corrective_action: string
    pic_responsible: string
    status: 'Open' | 'In Progress' | 'Closed' | string
    reporter_name: string
    due_date?: string
}

export default function SafetyManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas K3')
    const [reports, setReports] = useState<HazardReport[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Temuan Bahaya Baru
    const [showModal, setShowModal] = useState(false)
    const [location, setLocation] = useState('Front Pit Barat')
    const [hazardType, setHazardType] = useState('Kondisi Tidak Aman (Unsafe Condition)')
    const [riskLevel, setRiskLevel] = useState('High')
    const [description, setDescription] = useState('')
    const [correctiveAction, setCorrectiveAction] = useState('')
    const [picResponsible, setPicResponsible] = useState('')
    const [reporterName, setReporterName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initSafety() {
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
                    setUserName(profile?.full_name || 'HSE Coordinator Site')

                    const { data, error } = await supabase
                        .from('safety_hazard_reports')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setReports(data)
                    } else {
                        setReports([
                            {
                                id: '1',
                                created_at: new Date().toISOString(),
                                hazard_code: 'HZD-2026-041',
                                location: 'Jalur Hauling KM 14 (Tikungan S)',
                                hazard_type: 'Kondisi Tidak Aman (Unsafe Condition)',
                                risk_level: 'High',
                                description: 'Tanggul pengaman jalan (safety berm) tergerus air hujan di bawah ketinggian 3/4 diameter roda DT.',
                                corrective_action: 'Perbaikan tanggul menggunakan Dozer D85 dan perataan grader hari ini.',
                                pic_responsible: 'Supervisor Road Maintenance',
                                status: 'In Progress',
                                reporter_name: 'Dedi Saputra (Safety Officer)',
                            },
                            {
                                id: '2',
                                created_at: new Date().toISOString(),
                                hazard_code: 'HZD-2026-039',
                                location: 'Workshop Mekanik Tambang',
                                hazard_type: 'Tindakan Tidak Aman (Unsafe Action)',
                                risk_level: 'Medium',
                                description: 'Mekanik melakukan pengelasan bucket tanpa kacamata pelindung (welding shield) dan APD lengkap.',
                                corrective_action: 'Stop kerja sementara, sosialisasi Golden Rules K3, dan pembagian helm kedok las.',
                                pic_responsible: 'Kepala Bengkel Workshop',
                                status: 'Closed',
                                reporter_name: 'Rian Hidayat (HSE Staff)',
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

        initSafety()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddReport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description || !correctiveAction) return

        setSubmitting(true)
        const code = `HZD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`

        const payload = {
            hazard_code: code,
            location,
            hazard_type: hazardType,
            risk_level: riskLevel,
            description,
            corrective_action: correctiveAction,
            pic_responsible: picResponsible || 'Pengawas Lapangan',
            status: 'Open',
            reporter_name: reporterName || userName,
        }

        const { data, error } = await supabase
            .from('safety_hazard_reports')
            .insert([payload])
            .select()

        if (!error && data) {
            setReports([data[0], ...reports])
            setShowModal(false)
            setDescription('')
            setCorrectiveAction('')
            setPicResponsible('')
            setReporterName('')
        } else {
            alert('Gagal menyimpan laporan hazard: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalReports = reports.length
    const openReports = reports.filter((r) => r.status === 'Open' || r.status === 'In Progress').length
    const closedReports = reports.filter((r) => r.status === 'Closed').length
    const closureRate = totalReports > 0 ? ((closedReports / totalReports) * 100).toFixed(0) : '100'

    const filteredReports = reports.filter((item) =>
        item.hazard_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pic_responsible.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3 (HSE)', icon: '⛑️' },
        { href: '/sparepart', label: 'Gudang Sparepart', icon: '📦' },
        { href: '/ritase', label: 'Ritase & Timbangan', icon: '🚛' },
        { href: '/jetty', label: 'Pelabuhan Jetty', icon: '🚢' },
        { href: '/lingkungan', label: 'Reklamasi Lingkungan', icon: '🌱' },
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
                <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Database K3 & Safety Hazard Patrol...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">⛑️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Pusat Inspeksi K3 & Pengendalian Hazard Tambang PT. JEEP
                            </h1>
                            <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Hazard Identification, Risk Assessment (HIRA), & Zero Accident Monitoring</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    HSE Department
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
                                        ? 'bg-[#162d47] text-white border-rose-400/80 shadow-sm'
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

            {/* KPI K3 & Keselamatan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jam Kerja Selamat (LTI Free)</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">148.520 Jam</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">✓ Zero Fatal Accident Tercapai</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Temuan Hazard Aktif</h3>
                    <div className={`text-2xl font-black font-mono ${openReports > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {openReports} Laporan
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Dalam Tindakan Mitigasi Lapangan</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hazard Terselesaikan (Closed)</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        {closedReports} / {totalReports}
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">Mitigasi & Rekomendasi Selesai</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hazard Closure Rate</h3>
                    <div className="text-2xl font-black text-white font-mono">{closureRate}%</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Standar Kepatuhan K3 &gt; 80%</p>
                </div>
            </div>

            {/* Grid Tabel Temuan Bahaya */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kode hazard, lokasi, PIC..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Laporkan Temuan Bahaya (Hazard)
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Kode Hazard</th>
                                <th className="pb-2">Lokasi Bahaya</th>
                                <th className="pb-2">Tingkat Risiko</th>
                                <th className="pb-2">Uraian Bahaya</th>
                                <th className="pb-2">Tindakan Perbaikan (Mitigasi)</th>
                                <th className="pb-2">PIC Penanggung Jawab</th>
                                <th className="pb-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((item) => {
                                    const isCritical = item.risk_level === 'High' || item.risk_level === 'Critical'
                                    return (
                                        <tr key={item.id}>
                                            <td className="py-2.5 font-bold font-mono text-rose-400">{item.hazard_code}</td>
                                            <td className="font-semibold text-white">{item.location}</td>
                                            <td>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCritical
                                                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                        }`}
                                                >
                                                    {item.risk_level.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-slate-300 max-w-xs truncate">{item.description}</td>
                                            <td className="text-slate-400 max-w-xs truncate">{item.corrective_action}</td>
                                            <td className="text-slate-300">{item.pic_responsible}</td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Closed'
                                                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                            : item.status === 'In Progress'
                                                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                                : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                                        }`}
                                                >
                                                    {item.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada laporan bahaya yang cocok. Area kerja aman terkendali.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Temuan Hazard */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Laporan Temuan Bahaya (Hazard Report)</h2>
                        <form onSubmit={handleAddReport} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Lokasi Temuan Lapangan</label>
                                <input
                                    type="text"
                                    required
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Contoh: Hauling Road KM 18 / Front Pit Timur"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Klasifikasi Bahaya</label>
                                    <select
                                        value={hazardType}
                                        onChange={(e) => setHazardType(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-400"
                                    >
                                        <option value="Kondisi Tidak Aman (Unsafe Condition)">Kondisi Tidak Aman</option>
                                        <option value="Tindakan Tidak Aman (Unsafe Action)">Tindakan Tidak Aman</option>
                                        <option value="Pencemaran Lingkungan">Pencemaran Lingkungan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tingkat Risiko</label>
                                    <select
                                        value={riskLevel}
                                        onChange={(e) => setRiskLevel(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-400"
                                    >
                                        <option value="Low">Rendah (Low)</option>
                                        <option value="Medium">Sedang (Medium)</option>
                                        <option value="High">Tinggi (High)</option>
                                        <option value="Critical">Kritis (Critical)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Uraian Bahaya (Deskripsi)</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Jelaskan kondisi bahaya yang dapat memicu kecelakaan..."
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Tindakan Perbaikan (Corrective Action)</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={correctiveAction}
                                    onChange={(e) => setCorrectiveAction(e.target.value)}
                                    placeholder="Langkah perbaikan langsung untuk mengeliminasi bahaya..."
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">PIC Tindakan Perbaikan</label>
                                    <input
                                        type="text"
                                        required
                                        value={picResponsible}
                                        onChange={(e) => setPicResponsible(e.target.value)}
                                        placeholder="Contoh: Pengawas Pit"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Pelapor (Inspector)</label>
                                    <input
                                        type="text"
                                        value={reporterName}
                                        onChange={(e) => setReporterName(e.target.value)}
                                        placeholder="Nama pelapor"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-400"
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
                                    className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Laporan Bahaya'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}