'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface ProductionLog {
  id: string
  operator_name: string
  pit_block: string
  material_type: string
  vehicle_number: string
  ritase_count: number
  gross_tonnage: number
  created_at: string
}

export default function FieldOperationsDashboard() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // State Log Produksi
  const [logs, setLogs] = useState<ProductionLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // State Form Input Cepat Ritase
  const [pitBlock, setPitBlock] = useState('Pit Alpha')
  const [materialType, setMaterialType] = useState('Overburden (OB)')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [ritaseCount, setRitaseCount] = useState(1)
  const [grossTonnage, setGrossTonnage] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Proteksi Hak Akses (Hanya Operasional Lapangan & Admin)
  useEffect(() => {
    async function verifyAccess() {
      setCheckingAuth(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Silakan masuk terlebih dahulu.')
        router.push('/login')
        return
      }

      // Ambil data divisi dari profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.status !== 'Aktif') {
        alert('Akses ditolak: Akun Anda dinonaktifkan.')
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      // Validasi pembatasan divisi
      const allowedRoles = ['Operasional Lapangan', 'FieldUser', 'Administrator', 'Developer']
      if (!allowedRoles.includes(profile.role)) {
        alert(`Akses Ditolak: Divisi ${profile.role} tidak diperkenankan mengakses Dasbor Lapangan.`)
        router.push('/login')
        return
      }

      setCurrentUser(profile)
      setIsAuthorized(true)
      setCheckingAuth(false)
      fetchLogs()
    }

    verifyAccess()
  }, [router])

  // 2. Ambil data log produksi lapangan
  async function fetchLogs() {
    setLoadingLogs(true)
    const { data, error } = await supabase
      .from('field_production_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Gagal mengambil data log:', error.message)
    } else if (data) {
      setLogs(data)
    }
    setLoadingLogs(false)
  }

  // 3. Simpan Ritase Baru ke Database
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleNumber) return
    setIsSubmitting(true)

    const newEntry = {
      user_id: currentUser?.id,
      operator_name: currentUser?.full_name || 'Operator Lapangan',
      pit_block: pitBlock,
      material_type: materialType,
      vehicle_number: vehicleNumber,
      ritase_count: Number(ritaseCount),
      gross_tonnage: grossTonnage ? parseFloat(grossTonnage) : 0,
      notes: notes,
    }

    const { error } = await supabase.from('field_production_logs').insert([newEntry])

    if (error) {
      alert('Gagal menyimpan log: ' + error.message)
    } else {
      setVehicleNumber('')
      setGrossTonnage('')
      setNotes('')
      fetchLogs()
    }
    setIsSubmitting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-slate-400 font-sans">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs tracking-wider uppercase">Memverifikasi Hak Akses Lapangan...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans p-6 md:p-10">
      {/* Header Dasbor Lapangan */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-zinc-800 gap-4 mb-8">
        <div>
          <span className="text-xs font-mono text-amber-500 font-bold uppercase tracking-widest">
            PT-JEEP // MODUL OPERASIONAL LAPANGAN
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">Dasbor Produksi & Ritase Pit</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operator: <span className="text-white font-medium">{currentUser?.full_name}</span> | Divisi:{' '}
            <span className="text-amber-400 font-mono">{currentUser?.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            ● Mode Online
          </span>
          <button
            onClick={handleLogout}
            className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-300 text-xs px-4 py-2 rounded transition"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom 1: Form Input Cepat Ritase */}
        <section className="bg-[#111] border border-zinc-800 rounded-xl p-6 shadow-xl h-fit">
          <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-zinc-800">
            Catat Ritase Lapangan
          </h2>

          <form onSubmit={handleAddLog} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Lokasi Pit / Blok</label>
              <select
                value={pitBlock}
                onChange={(e) => setPitBlock(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Pit Alpha">Pit Alpha</option>
                <option value="Pit Bravo">Pit Bravo</option>
                <option value="Pit Charlie">Pit Charlie</option>
                <option value="Stockpile Utama">Stockpile Utama</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipe Material</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Overburden (OB)">Overburden (OB)</option>
                <option value="Ore / Bijih">Ore / Bijih Nikel</option>
                <option value="Waste / Buangan">Waste / Buangan</option>
                <option value="Top Soil">Top Soil</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">No. DT / Armada</label>
                <input
                  type="text"
                  required
                  placeholder="DT-104"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white font-mono focus:border-amber-500 focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Jumlah Rit</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={ritaseCount}
                  onChange={(e) => setRitaseCount(Number(e.target.value))}
                  className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Est. Tonase (Ton)</label>
              <input
                type="number"
                step="0.01"
                placeholder="25.50"
                value={grossTonnage}
                onChange={(e) => setGrossTonnage(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Catatan Tambahan</label>
              <textarea
                rows={2}
                placeholder="Kondisi jalan licin, dsb."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded transition disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Kirim Laporan Ritase'}
            </button>
          </form>
        </section>

        {/* Kolom 2: Tabel Riwayat Ritase Terkini */}
        <section className="lg:col-span-2 bg-[#111] border border-zinc-800 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
            <h2 className="text-base font-bold text-white">Riwayat Ritase Terakhir</h2>
            <button
              onClick={fetchLogs}
              className="text-xs text-amber-400 hover:text-amber-300 font-mono transition"
            >
              ⟳ Segarkan
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-12 text-center text-xs text-slate-500">Memuat log lapangan...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Belum ada pencatatan ritase hari ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-slate-500 uppercase">
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3">Armada</th>
                    <th className="py-3 px-3">Blok</th>
                    <th className="py-3 px-3">Material</th>
                    <th className="py-3 px-3 text-center">Rit</th>
                    <th className="py-3 px-3 text-right">Tonase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {logs.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {new Date(item.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 font-bold text-white font-mono">{item.vehicle_number}</td>
                      <td className="py-3 px-3 text-slate-300">{item.pit_block}</td>
                      <td className="py-3 px-3">
                        <span className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-amber-400">
                          {item.material_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-white">
                        {item.ritase_count}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                        {item.gross_tonnage ? `${item.gross_tonnage} T` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}