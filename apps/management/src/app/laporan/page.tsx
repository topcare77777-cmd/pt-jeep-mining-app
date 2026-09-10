'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface DorReport {
    id: string
    created_at?: string
    report_date: string
    pit_location: string
    overburden_bcm: number
    coal_production_ton: number // Produksi ore nikel
    heavy_equipment_units: number
    weather_condition: string
    supervisor_name: string
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

export default function LaporanPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Superintendent Produksi')
    const [userRole, setUserRole] = useState('Reporting Dept')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [reports, setReports] = useState<DorReport[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Laporan DOR Baru
    const [showModal, setShowModal] = useState(false)
    const [pitLocation, setPitLocation] = useState('Pit Nikel Utama (Blok A)')
    const [overburdenBcm, setOverburdenBcm] = useState('3500')
    const [oreProductionTon, setOreProductionTon] = useState('1200')
    const [heavyEquipmentUnits, setHeavyEquipmentUnits] = useState('14')
    const [weatherCondition, setWeatherCondition] = useState('Cerah Berawan')
    const [supervisorName, setSupervisorName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initLaporan() {
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
                    setUserName(profile?.full_name || 'Production Superintendent')
                    const division = (profile?.role || 'Laporan DOR').trim()
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
                                    (cleanDiv.includes('laporan') && target.includes('laporan')) ||
                                    (cleanDiv.includes('dor') && target.includes('dor'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['laporan']
                            }
                        } else {
                            grantedKeys = ['laporan']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('laporan')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Laporan DOR.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    const { data, error } = await supabase
                        .from('dor_reports')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setReports(data)
                    } else {
                        setReports([
                            {
                                id: '1',
                                report_date: '2026-09-09',
                                pit_location: 'Pit Nikel Utama (Blok A)',
                                overburden_bcm: 3800,
                                coal_production_ton: 1250,
                                heavy_equipment_units: 14,
                                weather_condition: 'Cerah',
                                supervisor_name: 'Slamet Riyadi',
                            },
                            {
                                id: '2',
                                report_date: '2026-09-08',
                                pit_location: 'Pit Ekspansi (Blok B)',
                                overburden_bcm: 4200,
                                coal_production_ton: 1400,
                                heavy_equipment_units: 16,
                                weather_condition: 'Hujan Ringan',
                                supervisor_name: 'Dedi Saputra',
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

        initLaporan()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddReport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pitLocation) return

        setSubmitting(true)

        const payload = {
            pit_location: pitLocation,
            overburden_bcm: parseFloat(overburdenBcm) || 0,
            coal_production_ton: parseFloat(oreProductionTon) || 0,
            heavy_equipment_units: parseInt(heavyEquipmentUnits) || 10,
            weather_condition: weatherCondition,
            supervisor_name: supervisorName || userName,
        }

        const { data, error } = await supabase
            .from('dor_reports')
            .insert([payload])
            .select()

        if (!error && data) {
            setReports([data[0], ...reports])
            setShowModal(false)
            setOverburdenBcm('3500')
            setOreProductionTon('1200')
        } else {
            setReports([
                {
                    id: Date.now().toString(),
                    report_date: new Date().toISOString().split('T')[0],
                    ...payload,
                },
                ...reports,
            ])
            setShowModal(false)
            setOverburdenBcm('3500')
            setOreProductionTon('1200')
        }

        setSubmitting(false)
    }

    const handleExportExcel = () => {
        try {
            let csvContent = 'data:text/csv;charset=utf-8,'
                + 'Tanggal,Lokasi Pit,Overburden (BCM),Produksi Ore Nikel (Ton),Alat Aktif,Cuaca,Supervisor\n'

            filteredReports.forEach((r) => {
                const row = [
                    `"${r.report_date || ''}"`,
                    `"${r.pit_location || ''}"`,
                    r.overburden_bcm || 0,
                    r.coal_production_ton || 0,
                    r.heavy_equipment_units || 0,
                    `"${r.weather_condition || ''}"`,
                    `"${r.supervisor_name || ''}"`
                ].join(',')
                csvContent += row + '\n'
            })

            const encodedUri = encodeURI(csvContent)
            const link = document.createElement('a')
            link.setAttribute('href', encodedUri)
            link.setAttribute('download', `Laporan_DOR_PT_JEEP_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (err) {
            console.error('Gagal export excel:', err)
            alert('Terjadi kesalahan saat mengunduh berkas Excel.')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalOre = reports.reduce((acc, curr) => acc + Number(curr.coal_production_ton || 0), 0)
    const totalOB = reports.reduce((acc, curr) => acc + Number(curr.overburden_bcm || 0), 0)

    const filteredReports = reports.filter((item) =>
        (item?.pit_location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.supervisor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.weather_condition || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Laporan Harian Operasi Nikel (DOR)...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3 print:hidden">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">📄</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Cetak & Rekap Laporan Harian Operasi (DOR) Nikel PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Dokumentasi Produksi Ore Nikel, Overburden, & Kinerja Alat Berat Harian</span>
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
                        <span>Akses Terbatas Divisi: Menampilkan modul berizin untuk divisi Anda.</span>
                    </div>
                )}
            </header>

            {/* Header Cetak Khusus PDF */}
            <div className="hidden print:block mb-6 text-black border-b-2 border-black pb-4">
                <h2 className="text-xl font-bold uppercase">PT. JANGKAR ENEGI EKA PERKASA</h2>
                <p className="text-xs">Laporan Harian Operasi Penambangan Nikel (DOR)</p>
                <p className="text-[10px] text-slate-600">Dicetak oleh: {userName} pada {new Date().toLocaleDateString('id-ID')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:grid-cols-3">
                <div className="bg-[#0a1625] print:bg-white print:border-black border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 print:text-black uppercase tracking-wider mb-2">Total Akumulasi Ore Nikel</h3>
                    <div className="text-2xl font-black text-emerald-400 print:text-black font-mono">
                        {totalOre.toLocaleString('id-ID')} Ton
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400 print:text-black">Bijih Nikel Siap Kirim</p>
                </div>
                <div className="bg-[#0a1625] print:bg-white print:border-black border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 print:text-black uppercase tracking-wider mb-2">Total Stripping Overburden</h3>
                    <div className="text-2xl font-black text-white print:text-black font-mono">
                        {totalOB.toLocaleString('id-ID')} BCM
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400 print:text-black">Lapisan Tanah Penutup</p>
                </div>
                <div className="bg-[#0a1625] print:bg-white print:border-black border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 print:text-black uppercase tracking-wider mb-2">Total Laporan Tercatat</h3>
                    <div className="text-2xl font-black text-amber-400 print:text-black font-mono">{reports.length} Laporan</div>
                    <p className="mt-2 text-[11px] text-slate-400 print:text-black">Arsip DOR Site Tervalidasi</p>
                </div>
            </div>

            <div className="bg-[#0a1625] print:bg-white print:border-black border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari pit, supervisor, cuaca..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                        >
                            <span>📥</span> <span>Ekspor ke Excel</span>
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="bg-[#1b2e46] hover:bg-[#253f5e] text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                        >
                            <span>🖨️</span> <span>Cetak / Ekspor PDF</span>
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                        >
                            + Buat DOR Nikel Baru
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs print:text-black">
                        <thead>
                            <tr className="border-b border-[#1b2e46] print:border-black text-slate-400 print:text-black">
                                <th className="pb-2">Tanggal</th>
                                <th className="pb-2">Lokasi Pit Penambangan</th>
                                <th className="pb-2 text-right">Overburden (OB)</th>
                                <th className="pb-2 text-right">Produksi Ore Nikel</th>
                                <th className="pb-2 text-center">Alat Beroperasi</th>
                                <th className="pb-2">Kondisi Cuaca</th>
                                <th className="pb-2">Supervisor (Pengawas)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] print:divide-black text-slate-300 print:text-black">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((r) => (
                                    <tr key={r.id} className="hover:bg-[#0c1a2d]/50 print:hover:bg-transparent transition">
                                        <td className="py-2.5 font-mono print:font-sans text-slate-400 print:text-black text-[11px]">{r.report_date}</td>
                                        <td className="font-bold text-white print:text-black">{r.pit_location}</td>
                                        <td className="text-right font-mono print:font-sans text-slate-300 print:text-black">
                                            {Number(r.overburden_bcm).toLocaleString('id-ID')} BCM
                                        </td>
                                        <td className="text-right font-mono print:font-sans font-bold text-emerald-400 print:text-black">
                                            {Number(r.coal_production_ton).toLocaleString('id-ID')} Ton Ore
                                        </td>
                                        <td className="text-center font-mono print:font-sans text-slate-300 print:text-black">{r.heavy_equipment_units} Unit</td>
                                        <td>
                                            <span className="bg-[#112233] print:bg-transparent border border-[#1e3a5f] print:border-black text-slate-300 print:text-black text-[10px] px-2 py-0.5 rounded">
                                                {r.weather_condition}
                                            </span>
                                        </td>
                                        <td className="text-slate-400 print:text-black">{r.supervisor_name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada laporan DOR yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Tanda Tangan Khusus Cetak PDF */}
                <div className="hidden print:flex justify-between pt-16 text-black text-xs">
                    <div className="text-center">
                        <p>Dibuat Oleh,</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{userName}</p>
                        <p>Production Supervisor</p>
                    </div>
                    <div className="text-center">
                        <p>Disetujui Oleh,</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">Ir. Kepala Teknik Tambang</p>
                        <p>KTT PT. Jangkar Energi Eka Perkasa</p>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Buat Laporan Harian Operasi (DOR) Nikel</h2>
                        <form onSubmit={handleAddReport} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Lokasi Pit Penambangan</label>
                                <input
                                    type="text"
                                    required
                                    value={pitLocation}
                                    onChange={(e) => setPitLocation(e.target.value)}
                                    placeholder="Contoh: Pit Nikel Utama (Blok A)"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Overburden (BCM)</label>
                                    <input
                                        type="number"
                                        required
                                        value={overburdenBcm}
                                        onChange={(e) => setOverburdenBcm(e.target.value)}
                                        placeholder="3500"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Produksi Ore Nikel (Ton)</label>
                                    <input
                                        type="number"
                                        required
                                        value={oreProductionTon}
                                        onChange={(e) => setOreProductionTon(e.target.value)}
                                        placeholder="1200"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jumlah Alat Berat Aktif</label>
                                    <input
                                        type="number"
                                        required
                                        value={heavyEquipmentUnits}
                                        onChange={(e) => setHeavyEquipmentUnits(e.target.value)}
                                        placeholder="14"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kondisi Cuaca</label>
                                    <select
                                        value={weatherCondition}
                                        onChange={(e) => setWeatherCondition(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Cerah">Cerah</option>
                                        <option value="Cerah Berawan">Cerah Berawan</option>
                                        <option value="Hujan Ringan">Hujan Ringan</option>
                                        <option value="Hujan Lebat (Stop Pit)">Hujan Lebat (Stop Pit)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Supervisor (Pengawas Lapangan)</label>
                                <input
                                    type="text"
                                    required
                                    value={supervisorName}
                                    onChange={(e) => setSupervisorName(e.target.value)}
                                    placeholder="Nama pengawas pit"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Laporan DOR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}