'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ManagementDispatcher() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [statusText, setStatusText] = useState('Memeriksa hak akses divisi...')

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin-pied-pi-57.vercel.app'

    useEffect(() => {
        async function checkUserRole() {
            try {
                // 1. Tangkap token cross-domain jika ada pengalihan dari landing page
                if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
                    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
                    const accessToken = hashParams.get('access_token')
                    const refreshToken = hashParams.get('refresh_token')

                    if (accessToken && refreshToken) {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        })
                        // Bersihkan hash dari URL browser agar rapi
                        window.history.replaceState(null, '', window.location.pathname)
                    }
                }

                // 2. Periksa sesi pengguna
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                setStatusText('Memuat profil divisi...')

                // 3. Ambil data role dan status dari tabel profiles
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role, status')
                    .eq('id', session.user.id)
                    .single()

                if (error || !profile) {
                    setStatusText('Profil pengguna tidak ditemukan.')
                    setLoading(false)
                    return
                }

                if (profile.status !== 'Aktif') {
                    alert('Akun Anda dinonaktifkan. Hubungi Super Admin.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                const role = profile.role?.toLowerCase() || ''

                // 4. Arahkan secara presisi sesuai divisi
                if (role === 'finance') {
                    router.replace('/finance')
                } else if (role === 'hrd') {
                    router.replace('/hrd')
                } else if (role === 'developer' || role === 'superadmin') {
                    window.location.href = adminUrl
                } else {
                    // DivAdmin atau Tim Operasional Lapangan
                    setLoading(false)
                }
            } catch (err) {
                console.error(err)
                setLoading(false)
            }
        }

        checkUserRole()
    }, [router, landingUrl, adminUrl])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-slate-400">{statusText}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-amber-400">Portal Divisi Operasional Lapangan</h1>
                        <p className="text-xs text-slate-400">PT. Jangkar Energi Eka Perkasa</p>
                    </div>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut()
                            window.location.href = landingUrl
                        }}
                        className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        Keluar Sistem
                    </button>
                </div>
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-sm text-slate-300">Selamat datang di sistem manajemen ritase dan operasional site.</p>
                </div>
            </div>
        </div>
    )
}