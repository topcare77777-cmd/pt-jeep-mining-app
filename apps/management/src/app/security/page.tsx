'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface GateLog {
    id: string
    created_at?: string
    visitor_name: string
    company_origin: string
    vehicle_no: string
    purpose: string
    access_card_no?: string
    guard_name: string
    status: string
}

export default function SecurityManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Komandan Regu Security')
    const [logs, setLogs] = useState<GateLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Log Gerbang Baru
    const [showModal, setShowModal] = useState(false)
    const [visitorName, setVisitorName] = useState('')
    const [companyOrigin, setCompanyOrigin] = useState('')
    const [vehicleNo, setVehicleNo] = useState('')
    const [purpose, setPurpose] = useState('Pengiriman Logistik Sparepart')
    const [accessCardNo, setAccessCardNo] = useState('')
    const [guardName, setGuardName] = useState('')
    const [status, setStatus] = useState('Masuk')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initSecurity() {
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
                    setUserName(profile?.full_name || 'Chief Security Officer')

                    const { data, error } = await supabase
                        .from('security_gate_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setLogs(data)
                    } else {
                        setLogs([
                            {
                                id: '1',
                                created_at: new Date().toISOString(),
                                visitor_name: 'Agus Pratama',
                                company_origin: 'PT Surya Ekspedisi',
                                vehicle_no: 'KT-8821-AJ',
                                purpose: 'Pengiriman Filter & Oli Workshop',
                                access_card_no: 'V-001',
                                guard_name: 'Komandan Pos Suroso',
                                status: 'Masuk',
                            },
                            {
                                id: '2',
                                created_at: new Date().toISOString(),
                                visitor_name: 'Ir. Bambang S.',
                                company_origin: 'Konsultan Lingkungan',
                                vehicle_no: 'B-1242-UIF',
                                purpose: 'Inspeksi Settling Pond Tambang',
                                access_card_no: 'V-002',
                                guard_name: 'Komandan Pos Suroso',
                                status: 'Keluar',
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

        initSecurity()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!visitorName || !vehicleNo) return

        setSubmitting(true)

        const payload = {
            visitor_name: visitorName,
            company_origin: companyOrigin,
            vehicle_no: vehicleNo.toUpperCase(),
            purpose,
            access_card_no: accessCardNo || '-',
            guard_name: guardName || userName,
            status,
        }

        const { data, error } = await supabase
            .from('security_gate_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setLogs([data[0], ...logs])
            setShowModal(false)
            setVisitorName('')
            setCompanyOrigin('')
            setVehicleNo('')
            setAccessCardNo('')
        } else {
            alert('Gagal mencatat log gerbang: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalLogs = logs.length
    const insideCount = logs.filter((l) => l.status === 'Masuk').length

    const filteredLogs = logs.filter((item) =>
        item.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company_origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/mess', label: 'Mess & Camp', icon: '🏠' },
        { href: '/vendor', label: 'Vendor', icon: '🤝' },
        { href: '/radio', label: 'Radio', icon: '📻' },
        { href: '/clinic', label: 'Klinik', icon: '🏥' },
        { href: '/security', label: 'Security Gate', icon: '🛡️' },
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
                <p className="text-xs text-slate-400">Sinkronisasi Pos Keamanan & Kontrol Gerbang...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🛡️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Keamanan & Pos Pengamanan (Security Gate) PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Akses Gerbang Utama, Buku Tamu, & Patroli Keamanan Site</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Security Dept
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

            {/* KPI Security */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Kunjungan / Tamu</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalLogs} Kendaraan</div>
                    <p className="mt-2 text-[11px] text-slate-400">Tercatat di Pos Utama Security</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tamu / Kendaraan di Dalam</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{insideCount} Unit</div>
                    <p className="mt-2 text-[11px] text-amber-400 font-semibold">Masih Berada di Area Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status Perimeter Site</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">Aman Terkendali</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Patroli Regu 24 Jam Aktif</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Insiden Keamanan</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">0 Insiden</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Zero Security Breach</p>
                </div>
            </div>

            {/* Grid Tabel Security */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama, plat, perusahaan, keperluan..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Catat Kendaraan / Tamu Masuk
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Waktu Catat</th>
                                <th className="pb-2">Nama Pengemudi / Tamu</th>
                                <th className="pb-2">Asal Perusahaan</th>
                                <th className="pb-2">Nomor Plat</th>
                                <th className="pb-2">Keperluan / Keterangan</th>
                                <th className="pb-2 text-center">No. Kartu Tamu</th>
                                <th className="pb-2 text-center">Status Gerbang</th>
                                <th className="pb-2">Petugas Jaga</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((l) => (
                                    <tr key={l.id}>
                                        <td className="py-2.5 font-mono text-slate-400 text-[11px]">
                                            {l.created_at ? new Date(l.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                                        </td>
                                        <td className="font-bold text-white">{l.visitor_name}</td>
                                        <td className="text-slate-300">{l.company_origin}</td>
                                        <td className="font-mono text-amber-400 font-bold">{l.vehicle_no}</td>
                                        <td className="text-slate-300">{l.purpose}</td>
                                        <td className="text-center font-mono text-slate-300">{l.access_card_no || '-'}</td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.status === 'Masuk'
                                                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                    }`}
                                            >
                                                {l.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{l.guard_name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada catatan gerbang yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Tamu / Kendaraan */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Akses Masuk Gerbang Utama</h2>
                        <form onSubmit={handleAddLog} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Pengemudi / Tamu</label>
                                <input
                                    type="text"
                                    required
                                    value={visitorName}
                                    onChange={(e) => setVisitorName(e.target.value)}
                                    placeholder="Contoh: Agus Pratama"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Asal Perusahaan / Instansi</label>
                                <input
                                    type="text"
                                    required
                                    value={companyOrigin}
                                    onChange={(e) => setCompanyOrigin(e.target.value)}
                                    placeholder="Contoh: PT Surya Ekspedisi Logistik"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor Plat Kendaraan</label>
                                    <input
                                        type="text"
                                        required
                                        value={vehicleNo}
                                        onChange={(e) => setVehicleNo(e.target.value)}
                                        placeholder="Contoh: KT-8821-AJ"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Kartu Tamu (Visitor)</label>
                                    <input
                                        type="text"
                                        value={accessCardNo}
                                        onChange={(e) => setAccessCardNo(e.target.value)}
                                        placeholder="Contoh: V-012"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Keperluan Kunjungan / Pengiriman</label>
                                <input
                                    type="text"
                                    required
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Contoh: Pengiriman suku cadang & filter workshop"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Gerbang</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Masuk">Masuk Area Site</option>
                                        <option value="Keluar">Keluar Area Site</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Komandan / Petugas Jaga</label>
                                    <input
                                        type="text"
                                        required
                                        value={guardName}
                                        onChange={(e) => setGuardName(e.target.value)}
                                        placeholder="Nama security"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Data Gerbang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}