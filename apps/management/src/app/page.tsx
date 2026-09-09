'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 30 Modul Lengkap Tambang Nikel PT. JEEP
const ALL_OPERATIONAL_MODULES = [
    {
        key: 'manager-site',
        title: 'Pusat Komando Pit Nikel',
        badge: 'Operasional Pit',
        desc: 'Monitoring ritase bijih nikel, pengupasan overburden, dan laporan shift DOR.',
        icon: '⛏️',
        href: '/manager-site',
    },
    {
        key: 'fleet',
        title: 'Kesiapan Alat Berat',
        badge: 'Plant & Bengkel',
        desc: 'Kontrol status unit (OP/ST/BD), jam kerja (HM), serta rasio PA dan MA.',
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
        desc: 'Inventaris suku cadang, reorder point, dan ketersediaan part fast-moving.',
        icon: '📦',
        href: '/sparepart',
    },
    {
        key: 'safety',
        title: 'Inspeksi K3 & HSE',
        badge: 'K3 Tambang',
        desc: 'Pencatatan temuan hazard, mitigasi risiko K3, dan jam kerja selamat.',
        icon: '⛑️',
        href: '/safety',
    },
    {
        key: 'ritase',
        title: 'Ritase & Timbangan',
        badge: 'Weighbridge',
        desc: 'Verifikasi tonase bruto, tare, dan netto armada hauling dump truck nikel.',
        icon: '🚛',
        href: '/ritase',
    },
    {
        key: 'jetty',
        title: 'Jetty & Barging',
        badge: 'Pelabuhan Jetty',
        desc: 'Pemuatan ore nikel ke tongkang LCT, draught survey, dan status SPB.',
        icon: '🚢',
        href: '/jetty',
    },
    {
        key: 'environment',
        title: 'Lingkungan & Reklamasi',
        badge: 'Lingkungan Hidup',
        desc: 'Uji baku mutu settling pond (pH & TSS), penataan lahan, serta revegetasi.',
        icon: '🌱',
        href: '/environment',
    },
    {
        key: 'lingkungan',
        title: 'Kanal Pengendali Sedimen',
        badge: 'Sedimen & Air',
        desc: 'Pengendalian limpasan air tambang dan audit rona lingkungan tambang nikel.',
        icon: '🏞️',
        href: '/lingkungan',
    },
    {
        key: 'bbm',
        title: 'Tangki & BBM Solar',
        badge: 'Fuel Management',
        desc: 'Stok solar industri, pencatatan nozzle alat berat, dan burn rate operasional.',
        icon: '⛽',
        href: '/bbm',
    },
    {
        key: 'finance',
        title: 'Kas & Finansial Site',
        badge: 'Finance & Kas',
        desc: 'Ledger pengeluaran kas kecil, dropping dana pusat, dan biaya lapangan.',
        icon: '💰',
        href: '/finance',
    },
    {
        key: 'adm',
        title: 'Administrasi & Surat',
        badge: 'Site ADM',
        desc: 'Pengarsipan surat jalan ritase nikel, izin masuk SIMP, dan administrasi berkas.',
        icon: '📋',
        href: '/adm',
    },
    {
        key: 'hrd',
        title: 'HRD & Manpower',
        badge: 'Human Resources',
        desc: 'Database pekerja tambang nikel, shift kerja, kebugaran, dan status kru.',
        icon: '👷‍♂️',
        href: '/hrd',
    },
    {
        key: 'ga',
        title: 'General Affair (GA)',
        badge: 'Fasilitas & Sarana',
        desc: 'Log armada LV operasional, sarana mess camp, genset, dan logistik makan.',
        icon: '🚙',
        href: '/ga',
    },
    {
        key: 'mess',
        title: 'Hunian & Mess Karyawan',
        badge: 'Camp Accommodation',
        desc: 'Alokasi tempat tidur mess, pemeliharaan fasilitas kamar, dan kebersihan camp.',
        icon: '🏠',
        href: '/mess',
    },
    {
        key: 'catering',
        title: 'Katering & Logistik Pangan',
        badge: 'Food Service',
        desc: 'Kontrol menu makanan bergizi kru tambang nikel dan jadwal suplai mess hall.',
        icon: '🍱',
        href: '/catering',
    },
    {
        key: 'clinic',
        title: 'Klinik Medis Site',
        badge: 'Pelayanan Medis',
        desc: 'Pemeriksaan kesehatan pekerja tambang, surat fit-to-work, dan darurat.',
        icon: '🏥',
        href: '/clinic',
    },
    {
        key: 'security',
        title: 'Security & Akses Gerbang',
        badge: 'Keamanan Site',
        desc: 'Pemeriksaan ID card gerbang masuk tambang nikel dan cek bagasi logistik.',
        icon: '🛡️',
        href: '/security',
    },
    {
        key: 'radio',
        title: 'Radio Dispatch & SSB',
        badge: 'Dispatch Tambang',
        desc: 'Log komunikasi radio HT/SSB, pemanggilan unit pit, dan koordinasi darurat.',
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
        desc: 'Program PPM/CSR desa lingkar tambang nikel dan komunikasi warga lokal.',
        icon: '🤝',
        href: '/csr',
    },
    {
        key: 'vendor',
        title: 'Vendor & Kontraktor',
        badge: 'Mitra Usaha',
        desc: 'Daftar rekanan kontraktor penambangan nikel, subkontraktor, dan evaluasi vendor.',
        icon: '🏬',
        href: '/vendor',
    },
    {
        key: 'transport',
        title: 'Transportasi & Logistik Kru',
        badge: 'Mobilisasi Kru',
        desc: 'Jadwal bus penjemputan kru tambang nikel, mobilisasi bandara, dan izin keluar.',
        icon: '🚌',
        href: '/transport',
    },
    {
        key: 'training',
        title: 'Pelatihan & Sertifikasi',
        badge: 'Training Center',
        desc: 'Pelatihan POP/POM, sertifikasi operator alat berat, dan induksi keselamatan.',
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
        desc: 'Kendala internet VSAT site tambang nikel, perawatan komputer, dan printer kantor.',
        icon: '💻',
        href: '/it-helpdesk',
    },
    {
        key: 'helpdesk',
        title: 'Helpdesk Sarana GA',
        badge: 'Bantuan Fasilitas',
        desc: 'Permintaan perbaikan fasilitas mess, AC kantor, dan saluran air bersih camp.',
        icon: '🛠️',
        href: '/helpdesk',
    },
    {
        key: 'investor',
        title: 'Portal Investor Tambang',
        badge: 'Investor Relations',
        desc: 'Data keterbukaan perkembangan cadangan nikel dan laporan kinerja finansial.',
        icon: '📊',
        href: '/investor',
    },
    {
        key: 'direktur',
        title: 'Eksekutif Direksi (BOD)',
        badge: 'Executive BOD',
        desc: 'Executive summary tambang nikel, ringkasan produksi, dan anggaran tambang.',
        icon: '🏛️',
        href: '/direktur',
    },
    {
        key: 'laporan',
        title: 'Cetak Laporan Resmi',
        badge: 'Laporan DOR',
        desc: 'Format cetak resmi Daily Operation Report produksi nikel siap unduh PDF.',
        icon: '📄',
        href: '/laporan',
    },
]

export default function ManagementPortalPage() {
    const [loading, setLoading] = useState(true)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function checkAuthAndPermissions() {
            try {
                // Tangkap token dari hash jika login via redirect URL landing page
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

                // 1. Ambil Profil Karyawan
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
                    setUserProfile(profile)
                    const userDivision = profile?.role || ''

                    // 2. Jika Superadmin, berikan semua modul
                    if (userDivision.toLowerCase().includes('admin')) {
                        setAllowedModules(ALL_OPERATIONAL_MODULES.map((m) => m.key))
                    } else {
                        // 3. Ambil hak akses divisi dari database Supabase
                        const { data: permData } = await supabase
                            .from('division_permissions')
                            .select('allowed_modules')
                            .eq('division_name', userDivision)
                            .maybeSingle()

                        if (permData && Array.isArray(permData.allowed_modules)) {
                            setAllowedModules(permData.allowed_modules)
                        } else {
                            setAllowedModules([])
                        }
                    }
                    setLoading(false)
                }
            } catch (err) {
                console.error('Error memuat otorisasi portal:', err)
                if (isMounted) setLoading(false)
            }
        }

        checkAuthAndPermissions()
        return () => { isMounted = false }
    }, [landingUrl])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    // Filter modul hanya yang ada di allowedModules
    const visibleModules = ALL_OPERATIONAL_MODULES.filter((m) =>
        allowedModules.includes(m.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">Memvalidasi Otorisasi Divisi Tambang Nikel...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#080d16] text-slate-100 font-sans p-6 md:p-10 select-none">
            {/* Header Portal Terpadu */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>PT. JANGKAR ENERGI EKA PERKASA • NICKEL MINING SUITE</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b2a40] pb-6">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                            Portal Operasi Terpadu Tambang Nikel
                        </h1>
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                            <span>Terhubung sebagai</span>
                            <strong className="text-amber-400 font-semibold">{userProfile?.full_name || 'Karyawan Site'}</strong>
                            <span className="bg-[#122033] border border-[#1f3756] text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                                {userProfile?.role || 'Umum'}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/laporan"
                            className="bg-[#122033] hover:bg-[#1a2e49] border border-[#1f3756] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2"
                        >
                            <span>📄</span> <span>Cetak Rekap DOR</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
                        >
                            Keluar ke Beranda
                        </button>
                    </div>
                </div>
            </header>

            {/* Grid Kartu Modul Sesuai Hak Akses Divisi */}
            <main className="max-w-7xl mx-auto">
                {visibleModules.length === 0 ? (
                    <div className="bg-[#0c1626] border border-[#1b2a40] rounded-2xl p-12 text-center max-w-lg mx-auto my-12 space-y-3">
                        <span className="text-4xl block">🔒</span>
                        <h2 className="text-lg font-bold text-white">Belum Ada Hak Akses Modul</h2>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Divisi <strong className="text-amber-400">{userProfile?.role}</strong> belum diberikan izin untuk membuka modul operasional apa pun oleh Superadmin. Silakan hubungi Administrator sistem.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {visibleModules.map((mod) => (
                            <div
                                key={mod.key}
                                className="bg-[#0c1626] border border-[#1b2a40] hover:border-cyan-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/20 group"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-3xl">{mod.icon}</span>
                                        <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-[#08101c] border border-[#1a2d47] text-cyan-400">
                                            {mod.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-400 transition">
                                        {mod.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                                        {mod.desc}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-[#16253a]">
                                    <Link
                                        href={mod.href}
                                        className="flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-cyan-400 transition"
                                    >
                                        <span>Buka Modul</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}