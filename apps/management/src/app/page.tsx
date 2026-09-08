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
        // 1. Tangkap token cross-domain dari landing page
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

        // 2. Ambil sesi Supabase
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

        const role = profile.role?.toLowerCase() || ''

        // 4. Arahkan ke dashboard finance
        if (role === 'finance') {
          router.replace('/finance')
        } else if (role === 'hrd') {
          router.replace('/hrd')
        } else if (role === 'developer' || role === 'superadmin') {
          window.location.href = adminUrl
        } else {
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
            <h1 className="text-2xl font-bold text-amber-400">Portal Divisi Lapangan</h1>
            <p className="text-xs text-slate-400">PT. Jangkar Energi Eka Perkasa</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = landingUrl
            }}
            className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 text-xs px-4 py-2 rounded-lg transition"
          >
            Keluar Sistem
          </button>
        </div>
      </div>
    </div>
  )
}