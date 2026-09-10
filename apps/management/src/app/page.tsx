'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 32 Modul Operasional Tambang Nikel PT. Jangkar Energi Eka Perkasa
const OPERATIONAL_MODULES = [
    {
        key: 'manager-site',
        title: 'Pusat Komando Pit Nikel',
        badge: 'Operasional Pit',
        desc: 'Monitoring ritase bijih nikel, pengupasan overburden (OB), dan laporan shift DOR.',
        icon: '⛏️',
        href: '/manager-site',
    },
    {
        key: 'geologi',
        title: 'Geologi & Eksplorasi',
        badge: 'Grade Control',
        desc: 'Database titik pemboran, uji assay (%Ni, %Fe), dan pemodelan cadangan nikel.',
        icon: '🧭',
        href: '/geologi',
    },
    {
        key: 'fleet',
        title: 'Kesiapan Alat Berat',
        badge: 'Plant & Alat Berat',
        desc: 'Kontrol unit excavator, dump truck nikel, rasio PA/MA, dan jam kerja (HM).',
        icon: '🚜',
        href: '/fleet',
    },
    {
        key: 'fleet-maintenance',
        title: 'Workshop & Maintenance',
        badge: 'Maintenance',
        desc: 'Jadwal servis berkala, perbaikan breakdown alat berat, dan backlog mekanik.',
        icon: '🔧',
        href: '/fleet-maintenance',
    },
    {
        key: 'sparepart',
        title: 'Gudang & Sparepart',
        badge: 'Logistik Workshop',
        desc: 'Inventaris suku cadang, reorder point, dan stok komponen kritis tambang nikel.',
        icon: '📦',
        href: '/sparepart',
    },
    {
        key: 'safety',
        title: 'Inspeksi K3 & HSE',
        badge: 'K3 Tambang Nikel',
        desc: 'Pencatatan hazard tambang nikel, investigasi insiden, dan jam kerja selamat.',
        icon: '⛑️',
        href: '/safety',
    },
    {
        key: 'ritase',
        title: 'Ritase & Timbangan Ore',
        badge: 'Weighbridge Site',
        desc: 'Verifikasi tonase bruto, tare, dan netto bijih nikel armada hauling.',
        icon: '🚛',
        href: '/ritase',
    },
    {
        key: 'jetty',
        title: 'Jetty & Tongkang LCT',
        badge: 'Pelabuhan Jetty',
        desc: 'Pemuatan ore nikel ke tongkang LCT, draught survey, dan izin berlayar.',
        icon: '🚢',
        href: '/jetty',
    },
    {
        key: 'environment',
        title: 'Lingkungan & Reklamasi',
        badge: 'Lingkungan Hidup',
        desc: 'Pemantauan settling pond nikel, baku mutu TSS & pH, dan revegetasi pascatambang.',
        icon: '🌱',
        href: '/environment',
    },
    {
        key: 'lingkungan',
        title: 'Kanal Pengendali Sedimen',
        badge: 'Sedimen & Air',
        desc: 'Pengendalian limpasan air tambang dan sediment trap tambang nikel.',
        icon: '🏞️',
        href: '/lingkungan',
    },
    {
        key: 'bbm',
        title: 'Tangki & BBM Solar',
        badge: 'Fuel Management',
        desc: 'Stok solar industri B35, pencatatan nozzle dispenser unit pit, dan burn rate.',
        icon: '⛽',
        href: '/bbm',
    },
    {
        key: 'finance',
        title: 'Kas & Finansial Site',
        badge: 'Finance Site',
        desc: 'Ledger kas kecil site, dropping dana operasional nikel, dan rekonsiliasi.',
        icon: '💰',
        href: '/finance',
    },
    {
        key: 'adm',
        title: 'Administrasi & Surat',
        badge: 'Site ADM',
        desc: 'Pengarsipan surat jalan pengangkutan ore nikel, izin masuk SIMP, dan persuratan.',
        icon: '📋',
        href: '/adm',
    },
    {
        key: 'hrd',
        title: 'HRD & Ketenagakerjaan',
        badge: 'Human Resources',
        desc: 'Database pekerja tambang nikel, rotasi roster kerja, absensi, dan kebugaran.',
        icon: '👷‍♂️',
        href: '/hrd',
    },
    {
        key: 'ga',
        title: 'General Affair (GA)',
        badge: 'Fasilitas & Sarana',
        desc: 'Manajemen armada LV operasional, sarana genset site, dan fasilitas camp.',
        icon: '🚙',
        href: '/ga',
    },
    {
        key: 'assets',
        title: 'Manajemen Aset Tambang',
        badge: 'Asset Management',
        desc: 'Inventarisasi fisik fasilitas, penomoran kode barcode aset, dan audit depresiasi.',
        icon: '🏷️',
        href: '/assets',
    },
    {
        key: 'mess',
        title: 'Hunian & Mess Karyawan',
        badge: 'Camp Accommodation',
        desc: 'Alokasi kamar mess kru tambang, pemeliharaan sarana, dan kebersihan.',
        icon: '🏠',
        href: '/mess',
    },
    {
        key: 'catering',
        title: 'Katering & Logistik Pangan',
        badge: 'Food Service',
        desc: 'Kontrol menu makanan bergizi pekerja tambang dan jadwal suplai mess hall.',
        icon: '🍱',
        href: '/catering',
    },
    {
        key: 'clinic',
        title: 'Klinik Medis Site',
        badge: 'Pelayanan Medis',
        desc: 'Pemeriksaan kesehatan pekerja, surat fit-to-work, dan penanganan darurat.',
        icon: '🏥',
        href: '/clinic',
    },
    {
        key: 'security',
        title: 'Security & Akses Gerbang',
        badge: 'Keamanan Site',
        desc: 'Pemeriksaan gerbang masuk tambang, buku tamu logistik, dan verifikasi SIMP.',
        icon: '🛡️',
        href: '/security',
    },
    {
        key: 'radio',
        title: 'Radio Komunikasi & Dispatch',
        badge: 'Dispatch Tambang',
        desc: 'Log komunikasi radio HT/SSB, dispatch unit pit, dan koordinasi darurat.',
        icon: '📻',
        href: '/radio',
    },
    {
        key: 'legal',
        title: 'Legalitas & Perizinan IUP',
        badge: 'Hukum & Kepatuhan',
        desc: 'Kepatuhan IUP-OP nikel, dokumen RKAB ESDM, IPPKH, dan AMDAL operasional.',
        icon: '⚖️',
        href: '/legal',
    },
    {
        key: 'csr',
        title: 'CSR & Hubungan Masyarakat',
        badge: 'Community Relations',
        desc: 'Program PPM/CSR desa lingkar tambang nikel dan hubungan warga lokal.',
        icon: '🤝',
        href: '/csr',
    },
    {
        key: 'vendor',
        title: 'Vendor & Kontraktor',
        badge: 'Mitra Usaha',
        desc: 'Daftar rekanan kontraktor penambangan nikel, subkontraktor, dan evaluasi.',
        icon: '🏬',
        href: '/vendor',
    },
    {
        key: 'transport',
        title: 'Transportasi & Logistik Kru',
        badge: 'Mobilisasi Kru',
        desc: 'Jadwal bus penjemputan kru tambang, mobilisasi bandara, dan izin keluar.',
        icon: '🚌',
        href: '/transport',
    },
    {
        key: 'training',
        title: 'Pelatihan & Sertifikasi',
        badge: 'Training Center',
        desc: 'Pelatihan POP/POM, sertifikasi operator alat berat nikel, dan induksi K3.',
        icon: '🎓',
        href: '/training',
    },
    {
        key: 'performance',
        title: 'Evaluasi Kinerja & KPI',
        badge: 'Performance KPI',
        desc: 'Pencapaian KPI produksi nikel, evaluasi disiplin kru, dan efisiensi operasional.',
        icon: '📈',
        href: '/performance',
    },
    {
        key: 'it-helpdesk',
        title: 'IT Helpdesk & Jaringan VSAT',
        badge: 'Teknologi Informasi',
        desc: 'Kendala internet VSAT site tambang nikel, pemeliharaan komputer, dan jaringan.',
        icon: '💻',
        href: '/it-helpdesk',
    },
    {
        key: 'helpdesk',
        title: 'Helpdesk Sarana GA',
        badge: 'Bantuan Fasilitas',
        desc: 'Permintaan perbaikan sarana mess, pendingin udara, dan suplai air bersih.',
        icon: '🛠️',
        href: '/helpdesk',
    },
    {
        key: 'investor',
        title: 'Portal Investor Tambang',
        badge: 'Investor Relations',
        desc: 'Transparansi pengapalan ore nikel, pendapatan, dan kepatuhan kuota RKAB ESDM.',
        icon: '📊',
        href: '/investor',
    },
    {
        key: 'direktur',
        title: 'Eksekutif Direksi (BOD)',
        badge: 'Executive BOD',
        desc: 'Executive summary tambang nikel, tren produksi ore, dan ringkasan anggaran.',
        icon: '🏛️',
        href: '/direktur',
    },
    {
        key: 'laporan',
        title: 'Cetak Laporan Resmi',
        badge: 'Laporan DOR Nikel',
        desc: 'Format cetak resmi Daily Operation Report produksi nikel siap unduh PDF.',
        icon: '📄',
        href: '/laporan',
    },
]

export default function PortalDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [isSuperAdminUser, setIsSuperAdminUser] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function loadUserAndPermissions() {
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

                let { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    const userRes = await supabase.auth.getUser()
                    if (!userRes.data.user) {
                        window.location.href = landingUrl
                        return
                    }
                }

                const currentUserId = session?.user?.id || (await supabase.auth.getUser()).data.user?.id
                const userEmail = (session?.user?.email || (await supabase.auth.getUser()).data.user?.email || '').toLowerCase().trim()

                if (!currentUserId) {
                    window.location.href = landingUrl
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, status')
                    .eq('id', currentUserId)
                    .maybeSingle()

                const statusClean = (profile?.status || '').toLowerCase().trim()
                if (statusClean === 'nonaktif' || statusClean === 'non-aktif' || statusClean === 'banned') {
                    alert('Akun Anda dinonaktifkan.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                if (isMounted) {
                    const division = (profile?.role || '').trim().toLowerCase()

                    // ATURAN EKSKLUSIF: topcare77777@gmail.com adalah Superadmin penuh
                    const isExplicitSuperAdmin = userEmail === 'topcare77777@gmail.com'
                    const isRoleSuperAdmin = ['admin', 'administrator', 'superadmin'].includes(division)
                    const isDirector = ['direktur', 'bod', 'board of directors'].some((k) => division.includes(k))

                    if (isExplicitSuperAdmin || isRoleSuperAdmin) {
                        setIsSuperAdminUser(true)
                        setUserProfile({
                            full_name: profile?.full_name || 'Super Administrator',
                            role: 'Superadmin Konsol',
                        })
                        setAllowedModules(OPERATIONAL_MODULES.map((m) => m.key))
                    } else if (isDirector) {
                        setUserProfile(profile || { full_name: 'Direktur Operasional', role: 'Board of Directors' })
                        // Direksi diberikan seluruh modul eksekutif & operasional
                        setAllowedModules(OPERATIONAL_MODULES.map((m) => m.key))
                    } else {
                        // User biasa: Sesuai modul akses divisi yang diberikan di Supabase
                        setUserProfile(profile || { full_name: 'Karyawan Site', role: profile?.role || 'Staff' })

                        const { data: perms } = await supabase
                            .from('division_permissions')
                            .select('division_name, allowed_modules')

                        let granted: string[] = []
                        if (perms && perms.length > 0) {
                            const matched = perms.find((p) => {
                                const target = (p.division_name || '').toLowerCase().trim()
                                return (
                                    target === division ||
                                    target.includes(division) ||
                                    division.includes(target) ||
                                    (division.includes('hrd') && target.includes('hrd')) ||
                                    (division.includes('human') && target.includes('human')) ||
                                    (division.includes('finance') && target.includes('keuangan'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                granted = matched.allowed_modules
                            }
                        }

                        if (granted.length === 0) {
                            // Fallback jika belum terdaftar di tabel division_permissions
                            if (division.includes('hrd') || division.includes('human')) {
                                granted = ['hrd', 'performance', 'laporan']
                            } else {
                                granted = ['manager-site', 'laporan']
                            }
                        }

                        setAllowedModules(granted)
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error load portal:', err)
                if (isMounted) setLoading(false)
            }
        }

        loadUserAndPermissions()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const visibleCards = OPERATIONAL_MODULES.filter((mod) =>
        allowedModules.includes(mod.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070b12] flex flex-col items-center justify-center text-slate-300 font-sans">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-mono">Sinkronisasi Portal Operasi Tambang Nikel...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans p-6 md:p-8 select-none">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-[#0b1320] border border-[#1b2a40] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-amber-400 mb-2 font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>PT. JANGKAR ENERGI EKA PERKASA • MANAGEMENT SUITE</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Portal Operasi Terpadu Tambang Nikel
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                                <span>Terhubung sebagai</span>
                                <strong className="text-white">{userProfile?.full_name || 'Karyawan Site'}</strong>
                                <span className={`border text-[10px] px-2 py-0.5 rounded font-mono font-bold ${isSuperAdminUser
                                        ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                                        : 'bg-[#122236] border-[#1b3659] text-cyan-300'
                                    }`}>
                                    {userProfile?.role || 'Staff'}
                                </span>
                                <span>• Site Konawe Utara / IUP-OP Nikel</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {isSuperAdminUser && (
                                <span className="bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold px-3 py-2 rounded-lg">
                                    👑 Konsol Superadmin Aktif
                                </span>
                            )}
                            <Link
                                href="/laporan"
                                className="bg-[#132238] hover:bg-[#1a2f4d] border border-[#213a5e] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg transition"
                            >
                                📄 Cetak Rekap DOR
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
                            >
                                Keluar ke Beranda
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            Modul Operasional yang Diizinkan ({visibleCards.length} Modul Aktif)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleCards.map((mod) => (
                            <Link
                                key={mod.key}
                                href={mod.href}
                                className="bg-[#0b1320] border border-[#162336] hover:border-cyan-400/80 rounded-xl p-5 transition flex flex-col justify-between group hover:shadow-lg hover:shadow-cyan-950/30"
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-2xl p-2 bg-[#070e18] border border-[#142030] rounded-lg group-hover:scale-105 transition">
                                            {mod.icon}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 bg-[#070e18] border border-[#162336] px-2 py-0.5 rounded">
                                            {mod.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                                        {mod.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                        {mod.desc}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 group-hover:text-cyan-400 font-semibold">
                                    <span>Buka Modul</span>
                                    <span>→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}