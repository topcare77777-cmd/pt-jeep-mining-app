'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
    simp_number?: string
    entry_status: string
    security_officer: string
}

// 30 Modul Lengkap Tambang Nikel PT. Jangkar Energi Eka Perkasa
const ALL_MODULES = [
    { key: 'manager-site', label: 'Pit Produksi', icon: '⛏️', href: '/manager-site' },
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
    { key: 'hrd', label: 'HRD & K3', icon: '👷‍♂️', href: '/hrd' },
    { key: 'ga', label: 'GA & Fasilitas', icon: '🚙', href: '/ga' },
    { key: 'mess', label: 'Mess Camp', icon: '🏠', href: '/mess' },
    { key: 'catering', label: 'Katering', icon: '🍱', href: '/catering' },
    { key: 'clinic', label: 'Klinik Site', icon: '🏥', href: '/clinic' },
    { key: 'security', label: 'Security Gate', icon: '🛡️', href: '/security' },
    { key: 'radio', label: 'Radio Dispatch', icon: '📻', href: '/radio' },
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

export default function SecurityManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Komandan Security Site')
    const [userRole, setUserRole] = useState('Security')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [logs, setLogs] = useState<SecurityItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Tamu Baru
    const [showModal, setShowModal] = useState(false)
    const [visitorName, setVisitorName] = useState('')
    const [institution, setInstitution] = useState('')
    const [vehiclePlate, setVehiclePlate] = useState('')
    const [purposeVisit, setPurposeVisit] = useState('Pengiriman Suku Cadang & Logistik Site')
    const [accessCardNo, setAccessCardNo] = useState('CARD-001')
    const [simpNumber, setSimpNumber] = useState('')
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
                    .select('full_name, role, status')
                    .eq('id', session.user.id)
                    .maybeSingle()

                const statusClean = (profile?.status || '').toLowerCase().trim()
                if (statusClean === 'nonaktif' || statusClean === 'non-aktif' || statusClean === 'banned') {
                    alert('Akun Anda dinonaktifkan.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                if (isMounted) {
                    setUserName(profile?.full_name || 'Petugas Security Site')
                    const division = (profile?.role || 'Security').trim()
                    setUserRole(division)

                    // Filter navigasi modul sesuai matriks izin divisi
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
                                    (cleanDiv === 'security' && target.includes('security'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['security']
                            }
                        } else {
                            grantedKeys = ['security']
                        }
                    }

                    // Route Guard: Bila tidak memiliki hak akses modul security
                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('security')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Keamanan Gerbang.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    // Ambil log pos security
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
                                visitor_name: 'Ir. H. Rahmat Santoso',
                                institution: 'Inspektorat Tambang Kementerian ESDM',
                                vehicle_plate: 'B 1234 TMB',
                                purpose_visit: 'Audit Kepatuhan Teknis & RKAB Tambang Nikel',
                                access_card_no: 'VIP-001',
                                simp_number: 'SIMP/ESDM/2026/089',
                                entry_status: 'Di Dalam Site',
                                security_officer: 'Danru Suroso',
                            },
                            {
                                id: '2',
                                created_at: new Date().toISOString(),
                                visitor_name: 'Yusuf Bahtiar',
                                institution: 'PT Cahaya Diesel Perkasa',
                                vehicle_plate: 'DD 9921 KA',
                                purpose_visit: 'Pengiriman Komponen Undercarriage Excavator Nikel',
                                access_card_no: 'CARD-010',
                                simp_number: 'SIMP/LOG/2026/412',
                                entry_status: 'Sudah Keluar',
                                security_officer: 'Anggota Budi',
                            },
                        ])
                    }
                    setLoading(false)
                }
            } catch (err) {
                console.error('Error in Security init:', err)
                if (isMounted) setLoading(false)
            }
        }

        initSecurity()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddSecurityLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!visitorName || !vehiclePlate) return

        setSubmitting(true)

        const payload = {
            visitor_name: visitorName,
            institution: institution || 'Vendor Tambang Nikel',
            vehicle_plate: vehiclePlate.toUpperCase(),
            purpose_visit: purposeVisit,
            access_card_no: accessCardNo.toUpperCase(),
            simp_number: simpNumber || `SIMP-JEEP-${Date.now().toString().slice(-4)}`,
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
            setInstitution('')
            setSimpNumber('')
        } else {
            // Fallback state lokal
            setLogs([
                {
                    id: Date.now().toString(),
                    created_at: new Date().toISOString(),
                    ...payload,
                },
                ...logs,
            ])
            setShowModal(false)
            setVisitorName('')
            setVehiclePlate('')
            setInstitution('')
            setSimpNumber('')
        }

        setSubmitting(false)
    }

    const handleToggleExitStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Di Dalam Site' ? 'Sudah Keluar' : 'Di Dalam Site'
        const { error } = await supabase
            .from('security_gate_logs')
            .update({ entry_status: newStatus })
            .eq('id', id)

        if (!error) {
            setLogs(logs.map((item) => (item.id === id ? { ...item, entry_status: newStatus } : item)))
        } else {
            setLogs(logs.map((item) => (item.id === id ? { ...item, entry_status: newStatus } : item)))
        }
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
        item.purpose_visit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.simp_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Hanya tombol navigasi berizin yang dirender
    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">
                    Sinkronisasi Keamanan Main Gate Tambang Nikel PT. Jangkar Energi Eka Perkasa...
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
                        <span className="text-3xl">🛡️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Keamanan Gerbang & Pos Security PT. Jangkar Energi Eka Perkasa
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Kontrol Akses Main Gate Tambang Nikel, Validasi SIMP, & Pengamanan Aset Site</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                                    {userRole}
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

                {/* Bilah Navigasi Dinamis Terfilter Hak Akses */}
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
            </header>

            {/* KPI Pos Keamanan Tambang Nikel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Kunjungan Gerbang</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalLogs} Log</div>
                    <p className="mt-2 text-[11px] text-slate-400">Buku Tamu Main Gate Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tamu Masih di Dalam Site</h3>
                    <div className="text-2xl font-black text-amber-400 font-mono">{insideCount} Orang / Unit</div>
                    <p className="mt-2 text-[11px] text-amber-400 font-semibold">Memegang Kartu Akses Tamu Aktif</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Perimeter Keamanan Site</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">Aman & Terkendali</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Patroli Pit & Jetty 24 Jam</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pemeriksaan SIMP & K3</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">100% Terverifikasi</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Cek APD Standar Sebelum Masuk</p>
                </div>
            </div>

            {/* Grid Tabel Buku Tamu & Kendaraan */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama tamu, instansi, plat nomor, no. SIMP..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> <span>Catat Tamu & Kendaraan Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2.5">Waktu Masuk</th>
                                <th className="pb-2.5">Nama Tamu / Driver</th>
                                <th className="pb-2.5">Instansi / Rekanan</th>
                                <th className="pb-2.5">Nomor Polisi</th>
                                <th className="pb-2.5">Keperluan Masuk Site</th>
                                <th className="pb-2.5 text-center">No. SIMP / Kartu</th>
                                <th className="pb-2.5 text-center">Status Posisi</th>
                                <th className="pb-2.5">Petugas Jaga</th>
                                <th className="pb-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((l) => {
                                    const isInside = l.entry_status === 'Di Dalam Site'
                                    return (
                                        <tr key={l.id} className="hover:bg-[#0c1a2d]/50 transition">
                                            <td className="py-3 font-mono text-slate-400 text-[11px]">
                                                {l.created_at
                                                    ? new Date(l.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                                    : 'Baru saja'}
                                            </td>
                                            <td className="font-bold text-white">{l.visitor_name}</td>
                                            <td className="text-slate-300">{l.institution}</td>
                                            <td className="font-mono text-amber-400 font-bold">{l.vehicle_plate}</td>
                                            <td className="text-slate-300 max-w-xs truncate">{l.purpose_visit}</td>
                                            <td className="text-center font-mono text-cyan-300 text-[11px]">
                                                <div>{l.access_card_no}</div>
                                                {l.simp_number && (
                                                    <div className="text-[10px] text-slate-500">{l.simp_number}</div>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2.5 py-1 rounded text-[10px] font-bold inline-block ${isInside
                                                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        }`}
                                                >
                                                    {l.entry_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-slate-400">{l.security_officer}</td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => handleToggleExitStatus(l.id, l.entry_status)}
                                                    className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition cursor-pointer ${isInside
                                                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/60'
                                                            : 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/60'
                                                        }`}
                                                >
                                                    {isInside ? 'Tandai Keluar' : 'Masuk Kembali'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada catatan pos security yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form Tambah Tamu Security Gate */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Pencatatan Buku Tamu Main Gate PT. Jangkar Energi Eka Perkasa
                        </h2>
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
                                    <label className="text-[11px] text-slate-400 block mb-1">Instansi / Vendor Tambang</label>
                                    <input
                                        type="text"
                                        required
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                        placeholder="Contoh: PT Surya Logistik Nikel"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Plat Nomor</label>
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
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Kartu Akses</label>
                                    <input
                                        type="text"
                                        required
                                        value={accessCardNo}
                                        onChange={(e) => setAccessCardNo(e.target.value)}
                                        placeholder="CARD-015"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor SIMP (Izin)</label>
                                    <input
                                        type="text"
                                        value={simpNumber}
                                        onChange={(e) => setSimpNumber(e.target.value)}
                                        placeholder="SIMP/2026/..."
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Keperluan Kunjungan Site</label>
                                <input
                                    type="text"
                                    required
                                    value={purposeVisit}
                                    onChange={(e) => setPurposeVisit(e.target.value)}
                                    placeholder="Contoh: Pengiriman oli/filter workshop atau inspeksi sampling ore"
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
                                    <label className="text-[11px] text-slate-400 block mb-1">Petugas Jaga Gerbang</label>
                                    <input
                                        type="text"
                                        required
                                        value={securityOfficer}
                                        onChange={(e) => setSecurityOfficer(e.target.value)}
                                        placeholder="Nama anggota security"
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