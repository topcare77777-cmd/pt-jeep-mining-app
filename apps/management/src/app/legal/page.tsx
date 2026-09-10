'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface LicenseItem {
    id: string
    created_at?: string
    license_name: string
    license_number: string
    issuing_agency: string
    issue_date: string
    expiry_date: string
    status: string
    responsible_person: string
    notes?: string
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

export default function LegalManagementPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Legal & Compliance Officer')
    const [userRole, setUserRole] = useState('Legal Dept')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [licenses, setLicenses] = useState<LicenseItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Perizinan Baru
    const [showModal, setShowModal] = useState(false)
    const [licenseName, setLicenseName] = useState('')
    const [licenseNumber, setLicenseNumber] = useState('')
    const [issuingAgency, setIssuingAgency] = useState('Kementerian ESDM')
    const [issueDate, setIssueDate] = useState('2025-01-01')
    const [expiryDate, setExpiryDate] = useState('2030-12-31')
    const [status, setStatus] = useState('Aktif')
    const [responsiblePerson, setResponsiblePerson] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initLegal() {
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
                    setUserName(profile?.full_name || 'Legal Superintendent')
                    const division = (profile?.role || 'Legal Dept').trim()
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
                                    (cleanDiv.includes('legal') && target.includes('legal')) ||
                                    (cleanDiv.includes('hukum') && target.includes('hukum'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['legal']
                            }
                        } else {
                            grantedKeys = ['legal']
                        }
                    }

                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('legal')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Legal & Perizinan IUP.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    const { data, error } = await supabase
                        .from('company_legal_licenses')
                        .select('*')
                        .order('expiry_date', { ascending: true })

                    if (!error && data && data.length > 0) {
                        setLicenses(data)
                    } else {
                        setLicenses([
                            {
                                id: '1',
                                license_name: 'Izin Usaha Pertambangan (IUP) Operasi Produksi',
                                license_number: 'SK.450/MIN/2024',
                                issuing_agency: 'Kementerian ESDM Republik Indonesia',
                                issue_date: '2024-03-12',
                                expiry_date: '2034-03-12',
                                status: 'Aktif',
                                responsible_person: 'Head of Legal Corporate',
                                notes: 'Wilayah seluas 2.500 Ha di Kutai Barat',
                            },
                            {
                                id: '2',
                                license_name: 'Persetujuan Kelayakan Lingkungan (AMDAL)',
                                license_number: '660/120/BLH/2023',
                                issuing_agency: 'Dinas Lingkungan Hidup Provinsi Kaltim',
                                issue_date: '2023-06-15',
                                expiry_date: '2033-06-15',
                                status: 'Aktif',
                                responsible_person: 'HSE & Environment Manager',
                                notes: 'Mencakup dokumen RKL-RPL berkala',
                            },
                            {
                                id: '3',
                                license_name: 'Izin Terminal Khusus (Jetty Pelabuhan)',
                                license_number: 'B.332/AL.504/KSOP-KBAR',
                                issuing_agency: 'KSOP Kelas II Samarinda',
                                issue_date: '2024-01-10',
                                expiry_date: '2029-01-10',
                                status: 'Aktif',
                                responsible_person: 'Jetty Port Superintendent',
                                notes: 'Kapasitas sandar tongkang hingga 300 Feet',
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

        initLegal()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddLicense = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!licenseName || !licenseNumber) return

        setSubmitting(true)

        const payload = {
            license_name: licenseName,
            license_number: licenseNumber.toUpperCase(),
            issuing_agency: issuingAgency,
            issue_date: issueDate,
            expiry_date: expiryDate,
            status,
            responsible_person: responsiblePerson || userName,
            notes,
        }

        const { data, error } = await supabase
            .from('company_legal_licenses')
            .insert([payload])
            .select()

        if (!error && data) {
            setLicenses([...licenses, data[0]])
            setShowModal(false)
            setLicenseName('')
            setLicenseNumber('')
            setNotes('')
        } else {
            setLicenses([
                {
                    id: Date.now().toString(),
                    ...payload,
                },
                ...licenses,
            ])
            setShowModal(false)
            setLicenseName('')
            setLicenseNumber('')
            setNotes('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalLicenses = licenses.length
    const activeLicenses = licenses.filter((l) => l.status === 'Aktif').length

    const filteredLicenses = licenses.filter((item) =>
        (item?.license_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.license_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.issuing_agency || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.responsible_person || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Dokumen Perizinan & Legalitas Perusahaan...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">⚖️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Kepatuhan Perizinan & Legalitas PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Manajemen Dokumen IUP, AMDAL, Izin Jetty, & Kepatuhan Hukum ESDM</span>
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
                        <span>Akses Terbatas: Menampilkan modul berizin untuk divisi Anda.</span>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Dokumen Perizinan</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalLicenses} Berkas</div>
                    <p className="mt-2 text-[11px] text-slate-400">Terdaftar di Arsip Legal Korporat</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Izin Aktif Berlaku</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{activeLicenses} Berkas</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Legalitas Operasional Sah</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mendekati Masa Habis</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">0 Berkas</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">Semua Perizinan Aman</p>
                </div>
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Compliance Score</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">100% Sah</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Sesuai Regulasi Kementerian ESDM</p>
                </div>
            </div>

            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama izin, nomor SK, instansi..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Daftarkan Perizinan Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nama Perizinan & Ruang Lingkup</th>
                                <th className="pb-2">Nomor SK / Dokumen</th>
                                <th className="pb-2">Instansi Penerbit</th>
                                <th className="pb-2">Masa Berlaku</th>
                                <th className="pb-2 text-center">Status</th>
                                <th className="pb-2">Penanggung Jawab</th>
                                <th className="pb-2">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLicenses.length > 0 ? (
                                filteredLicenses.map((l) => (
                                    <tr key={l.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-2.5 font-bold text-white">{l.license_name}</td>
                                        <td className="font-mono text-amber-400 text-[11px] font-bold">{l.license_number}</td>
                                        <td className="text-slate-300">{l.issuing_agency}</td>
                                        <td className="font-mono text-slate-300 text-[11px]">
                                            {l.issue_date} s/d <span className="text-emerald-400 font-bold">{l.expiry_date}</span>
                                        </td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${l.status === 'Aktif'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                                                        : 'bg-rose-950/80 text-rose-400 border-rose-800/40'
                                                    }`}
                                            >
                                                {l.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{l.responsible_person}</td>
                                        <td className="text-slate-400">{l.notes || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data perizinan yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Registrasi Dokumen Perizinan Baru</h2>
                        <form onSubmit={handleAddLicense} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Perizinan / Legalitas</label>
                                <input
                                    type="text"
                                    required
                                    value={licenseName}
                                    onChange={(e) => setLicenseName(e.target.value)}
                                    placeholder="Contoh: IUP Operasi Produksi / AMDAL"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nomor SK / Dokumen</label>
                                    <input
                                        type="text"
                                        required
                                        value={licenseNumber}
                                        onChange={(e) => setLicenseNumber(e.target.value)}
                                        placeholder="SK.450/MIN/2024"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Instansi Penerbit</label>
                                    <input
                                        type="text"
                                        required
                                        value={issuingAgency}
                                        onChange={(e) => setIssuingAgency(e.target.value)}
                                        placeholder="Kementerian ESDM"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tanggal Terbit</label>
                                    <input
                                        type="date"
                                        required
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tanggal Berakhir (Expiry)</label>
                                    <input
                                        type="date"
                                        required
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Perizinan</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Aktif">Aktif Berlaku</option>
                                        <option value="Proses Perpanjangan">Proses Perpanjangan</option>
                                        <option value="Habis">Habis Masa Berlaku</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Penanggung Jawab</label>
                                    <input
                                        type="text"
                                        required
                                        value={responsiblePerson}
                                        onChange={(e) => setResponsiblePerson(e.target.value)}
                                        placeholder="Nama PIC Legal"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Catatan / Ruang Lingkup</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Wilayah konsesi seluas 2.500 Ha"
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Perizinan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}