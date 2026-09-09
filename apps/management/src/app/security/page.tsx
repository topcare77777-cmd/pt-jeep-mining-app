'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface SecurityItem {
    id: string
    created_at?: string
    visitor_name: string
    institution: string
    vehicle_plate: string
    purpose_visit: string
    access_card_no: string
    entry_status: string
    security_officer: string
}

export default function SecurityManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Komandan Security Site')
    const [logs, setLogs] = useState<SecurityItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Tamu Baru
    const [showModal, setShowModal] = useState(false)
    const [visitorName, setVisitorName] = useState('')
    const [institution, setInstitution] = useState('PT Supplier Mandiri')
    const [vehiclePlate, setVehiclePlate] = useState('')
    const [purposeVisit, setPurposeVisit] = useState('Pengiriman Suku Cadang Workshop')
    const [accessCardNo, setAccessCardNo] = useState('CARD-012')
    const [entryStatus, setEntryStatus] = useState('Di Dalam Site')
    const [securityOfficer, setSecurityOfficer] = useState('')
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
                    setUserName(profile?.full_name || 'Chief Security Officer Suroso')

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
                                visitor_name: 'Ir. H. Rahmat',
                                institution: 'Inspektorat Tambang ESDM',
                                vehicle_plate: 'B 1234 TMB',
                                purpose_visit: 'Inspeksi K3 & Lingkungan Lapangan',
                                access_card_no: 'VIP-001',
                                entry_status: 'Di Dalam Site',
                                security_officer: 'Danru Suroso',
                            },
                            {
                                id: '2',
                                created_at: new Date().toISOString(),
                                visitor_name: 'Yusuf Bahtiar',
                                institution: 'PT Surya Diesel Perkasa',
                                vehicle_plate: 'DD 9921 KA',
                                purpose_visit: 'Pengiriman Filter & Oli Workshop',
                                access_card_no: 'CARD-010',
                                entry_status: 'Sudah Keluar',
                                security_officer: 'Anggota Budi',
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

    const handleAddSecurityLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!visitorName || !vehiclePlate) return

        setSubmitting(true)

        const payload = {
            visitor_name: visitorName,
            institution,
            vehicle_plate: vehiclePlate.toUpperCase(),
            purpose_visit: purposeVisit,
            access_card_no: accessCardNo.toUpperCase(),
            entry_status: entryStatus,
            security_officer: securityOfficer || userName,
        }

        const { data, error } = await supabase
            .from('security_gate_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setLogs([data[0], ...logs])
            setShowModal(false)
            setVisitorName('')
            setVehiclePlate('')
        } else {
            alert('Gagal mencatat buku tamu security: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalLogs = logs.length
    const insideCount = logs.filter((l) => l.entry_status === 'Di Dalam Site').length

    const filteredLogs = logs.filter((item) =>
        item.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicle_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose_visit.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/security', label: 'Security Gate', icon: '🛡️' },
        { href: '/clinic', label: 'Klinik Medis', icon: '🏥' },
        { href: '/radio', label: 'Radio Dispatch', icon: '📻' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/fleet-maintenance', label: 'Maintenance', icon: '🔧' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/manager-site', label: 'Pit Penambangan', icon: '⛏️' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/jetty', label: 'Jetty & LCT', icon: '🚢' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/hrd', label: 'HRD & Payroll', icon: '👷‍♂️' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal & IUP', icon: '⚖️' },
        { href: '/investor', label: 'Investor', icon: '📈' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Keamanan Gerbang & Pos Security...</p>
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
                                Keamanan Gerbang & Security PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Akses Main Gate, Buku Tamu Vendor, & Pengamanan Aset Site</span>
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

            {/* KPI Security */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Kunjungan Tercatat</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalLogs} Tamu</div>
                    <p className="mt-2 text-[11px] text-slate-400">Buku Tamu Main Gate</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tamu Masih di Dalam Site</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{insideCount} Orang</div>
                    <p className="mt-2 text-[11px] text-amber-400 font-semibold">Memakai Kartu Akses Visitor</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Perimeter Security</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">Aman & Kondusif</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Patroli Regu 24 Jam Aktif</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Insiden Keamanan</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">0 Pelanggaran</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Zero Security Breach</p>
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
                            placeholder="Cari nama tamu, instansi, plat nomor..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Catat Buku Tamu / Kendaraan Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Waktu Masuk</th>
                                <th className="pb-2">Nama Tamu / Driver</th>
                                <th className="pb-2">Asal Instansi / Vendor</th>
                                <th className="pb-2">Nomor Polisi Kendaraan</th>
                                <th className="pb-2">Keperluan Kunjungan</th>
                                <th className="pb-2 text-center">No. Kartu Akses</th>
                                <th className="pb-2 text-center">Status Posisi</th>
                                <th className="pb-2">Security Jaga</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((l) => {
                                    const isInside = l.entry_status === 'Di Dalam Site'
                                    return (
                                        <tr key={l.id}>
                                            <td className="py-2.5 font-mono text-slate-400 text-[11px]">
                                                {l.created_at ? new Date(l.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                                            </td>
                                            <td className="font-bold text-white">{l.visitor_name}</td>
                                            <td className="text-slate-300">{l.institution}</td>
                                            <td className="font-mono text-amber-400 font-bold">{l.vehicle_plate}</td>
                                            <td className="text-slate-300 max-w-xs truncate">{l.purpose_visit}</td>
                                            <td className="text-center font-mono text-slate-300">{l.access_card_no}</td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isInside
                                                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        }`}
                                                >
                                                    {l.entry_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-slate-400">{l.security_officer}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada catatan security yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Tamu Security */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Buku Tamu & Kendaraan (Security Gate)</h2>
                        <form onSubmit={handleAddSecurityLog} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Tamu / Driver</label>
                                    <input
                                        type="text"
                                        required
                                        value={visitorName}
                                        onChange={(e) => setVisitorName(e.target.value)}
                                        placeholder="Contoh: Budi Santoso"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Asal Instansi / Vendor</label>
                                    <input
                                        type="text"
                                        required
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                        placeholder="PT Supplier Mandiri"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor Polisi Kendaraan</label>
                                    <input
                                        type="text"
                                        required
                                        value={vehiclePlate}
                                        onChange={(e) => setVehiclePlate(e.target.value)}
                                        placeholder="DD 8821 XA"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Kartu Akses Visitor</label>
                                    <input
                                        type="text"
                                        required
                                        value={accessCardNo}
                                        onChange={(e) => setAccessCardNo(e.target.value)}
                                        placeholder="CARD-015"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Keperluan Kunjungan</label>
                                <input
                                    type="text"
                                    required
                                    value={purposeVisit}
                                    onChange={(e) => setPurposeVisit(e.target.value)}
                                    placeholder="Contoh: Pengiriman suku cadang ke workshop"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Posisi</label>
                                    <select
                                        value={entryStatus}
                                        onChange={(e) => setEntryStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                                    >
                                        <option value="Di Dalam Site">Di Dalam Site</option>
                                        <option value="Sudah Keluar">Sudah Keluar</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Security Jaga</label>
                                    <input
                                        type="text"
                                        required
                                        value={securityOfficer}
                                        onChange={(e) => setSecurityOfficer(e.target.value)}
                                        placeholder="Nama petugas security"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Buku Tamu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}