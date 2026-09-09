'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function ModuleNavbar({ currentModule }: { currentModule: string }) {
    const router = useRouter()
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        async function checkModuleAccess() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                window.location.href = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle()

            const userDivision = (profile?.role || '').trim().toLowerCase()

            // Jika Superadmin murni
            if (['admin', 'administrator', 'superadmin'].includes(userDivision)) {
                setAllowedModules(ALL_MODULES.map((m) => m.key))
                setIsAuthorized(true)
                return
            }

            // Ambil izin divisi dari Supabase
            const { data: perms } = await supabase
                .from('division_permissions')
                .select('division_name, allowed_modules')

            let grantedKeys: string[] = []
            if (perms && perms.length > 0) {
                const matched = perms.find((p) => {
                    const target = (p.division_name || '').toLowerCase().trim()
                    return (
                        target === userDivision ||
                        target.includes(userDivision) ||
                        userDivision.includes(target) ||
                        (userDivision === 'adm' && (target.includes('administrasi') || target.includes('adm')))
                    )
                })

                if (matched && Array.isArray(matched.allowed_modules)) {
                    grantedKeys = matched.allowed_modules
                }
            }

            setAllowedModules(grantedKeys)

            // Validasi rute saat ini: jika modul aktif tidak terdaftar di izin, blokir akses
            if (grantedKeys.includes(currentModule)) {
                setIsAuthorized(true)
            } else {
                setIsAuthorized(false)
                alert(`Divisi Anda tidak memiliki izin untuk mengakses modul ini.`)
                router.replace('/')
            }
        }

        checkModuleAccess()
    }, [currentModule, router])

    if (isAuthorized === false) {
        return (
            <div className="p-4 mb-4 bg-rose-950/40 border border-rose-900/50 rounded-xl text-center text-xs text-rose-300 font-mono">
                Akses ditolak. Mengalihkan ke beranda...
            </div>
        )
    }

    // Hanya tampilkan tombol navbar modul yang diizinkan untuk divisi pengguna
    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    return (
        <div className="overflow-x-auto pb-2 mb-6">
            <div className="flex items-center gap-2 min-w-max">
                {authorizedNavItems.map((item) => {
                    const isCurrent = item.key === currentModule
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
    )
}