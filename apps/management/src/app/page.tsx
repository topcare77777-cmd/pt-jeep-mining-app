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
    const [statusText, setStatusText] = useState('Memverifikasi sesi login...')

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin-pied-pi-57.vercel.app'

    useEffect(() => {
        async function checkUserRole() {
            try {
                // 1. Ambil token lintas domain dari URL hash jika ada
                if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
                    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
                    const accessToken = hashParams.get('access_token')
                    const refreshToken = hashParams.get('refresh_token')

                    if (accessToken && refreshToken) {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        })
                        window.history.replaceState(null, '', window.location.pathname)
                    }
                }

                // 2. Periksa sesi Supabase
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                setStatusText('Mengecek profil divisi...')

                // 3. Ambil data profil berdasarkan UID
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
                    alert('Akun Anda dinonaktifkan.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                const role = (profile.role || '').toLowerCase()

                // 4. Pengalihan cerdas sesuai divisi
                if (role.includes('finance') || role.includes('keuangan')) {
                    router.replace('/finance')
                } else if (role.includes('hrd') || role.includes('human resources') || role.includes('personalia')) {
                    router.replace('/hrd')
                } else if (role.includes('ga') || role.includes('umum') || role.includes('general affair')) {
                    router.replace('/ga')
                } else if (role === 'adm' || role.includes('administrasi') || role.includes('admin site')) {
                    router.replace('/adm')
                } else if (role.includes('developer') || role.includes('superadmin') || role === 'divadmin') {
                    window.location.href = adminUrl
                } else {
                    setStatusText(`Role [${profile.role}] belum memiliki dashboard khusus.`)
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
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-slate-400">{statusText}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 p-8 font-sans flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 shadow-xl text-center space-y-4">
                <div className="text-3xl">⚠️</div>
                <h2 className="text-lg font-bold text-white">Akses Terbatas</h2>
                <p className="text-xs text-slate-400">{statusText}</p>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut()
                        window.location.href = landingUrl
                    }}
                    className="w-full bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 text-rose-300 text-xs py-2.5 rounded-lg transition font-semibold"
                >
                    Keluar ke Beranda
                </button>
            </div>
        </div>
    )
}