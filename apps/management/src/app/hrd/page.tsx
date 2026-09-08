'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function HRDDashboard() {
    const router = useRouter()
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function getUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()
                    setCurrentUser(profile || { full_name: 'Divisi HRD', role: 'HRD' })
                } else {
                    setCurrentUser({ full_name: 'Officer HRD', role: 'HRD Site' })
                }
            } catch (err) {
                console.error(err)
                setCurrentUser({ full_name: 'Officer HRD', role: 'HRD Site' })
            }
        }
        getUser()
    }, [])

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await supabase.auth.signOut()
        } catch (err) {
            console.error(err)
        } finally {
            window.location.href = landingUrl
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <header className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-xl font-bold text-white">Dashboard HRD & Ketenagakerjaan</h1>
                        <p className="text-xs text-amber-400 font-mono">PT. Jangkar Energi Eka Perkasa</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">{currentUser?.full_name} ({currentUser?.role})</span>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 text-xs px-3 py-1.5 rounded-lg transition"
                        >
                            {isLoggingOut ? 'Keluar...' : 'Keluar'}
                        </button>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Total Tenaga Kerja Site</p>
                        <p className="text-2xl font-bold text-white mt-1">142 Orang</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Hadir Hari Ini</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">138 Orang</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Cuti / Izin</p>
                        <p className="text-2xl font-bold text-amber-400 mt-1">4 Orang</p>
                    </div>
                </section>
            </div>
        </div>
    )
}