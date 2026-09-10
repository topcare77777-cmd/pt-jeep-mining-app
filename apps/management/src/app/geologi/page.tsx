'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface GeologySample {
    id: string
    created_at: string
    sample_code: string
    block_pit: string
    sample_type: string
    depth_meter: number
    ni_grade: number
    fe_grade: number
    sm_ratio: number
    lithology: string
    latitude: number
    longitude: number
    geologist_pic: string
    status: string
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

export default function GeologyDashboard() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Senior Geologist')
    const [userRole, setUserRole] = useState('Geology & Exploration')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [samples, setSamples] = useState<GeologySample[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Sampel Geologi Baru
    const [showModal, setShowModal] = useState(false)
    const [sampleCode, setSampleCode] = useState('')
    const [blockPit, setBlockPit] = useState('Pit A - Blok Utara')
    const [sampleType, setSampleType] = useState('Core Drilling')
    const [depthMeter, setDepthMeter] = useState('18.5')
    const [niGrade, setNiGrade] = useState('1.85')
    const [feGrade, setFeGrade] = useState('19.4')
    const [smRatio, setSmRatio] = useState('2.15')
    const [lithology, setLithology] = useState('Saprolite Kadar Tinggi')
    const [latitude, setLatitude] = useState('-3.456200')
    const [longitude, setLongitude] = useState('122.385400')
    const [geologistPic, setGeologistPic] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initGeology() {
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
                    setUserName(profile?.full_name || 'Kepala Eksplorasi Geologi')
                    const division = (profile?.role || 'Geologi').trim()
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
                                    (cleanDiv.includes('geologi') && target.includes('geologi')) ||
                                    (cleanDiv.includes('eksplorasi') && target.includes('eksplorasi'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['geologi']
                            }
                        } else {
                            grantedKeys = ['geologi']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('geologi')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Geologi & Eksplorasi.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    // Ambil data sampel aktual dari Supabase
                    const { data, error } = await supabase
                        .from('geology_samples')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setSamples(data)
                    } else {
                        setSamples([
                            {
                                id: '1',
                                created_at: new Date().toISOString(),
                                sample_code: 'DH-26-001',
                                block_pit: 'Pit A - Blok Utara',
                                sample_type: 'Core Drilling',
                                depth_meter: 18.5,
                                ni_grade: 1.85,
                                fe_grade: 19.4,
                                sm_ratio: 2.15,
                                lithology: 'Saprolite Kadar Tinggi',
                                latitude: -3.4562,
                                longitude: 122.3854,
                                geologist_pic: 'Senior Geologist',
                                status: 'Tervalidasi Lab',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error load geology:', err)
                if (isMounted) setLoading(false)
            }
        }

        initGeology()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddSample = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!sampleCode || !niGrade) return

        setSubmitting(true)

        const payload = {
            sample_code: sampleCode.toUpperCase().trim(),
            block_pit: blockPit,
            sample_type: sampleType,
            depth_meter: parseFloat(depthMeter) || 0,
            ni_grade: parseFloat(niGrade) || 0,
            fe_grade: parseFloat(feGrade) || 0,
            sm_ratio: parseFloat(smRatio) || 0,
            lithology: lithology,
            latitude: parseFloat(latitude) || -3.4562,
            longitude: parseFloat(longitude) || 122.3854,
            geologist_pic: geologistPic || userName,
            status: 'Tervalidasi Lab',
        }

        const { data, error } = await supabase
            .from('geology_samples')
            .insert([payload])
            .select()

        if (!error && data) {
            setSamples([data[0], ...samples])
            setShowModal(false)
            setSampleCode('')
        } else {
            setSamples([
                {
                    id: Date.now().toString(),
                    created_at: new Date().toISOString(),
                    ...payload,
                },
                ...samples,
            ])
            setShowModal(false)
            setSampleCode('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalSamples = samples.length
    const avgNiGrade = totalSamples > 0
        ? (samples.reduce((acc, curr) => acc + Number(curr.ni_grade || 0), 0) / totalSamples).toFixed(2)
        : '0.00'
    const saproliteCount = samples.filter((s) => (s?.lithology || '').toLowerCase().includes('saprolite')).length
    const limoniteCount = samples.filter((s) => (s?.lithology || '').toLowerCase().includes('limonite')).length

    const filteredSamples = samples.filter((item) =>
        (item?.sample_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.block_pit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.lithology || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.geologist_pic || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">
                    Sinkronisasi Data Assay & Pemetaan Geologi PT. Jangkar Energi Eka Perkasa...
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">🧭</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Dashboard Geologi, Eksplorasi & Pemodelan Cadangan Nikel
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>PT. Jangkar Energi Eka Perkasa • Assay Grade Control & Peta Titik Bor</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Titik Bor / Sampel</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalSamples} Titik</div>
                    <p className="mt-2 text-[11px] text-slate-400">Database Core Drilling & Test Pit</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-Rata Kadar Ni (%)</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">{avgNiGrade}% Ni</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Grade Control Pit Nikel</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sebaran Litologi</h3>
                    <div className="text-lg font-black text-amber-400 font-mono">
                        {saproliteCount} Saprolite | {limoniteCount} Limonite
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Pemodelan Cut-Off Grade (COG)</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status IUP Eksplorasi</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">Aktif (CNC)</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Sesuai Peta Konsesi IUP-OP</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Peta Sebaran Titik Pemboran & Pit Nikel (Live Coordinates)
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Visualisasi koordinat Latitude/Longitude konsesi PT. Jangkar Energi Eka Perkasa.
                        </p>
                    </div>
                    <div className="text-xs font-mono text-cyan-400 bg-[#060c14] border border-[#1b2e46] px-3 py-1.5 rounded-lg">
                        Satelit: OpenStreetMap Grid (EPSG:4326)
                    </div>
                </div>

                <div className="w-full h-72 md:h-80 rounded-xl overflow-hidden border border-[#1b2e46] bg-[#060c14] relative">
                    <iframe
                        title="Peta Titik Bor Geologi"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=122.25%2C-3.55%2C122.50%2C-3.35&layer=mapnik&marker=-3.4562%2C122.3854"
                        className="opacity-90 contrast-125"
                    ></iframe>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kode sampel, blok pit, litologi, PIC..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> <span>Catat Sampel & Titik Bor Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2.5">Kode Sampel</th>
                                <th className="pb-2.5">Blok Pit</th>
                                <th className="pb-2.5">Metode</th>
                                <th className="pb-2.5 text-right">Kedalaman (m)</th>
                                <th className="pb-2.5 text-center">Ni (%)</th>
                                <th className="pb-2.5 text-center">Fe (%)</th>
                                <th className="pb-2.5 text-center">Rasio S/M</th>
                                <th className="pb-2.5">Litologi</th>
                                <th className="pb-2.5">Koordinat (Lat, Long)</th>
                                <th className="pb-2.5">Geologist PIC</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredSamples.length > 0 ? (
                                filteredSamples.map((s) => (
                                    <tr key={s.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-3 font-mono font-bold text-amber-400">{s.sample_code}</td>
                                        <td className="font-semibold text-white">{s.block_pit}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {s.sample_type}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono text-slate-300">{Number(s.depth_meter).toFixed(1)} m</td>
                                        <td className="text-center font-mono font-bold text-cyan-400">{Number(s.ni_grade).toFixed(2)}%</td>
                                        <td className="text-center font-mono text-slate-300">{Number(s.fe_grade).toFixed(1)}%</td>
                                        <td className="text-center font-mono text-amber-300">{Number(s.sm_ratio).toFixed(2)}</td>
                                        <td>
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${(s?.lithology || '').toLowerCase().includes('saprolite')
                                                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                                                        : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                                                    }`}
                                            >
                                                {s.lithology}
                                            </span>
                                        </td>
                                        <td className="font-mono text-[11px] text-slate-400">
                                            {Number(s.latitude || 0).toFixed(4)}, {Number(s.longitude || 0).toFixed(4)}
                                        </td>
                                        <td className="text-slate-300">{s.geologist_pic}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                                        Belum ada data sampel geologi yang tercatat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-xl shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Input Data Assay Geologi PT. Jangkar Energi Eka Perkasa
                        </h2>
                        <form onSubmit={handleAddSample} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kode Sampel / Lubang Bor</label>
                                    <input
                                        type="text"
                                        required
                                        value={sampleCode}
                                        onChange={(e) => setSampleCode(e.target.value)}
                                        placeholder="Contoh: DH-26-089"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Blok Pit Konsesi</label>
                                    <input
                                        type="text"
                                        required
                                        value={blockPit}
                                        onChange={(e) => setBlockPit(e.target.value)}
                                        placeholder="Contoh: Pit A - Blok Utara"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Metode Sampling</label>
                                    <select
                                        value={sampleType}
                                        onChange={(e) => setSampleType(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Core Drilling">Core Drilling</option>
                                        <option value="Test Pit">Test Pit</option>
                                        <option value="Outcrop Mapping">Outcrop Mapping</option>
                                        <option value="Channel Sampling">Channel Sampling</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kedalaman (Meter)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={depthMeter}
                                        onChange={(e) => setDepthMeter(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Litologi Zona</label>
                                    <select
                                        value={lithology}
                                        onChange={(e) => setLithology(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Saprolite Kadar Tinggi">Saprolite Kadar Tinggi</option>
                                        <option value="Saprolite Kadar Sedang">Saprolite Kadar Sedang</option>
                                        <option value="Limonite">Limonite</option>
                                        <option value="Bedrock / Serpentinite">Bedrock / Serpentinite</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kadar Ni (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={niGrade}
                                        onChange={(e) => setNiGrade(e.target.value)}
                                        placeholder="1.85"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kadar Fe (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={feGrade}
                                        onChange={(e) => setFeGrade(e.target.value)}
                                        placeholder="19.4"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Rasio S/M (SiO2/MgO)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={smRatio}
                                        onChange={(e) => setSmRatio(e.target.value)}
                                        placeholder="2.15"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        required
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        required
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Geologist PIC</label>
                                    <input
                                        type="text"
                                        required
                                        value={geologistPic}
                                        onChange={(e) => setGeologistPic(e.target.value)}
                                        placeholder="Nama geologist"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Data Assay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}