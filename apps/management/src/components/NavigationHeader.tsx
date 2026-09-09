'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface NavigationHeaderProps {
  title: string
  subtitle: string
  userName?: string
  roleBadge?: string
  accentColor?: 'emerald' | 'amber' | 'sky' | 'rose'
}

export default function NavigationHeader({
  title,
  subtitle,
  userName = 'User',
  roleBadge = 'Site Staff',
  accentColor = 'amber',
}: NavigationHeaderProps) {
  const pathname = usePathname()
  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = landingUrl
  }

  const navLinks = [
    { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
    { href: '/ritase', label: 'Ritase & Timbangan', icon: '🚛' },
    { href: '/bbm', label: 'Tangki BBM', icon: '⛽' },
    { href: '/finance', label: 'Keuangan', icon: '💰' },
    { href: '/adm', label: 'ADM & Surat', icon: '📋' },
    { href: '/hrd', label: 'HRD & K3', icon: '👷‍♂️' },
    { href: '/ga', label: 'GA & Fasilitas', icon: '🚙' },
    { href: '/direktur', label: 'Eksekutif', icon: '🏛️' },
    { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
  ]

  const accentClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    rose: 'bg-rose-500',
  }

  return (
    <header className="mb-6 space-y-3">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-wide text-white flex items-center gap-2">
            {title}
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${accentClasses[accentColor]} animate-pulse`}></span>
            <span>{subtitle}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-semibold">{userName}</span>
            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
              {roleBadge}
            </span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
        >
          Keluar ke Beranda
        </button>
      </div>

      {/* Global Module Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {navLinks.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${
                isActive
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
    </header>
  )
}s