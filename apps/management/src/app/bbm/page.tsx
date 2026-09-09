'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface FuelItem {
  id: string
  created_at?: string
  transaction_datetime: string
  fuel_type: string
  transaction_type: string
  unit_code: string
  liters: number
  hour_meter: number
  operator_driver: string
  fuel_man: string
}

// 30 Modul Lengkap Tambang Nikel PT. Jangkar Energi Eka Perkasa
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
  { key: 'security', label: 'Security Gate', icon: '🛡️', href: '/security' },
  { key: 'radio', label: 'Radio Dispatch', icon: '📻', href: '/radio' },
  { key: 'legal', label: 'Legalitas IUP', icon: '⚖️', href: '/legal' },
  { key: 'csr', label: 'CSR Masyarakat', icon: '🤝', href: '/csr' },
  { key: 'vendor', label: 'Vendor', icon: '🏬', href: '/vendor' },
  { key: 'transport', label: 'Transport Kru', icon: '🚌', href: '/transport' },
  { key: 'training', label: 'Training K3', icon: '🎓', href: '/training' },
  { key: 'performance', label: 'Kinerja KPI', icon: '📈', href: '/performance' },
  { key: 'it-helpdesk', label: 'IT Helpdesk', icon: '💻', href: '/it-helpdesk' },
  { key: 'helpdesk', label: 'Helpdesk GA', icon: '🛠️', href: '/helpdesk' },
  { key: 'investor', label: 'Investor & RKAB', icon: '📊', href: '/investor' },
  { key: 'direktur', label: 'Eksekutif BOD', icon: '🏛️', href: '/direktur' },
  { key: 'laporan', label: 'Cetak Laporan', icon: '📄', href: '/laporan' },
]

export default function FuelManagementPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Fuel Man Supervisor')
  const [userRole, setUserRole] = useState('Fuel Management')
  const [allowedModules, setAllowedModules] = useState<string[]>([])
  const [fuelLogs, setFuelLogs] = useState<FuelItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // State Modal Input Transaksi BBM Baru
  const [showModal, setShowModal] = useState(false)
  const [transactionDatetime, setTransactionDatetime] = useState('')
  const [fuelType, setFuelType] = useState('Solar B35 Industri')
  const [transactionType, setTransactionType] = useState('Pengisian')
  const [unitCode, setUnitCode] = useState('DT-012')
  const [liters, setLiters] = useState('450')
  const [hourMeter, setHourMeter] = useState('3420.5')
  const [operatorDriver, setOperatorDriver] = useState('')
  const [fuelMan, setFuelMan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

  useEffect(() => {
    let isMounted = true

    async function initFuel() {
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
        if (statusClean === 'nonaktif' || statusClean === 'non-aktif' || statusClean === 'banned') {
          alert('Akun Anda dinonaktifkan.')
          await supabase.auth.signOut()
          window.location.href = landingUrl
          return
        }

        if (isMounted) {
          setUserName(profile?.full_name || 'Plant & Fuel Superintendent')
          const division = (profile?.role || 'Fuel Management').trim()
          setUserRole(division)

          // Filter navigasi modul berdasarkan matriks hak akses divisi
          const isSuperAdmin = ['admin', 'administrator', 'superadmin'].includes(division.toLowerCase())

          let grantedKeys: string[] = []
          if (isSuperAdmin) {
            grantedKeys = ALL_MODULES.map((m) => m.key)
          } else {
            const { data: allPerms } = await supabase
              .from('division_permissions')
              .select('division_name, allowed_modules')

            if (allPerms && allPerms.length > 0) {
              const cleanDiv = division.toLowerCase()
              const matched = allPerms.find((p) => {
                const target = (p.division_name || '').toLowerCase().trim()
                return (
                  target === cleanDiv ||
                  target.includes(cleanDiv) ||
                  cleanDiv.includes(target) ||
                  (cleanDiv === 'bbm' && target.includes('bbm'))
                )
              })

              if (matched && Array.isArray(matched.allowed_modules)) {
                grantedKeys = matched.allowed_modules
              } else {
                grantedKeys = ['bbm']
              }
            } else {
              grantedKeys = ['bbm']
            }
          }

          // Route Guard: Bila user tidak memiliki izin modul BBM
          if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('bbm')) {
            alert('Divisi Anda tidak memiliki hak akses ke modul BBM Solar.')
            router.replace('/')
            return
          }

          setAllowedModules(grantedKeys)

          // Ambil riwayat log BBM dari Supabase
          const { data, error } = await supabase
            .from('fuel_logs')
            .select('*')
            .order('created_at', { ascending: false })

          if (!error && data && data.length > 0) {
            setFuelLogs(
              data.map((item: any) => ({
                id: item.id,
                transaction_datetime: item.transaction_datetime || item.transaction_date || item.created_at,
                fuel_type: item.fuel_type || 'Solar B35 Industri',
                transaction_type: item.transaction_type,
                unit_code: item.unit_code,
                liters: Number(item.liters || 0),
                hour_meter: Number(item.hour_meter || 0),
                operator_driver: item.operator_driver,
                fuel_man: item.fuel_man,
              }))
            )
          } else {
            setFuelLogs([
              {
                id: '1',
                transaction_datetime: '2026-09-09T08:30:00',
                fuel_type: 'Solar B35 Industri',
                transaction_type: 'Penerimaan',
                unit_code: 'TANGKI-UTAMA-01',
                liters: 32000,
                hour_meter: 0,
                operator_driver: 'Supplier PT Solar Pasifik Nusantara',
                fuel_man: 'Hendra (Fuel Man)',
              },
              {
                id: '2',
                transaction_datetime: '2026-09-09T10:15:00',
                fuel_type: 'Solar B35 Industri',
                transaction_type: 'Pengisian',
                unit_code: 'EX-05 (Excavator PC200)',
                liters: 450,
                hour_meter: 4120.0,
                operator_driver: 'Joko (Operator Pit Nikel)',
                fuel_man: 'Hendra (Fuel Man)',
              },
            ])
          }
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (isMounted) setLoading(false)
      }
    }

    initFuel()

    return () => {
      isMounted = false
    }
  }, [landingUrl, router])

  const handleOpenModal = () => {
    // Inisialisasi waktu saat ini dalam format YYYY-MM-DDTHH:mm
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const localNow = new Date(now.getTime() - offset * 60 * 1000)
    setTransactionDatetime(localNow.toISOString().slice(0, 16))
    setShowModal(true)
  }

  const handleAddFuelLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitCode || !liters) return

    setSubmitting(true)

    const payload = {
      transaction_datetime: transactionDatetime || new Date().toISOString(),
      transaction_date: transactionDatetime ? transactionDatetime.split('T')[0] : new Date().toISOString().split('T')[0],
      fuel_type: fuelType,
      transaction_type: transactionType,
      unit_code: unitCode.toUpperCase(),
      liters: parseFloat(liters) || 0,
      hour_meter: parseFloat(hourMeter) || 0,
      operator_driver: operatorDriver || 'Operator Pit Nikel',
      fuel_man: fuelMan || userName,
    }

    const { data, error } = await supabase
      .from('fuel_logs')
      .insert([payload])
      .select()

    if (!error && data) {
      setFuelLogs([data[0], ...fuelLogs])
      setShowModal(false)
      setUnitCode('DT-015')
      setLiters('350')
    } else {
      // Fallback state lokal
      setFuelLogs([
        {
          id: Date.now().toString(),
          ...payload,
        },
        ...fuelLogs,
      ])
      setShowModal(false)
      setUnitCode('DT-015')
      setLiters('350')
    }

    setSubmitting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = landingUrl
  }

  const formatDateTimeDisplay = (rawDateStr: string) => {
    try {
      const dt = new Date(rawDateStr)
      if (isNaN(dt.getTime())) return rawDateStr
      return dt.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WITA'
    } catch {
      return rawDateStr
    }
  }

  const totalIncoming = fuelLogs
    .filter((f) => f.transaction_type === 'Penerimaan')
    .reduce((acc, curr) => acc + Number(curr.liters || 0), 0)

  const totalOutgoing = fuelLogs
    .filter((f) => f.transaction_type === 'Pengisian')
    .reduce((acc, curr) => acc + Number(curr.liters || 0), 0)

  const filteredLogs = fuelLogs.filter((item) =>
    item.unit_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.transaction_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.fuel_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.operator_driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.fuel_man.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Hanya tombol navigasi berizin yang dirender
  const authorizedNavItems = ALL_MODULES.filter((item) =>
    allowedModules.includes(item.key)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-slate-400 font-mono">
          Sinkronisasi Logistik BBM Tambang Nikel PT. Jangkar Energi Eka Perkasa...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
      {/* Header Utama */}
      <header className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⛽</span>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                Manajemen BBM Solar Industri PT. Jangkar Energi Eka Perkasa
              </h1>
              <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Kontrol Stok Tangki Utama Pit Nikel, Pengisian Alat Berat, & Efisiensi Burn Rate</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-semibold">{userName}</span>
                <span className="bg-[#112233] border border-[#1e3a5f] text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                  {userRole}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Keluar ke Beranda
          </button>
        </div>

        {/* Bilah Navigasi Terfilter Sesuai Hak Akses Divisi */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {authorizedNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
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

      {/* KPI BBM Tambang Nikel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Penerimaan BBM</h3>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {totalIncoming.toLocaleString('id-ID')} Liter
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Suplai Dari Vendor Resmi Site</p>
        </div>

        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pengisian ke Unit</h3>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {totalOutgoing.toLocaleString('id-ID')} Liter
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Konsumsi Alat Berat & Hauler Nikel</p>
        </div>

        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimasi Stok Tangki Utama</h3>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {(totalIncoming - totalOutgoing).toLocaleString('id-ID')} Liter
          </div>
          <p className="mt-2 text-[11px] text-cyan-400 font-semibold">Tersedia di Fuel Station Site</p>
        </div>

        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rekonsiliasi Fuel Pit</h3>
          <div className="text-2xl font-black text-emerald-400 font-mono">Akurat 100%</div>
          <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Burn Rate Sesuai Jam Kerja HM</p>
        </div>
      </div>

      {/* Grid Tabel Transaksi BBM */}
      <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari unit, jenis BBM, operator, fuel man..."
              className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span> <span>Catat Transaksi BBM Baru</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b2e46] text-slate-400">
                <th className="pb-2.5">Tanggal & Pukul</th>
                <th className="pb-2.5">Jenis BBM</th>
                <th className="pb-2.5 text-center">Transaksi</th>
                <th className="pb-2.5">Kode Unit / Tangki</th>
                <th className="pb-2.5 text-right">Volume (Liter)</th>
                <th className="pb-2.5 text-right">Hour Meter (HM)</th>
                <th className="pb-2.5">Operator / Driver</th>
                <th className="pb-2.5">Fuel Man Jaga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#16273c] text-slate-300">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((f) => {
                  const isIncoming = f.transaction_type === 'Penerimaan'
                  return (
                    <tr key={f.id} className="hover:bg-[#0c1a2d]/50 transition">
                      <td className="py-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        {formatDateTimeDisplay(f.transaction_datetime)}
                      </td>
                      <td>
                        <span className="bg-[#102238] border border-[#1e3d64] text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                          {f.fuel_type || 'Solar B35 Industri'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold inline-block ${isIncoming
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                              : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                            }`}
                        >
                          {f.transaction_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-bold text-white">{f.unit_code}</td>
                      <td
                        className={`text-right font-mono font-bold ${isIncoming ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                      >
                        {isIncoming ? '+ ' : '- '}
                        {Number(f.liters).toLocaleString('id-ID')} L
                      </td>
                      <td className="text-right font-mono text-slate-300">
                        {Number(f.hour_meter).toLocaleString('id-ID')} HM
                      </td>
                      <td className="text-slate-300">{f.operator_driver}</td>
                      <td className="text-slate-400">{f.fuel_man}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    Tidak ada data transaksi BBM yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Transaksi BBM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Pencatatan Transaksi BBM PT. Jangkar Energi Eka Perkasa
            </h2>
            <form onSubmit={handleAddFuelLog} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tanggal & Waktu Transaksi</label>
                  <input
                    type="datetime-local"
                    required
                    value={transactionDatetime}
                    onChange={(e) => setTransactionDatetime(e.target.value)}
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Jenis Bahan Bakar (BBM)</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                  >
                    <option value="Solar B35 Industri">Solar B35 Industri (Utama)</option>
                    <option value="Solar B30">Solar B30</option>
                    <option value="Pertamina Dex">Pertamina Dex (Kendaraan LV)</option>
                    <option value="Biosolar Non-Subsidi">Biosolar Non-Subsidi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Jenis Transaksi</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold"
                  >
                    <option value="Pengisian">Pengisian ke Unit (Outgoing)</option>
                    <option value="Penerimaan">Penerimaan dari Supplier (Incoming)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kode Unit / Tangki Site</label>
                  <input
                    type="text"
                    required
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value)}
                    placeholder="Contoh: DT-012, EX-05, atau TANGKI-01"
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Volume BBM (Liter)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    placeholder="Contoh: 450"
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Posisi Hour Meter (HM) Unit</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={hourMeter}
                    onChange={(e) => setHourMeter(e.target.value)}
                    placeholder="Contoh: 3420.5 (Isi 0 jika tangki)"
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Operator / Driver Penerima</label>
                  <input
                    type="text"
                    required
                    value={operatorDriver}
                    onChange={(e) => setOperatorDriver(e.target.value)}
                    placeholder="Contoh: Joko (Operator Excavator)"
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Fuel Man (Petugas Nozzle)</label>
                  <input
                    type="text"
                    required
                    value={fuelMan}
                    onChange={(e) => setFuelMan(e.target.value)}
                    placeholder="Nama petugas dispenser"
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#1b2e46] text-slate-400 hover:text-white text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi BBM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}