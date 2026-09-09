'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 30 Modul Tambang Nikel PT. JEEP
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
    { key: 'security', label: 'Security', icon: '🛡️', href: '/security' },
    { key: 'radio', label: 'Radio Dispatch', icon: '📻', href: '/radio' },
    { key: 'legal', label: 'Legalitas IUP', icon: '⚖️', href: '/legal' },
    { key: 'csr', label: 'CSR Masyarakat', icon: '🤝', href: '/csr' },
    { key: 'vendor', label: 'Vendor', icon: '🏬', href: '/vendor' },
    { key: 'transport', label: 'Transport Kru', icon: '🚌', href: '/transport' },
    { key: 'training', label: 'Training K3', icon: '🎓', href: '/training' },
    { key: 'performance', label: 'Kinerja KPI', icon: '📈', href: '/performance' },
    { key: 'it-helpdesk', label: 'IT Helpdesk', icon: '💻', href: '/it-helpdesk' },
    { key: 'helpdesk', label: 'Helpdesk GA', icon: '🛠️', href: '/helpdesk' },
    { key: 'investor', label: 'Investor', icon: '📊', href: '/investor' },
    { key: 'direktur', label: 'Eksekutif BOD', icon: '🏛️', href: '/direktur' },
    { key: 'laporan', label: 'Cetak Laporan', icon: '📄', href: '/laporan' },
]

export default function AdmDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<'surat' | 'jalan' | 'po' | 'simp'>('surat')
    const [searchTerm, setSearchTerm] = useState('')

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function loadAuthAndPermissions() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                // Ambil profil
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, status')
                    .eq('id', session.user.id)
                    .maybeSingle()

                if (isMounted) {
                    setUserProfile(profile)
                    const userDivision = (profile?.role || '').trim()

                    // Jika Superadmin, berikan semua modul
                    const isSuperAdmin = ['admin', 'administrator', 'superadmin'].includes(userDivision.toLowerCase())

                    if (isSuperAdmin) {
                        setAllowedModules(ALL_MODULES.map((m) => m.key))
                    } else {
                        // Ambil izin dari database
                        const { data: allPerms } = await supabase
                            .from('division_permissions')
                            .select('division_name, allowed_modules')

                        if (allPerms && allPerms.length > 0) {
                            const cleanDiv = userDivision.toLowerCase()

                            const matched = allPerms.find((p) => {
                                const target = (p.division_name || '').toLowerCase().trim()
                                return (
                                    target === cleanDiv ||
                                    target.includes(cleanDiv) ||
                                    cleanDiv.includes(target) ||
                                    (cleanDiv === 'adm' && target.includes('adm'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                setAllowedModules(matched.allowed_modules)
                            } else {
                                setAllowedModules(['adm'])
                            }
                        } else {
                            setAllowedModules(['adm'])
                        }
                    }
                    setLoading(false)
                }
            } catch (err) {
                console.error('Gagal memuat izin:', err)
                if (isMounted) setLoading(false)
            }
        }

        loadAuthAndPermissions()
        return () => { isMounted = false }
    }, [landingUrl])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    // Filter tombol navigasi: hanya modul yang diizinkan oleh Superadmin
    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070b12] flex flex-col items-center justify-center text-slate-300 font-sans">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-mono">Memuat Modul Administrasi Nikel...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans p-6 select-none">
            {/* Header Utama Modul */}
            <div className="bg-[#0b1320] border border-[#1b2a40] rounded-xl p-5 mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <span className="text-3xl p-2.5 bg-[#070e18] border border-[#16253a] rounded-lg">📋</span>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            Dashboard Administrasi (ADM) PT. JEEP
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Live Sync Dokumen Tambang Nikel</span>
                            <span>•</span>
                            <strong className="text-slate-200">{userProfile?.full_name || 'Staff ADM'}</strong>
                            <span className="bg-[#122236] border border-[#1b3659] text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                                {userProfile?.role || 'ADM'}
                            </span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                    Keluar ke Beranda
                </button>
            </div>

            {/* Bilah Navigasi: Hanya Merender Modul yang Diizinkan */}
            <div className="overflow-x-auto pb-2 mb-6">
                <div className="flex items-center gap-2 min-w-max">
                    {authorizedNavItems.map((item) => {
                        const isCurrent = item.key === 'adm'
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${isCurrent
                                        ? 'bg-[#10253d] border border-cyan-400 text-white shadow-md shadow-cyan-950/50'
                                        : 'bg-[#0b1320] border border-[#162336] text-slate-400 hover:text-slate-200 hover:border-[#243754]'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Tab Filter Sub-Kategori ADM */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
                <button
                    onClick={() => setActiveTab('surat')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === 'surat'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-[#0b1320] border border-[#162336] text-slate-400 hover:text-white'
                        }`}
                >
                    <span>SURAT MASUK & KELUAR</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">0 BERKAS</span>
                </button>

                <button
                    onClick={() => setActiveTab('jalan')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'jalan'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-[#0b1320] border border-[#162336] text-slate-400 hover:text-white'
                        }`}
                >
                    SURAT JALAN & RITASE NIKEL
                </button>

                <button
                    onClick={() => setActiveTab('po')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'po'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-[#0b1320] border border-[#162336] text-slate-400 hover:text-white'
                        }`}
                >
                    PURCHASE ORDER (PO)
                </button>

                <button
                    onClick={() => setActiveTab('simp')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'simp'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-[#0b1320] border border-[#162336] text-slate-400 hover:text-white'
                        }`}
                >
                    BUKU TAMU & SIMP SITE
                </button>
            </div>

            {/* Konten Area Kerja Administrasi */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Kolom Kiri: Tombol Aksi Cepat & Info DB */}
                <div className="space-y-4">
                    <div className="bg-[#0b1320] border border-cyan-500/30 rounded-xl p-4 cursor-pointer hover:border-cyan-400 transition">
                        <div className="flex items-center gap-3">
                            <span className="text-xl text-cyan-400 font-bold">+</span>
                            <div>
                                <h3 className="text-xs font-bold text-white">Catat Dokumen Baru</h3>
                                <p className="text-[11px] text-slate-400">Surat Jalan, Memo, atau SIMP Nikel</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0b1320] border border-[#162336] rounded-xl p-4 cursor-pointer hover:border-[#243754] transition">
                        <div className="flex items-center gap-3">
                            <span className="text-xl text-amber-400">⚖️</span>
                            <div>
                                <h3 className="text-xs font-bold text-white">Rekap Timbangan & Ritase</h3>
                                <p className="text-[11px] text-slate-400">Verifikasi Muatan Surat Jalan</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0b1320] border border-[#162336] rounded-xl p-4 text-xs space-y-2">
                        <h4 className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">DATABASE ADM</h4>
                        <div className="flex justify-between text-slate-400">
                            <span>Tabel Terhubung:</span>
                            <span className="font-mono text-cyan-400">adm_documents</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Total Berkas:</span>
                            <span className="font-mono text-slate-200 font-bold">0 baris</span>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Tabel Dokumen */}
                <div className="lg:col-span-3 bg-[#0b1320] border border-[#162336] rounded-xl p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <div className="relative flex-1 max-w-md">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari no. agenda, perihal, pengirim..."
                                    className="w-full bg-[#070e18] border border-[#1b2b42] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                                />
                            </div>

                            <button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer">
                                + Dokumen Baru
                            </button>
                        </div>

                        <div className="border border-[#162336] rounded-lg overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#070e18] text-slate-400 border-b border-[#162336]">
                                    <tr>
                                        <th className="p-3">No. Agenda</th>
                                        <th className="p-3">Perihal / Berkas</th>
                                        <th className="p-3">Pengirim</th>
                                        <th className="p-3">Kategori</th>
                                        <th className="p-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500 italic">
                                            Belum ada dokumen yang cocok dengan pencarian.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}