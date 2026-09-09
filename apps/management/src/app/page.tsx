'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ModuleCard {
    title: string
    desc: string
    href: string
    icon: string
    tag: string
    color: string
}

export default function ManagementPortalPage() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('User Site')
    const [userRole, setUserRole] = useState('Staff Operasional')

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initPortal() {
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
                    setUserName(profile?.full_name || 'Staff Lapangan PT. JEEP')
                    setUserRole(profile?.role || 'Operational Member')
                    setLoading(false)
                }
            } catch (err) {
                console.error('Error portal init:', err)
                if (isMounted) setLoading(false)
            }
        }

        initPortal()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const modules: ModuleCard[] = [
        {
            title: 'Pusat Komando Pit',
            desc: 'Monitoring ritase batubara, pengupasan overburden, dan laporan shift DOR.',
            href: '/manager-site',
            icon: '⛏️',
            tag: 'Operasional Pit',
            color: 'border-emerald-500/50 hover:border-emerald-400',
        },
        {
            title: 'Kesiapan Alat Berat',
            desc: 'Kontrol status unit (OP/ST/BD), jam kerja (HM), serta rasio PA dan MA.',
            href: '/fleet',
            icon: '🚜',
            tag: 'Plant & Bengkel',
            color: 'border-amber-500/50 hover:border-amber-400',
        },
        {
            title: 'Gudang & Sparepart',
            desc: 'Inventaris suku cadang, reorder point, dan ketersediaan part fast-moving.',
            href: '/sparepart',
            icon: '📦',
            tag: 'Logistik Workshop',
            color: 'border-amber-500/50 hover:border-amber-400',
        },
        {
            title: 'Inspeksi K3 & HSE',
            desc: 'Pencatatan temuan hazard, mitigasi risiko K3, dan jam kerja selamat.',
            href: '/safety',
            icon: '⛑️',
            tag: 'K3 Tambang',
            color: 'border-rose-500/50 hover:border-rose-400',
        },
        {
            title: 'Ritase & Timbangan',
            desc: 'Verifikasi tonase bruto, tare, dan netto armada hauling dump truck.',
            href: '/ritase',
            icon: '🚛',
            tag: 'Weighbridge',
            color: 'border-amber-500/50 hover:border-amber-400',
        },
        {
            title: 'Jetty & Barging',
            desc: 'Pemuatan conveyor tongkang batubara, draught survey, dan status SPB.',
            href: '/jetty',
            icon: '🚢',
            tag: 'Port Terminal',
            color: 'border-cyan-500/50 hover:border-cyan-400',
        },
        {
            title: 'Lingkungan & Reklamasi',
            desc: 'Uji baku mutu settling pond (pH & TSS), penataan lahan, serta revegetasi.',
            href: '/lingkungan',
            icon: '🌱',
            tag: 'Lingkungan Hidup',
            color: 'border-emerald-500/50 hover:border-emerald-400',
        },
        {
            title: 'Tangki & BBM Solar',
            desc: 'Stok solar industri, pencatatan nozzle alat berat, dan burn rate operasional.',
            href: '/bbm',
            icon: '⛽',
            tag: 'Fuel Management',
            color: 'border-amber-500/50 hover:border-amber-400',
        },
        {
            title: 'Kas & Finansial Site',
            desc: 'Ledger pengeluaran kas kecil, dropping dana pusat, dan biaya lapangan.',
            href: '/finance',
            icon: '💰',
            tag: 'Finance & Kas',
            color: 'border-emerald-500/50 hover:border-emerald-400',
        },
        {
            title: 'Administrasi & Surat',
            desc: 'Pengarsipan surat jalan ritase, izin masuk SIMP, dan administrasi berkas.',
            href: '/adm',
            icon: '📋',
            tag: 'Site ADM',
            color: 'border-sky-500/50 hover:border-sky-400',
        },
        {
            title: 'HRD & Manpower',
            desc: 'Database pekerja tambang, shift kerja, kebugaran, dan status kru.',
            href: '/hrd',
            icon: '👷‍♂️',
            tag: 'Human Resources',
            color: 'border-sky-500/50 hover:border-sky-400',
        },
        {
            title: 'General Affair (GA)',
            desc: 'Log armada LV operasional, sarana mess camp, genset, dan logistik makan.',
            href: '/ga',
            icon: '🚙',
            tag: 'Fasilitas & Sarana',
            color: 'border-amber-500/50 hover:border-amber-400',
        },
        {
            title: 'Eksekutif Direksi',
            desc: 'High-level dashboard, ringkasan produksi, dan realisasi anggaran tambang.',
            href: '/direktur',
            icon: '🏛️',
            tag: 'Executive BOD',
            color: 'border-amber-500/50 hover:border-amber-400',
        },
        {
            title: 'Cetak Laporan Resmi',
            desc: 'Format cetak resmi Daily Operation Report (DOR) siap unduh PDF.',
            href: '/laporan',
            icon: '📄',
            tag: 'Laporan DOR',
            color: 'border-emerald-500/50 hover:border-emerald-400',
        },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Menghubungkan Portal Manajemen PT. JEEP...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-8 select-none">
            {/* Header Utama Portal */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-2xl p-6 mb-8 shadow-2xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                            PT. JANGKAR ENERGI EKA PERKASA • MANAGEMENT SUITE
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-wide text-white">
                        Portal Operasi Terpadu Tambang Batubara
                    </h1>
                    <p className="text-xs text-slate-400">
                        Terhubung sebagai <span className="text-white font-bold">{userName}</span> ({userRole}) • Kutai Barat / Tabang Site
                    </p>
                </div>

                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <Link
                        href="/laporan"
                        className="bg-[#112233] hover:bg-[#162d47] border border-[#1e3a5f] text-slate-200 text-xs px-4 py-2.5 rounded-xl transition font-semibold flex items-center gap-2"
                    >
                        <span>📄</span>
                        <span>Cetak Rekap DOR</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2.5 rounded-xl transition cursor-pointer font-semibold"
                    >
                        Keluar ke Beranda
                    </button>
                </div>
            </header>

            {/* Grid Menu Modul */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {modules.map((m) => (
                    <Link
                        key={m.href}
                        href={m.href}
                        className={`bg-[#0a1625] border ${m.color} rounded-2xl p-5 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 flex flex-col justify-between group cursor-pointer`}
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-3xl">{m.icon}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    {m.tag}
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-white group-hover:text-amber-400 transition mb-1.5">
                                {m.title}
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {m.desc}
                            </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#16273c] flex items-center justify-between text-[11px] text-slate-400 group-hover:text-white transition font-semibold">
                            <span>Buka Modul</span>
                            <span>→</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Footer Info */}
            <footer className="mt-12 text-center text-xs text-slate-500 border-t border-[#12243d] pt-6">
                <p>© 2026 PT. Jangkar Energi Eka Perkasa. Seluruh hak cipta dilindungi.</p>
                <p className="text-[10px] text-slate-600 mt-1">Sistem Manajemen Terintegrasi Site Tambang Batubara Kalimantan Timur</p>
            </footer>
        </div>
    )
}