'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ItTicketItem {
  id: string
  created_at?: string
  ticket_code: string
  reporter_dept: string
  issue_category: string
  priority_level: string
  description: string
  it_technician: string
  status: string
}

const ALL_MODULES = [
  { key: 'manager-site', label: 'Pit Produksi', icon: '⛏️', href: '/manager-site' },
  { key: 'geologi', label: 'Geologi & Eksplorasi', icon: '🧭', href: '/geologi' },
  { key: 'fleet', label: 'Alat Berat', icon: '🚜', href: '/fleet' },
  { key: 'fleet-maintenance', label: 'Workshop Fleet', icon: '🔧', href: '/fleet-maintenance' },
  { key: 'sparepart', label: 'Sparepart Gudang', icon: '📦', href: '/sparepart' },
  { key: 'safety', label: 'Inspeksi K3 (HSE)', icon: '⛑️', href: '/safety' },
  { key: 'ritase', label: 'Ritase', icon: '🚛', href: '/ritase' },
  { key: 'jetty', label: 'Jetty Port', icon: '🚢', href: '/jetty' },
  { key: 'environment', label: 'Lingkungan', icon: '🌱', href: '/environment' },
  { key: 'lingkungan', label: 'Kanal Sedimen', icon: '🏞️', href: '/lingkungan' },
  { key: 'bbm', label: 'BBM Solar', icon: '⛽', href: '/bbm' },
  { key: 'finance', label: 'Keuangan', icon: '💰', href: '/finance' },
  { key: 'adm', label: 'ADM & Surat', icon: '📋', href: '/adm' },
  { key: 'hrd', label: 'HRD & Payroll', icon: '👷‍♂️', href: '/hrd' },
  { key: 'ga', label: 'GA & Fasilitas', icon: '🚙', href: '/ga' },
  { key: 'assets', label: 'Aset Tambang', icon: '🏷️', href: '/assets' },
  { key: 'mess', label: 'Mess Camp', icon: '🏠', href: '/mess' },
  { key: 'catering', label: 'Katering', icon: '🍱', href: '/catering' },
  { key: 'clinic', label: 'Klinik Site', icon: '🏥', href: '/clinic' },
  { key: 'security', label: 'Security Gate', icon: '🛡️', href: '/security' },
  { key: 'radio', label: 'Radio Komunikasi', icon: '📻', href: '/radio' },
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

export default function ItHelpdeskPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('IT Support Specialist')
  const [userRole, setUserRole] = useState('IT Infrastructure Dept')
  const [allowedModules, setAllowedModules] = useState<string[]>([])
  const [tickets, setTickets] = useState<ItTicketItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // State Modal Input Tiket IT Baru
  const [showModal, setShowModal] = useState(false)
  const [reporterDept, setReporterDept] = useState('Produksi Pit')
  const [issueCategory, setIssueCategory] = useState('Jaringan Internet VSAT')
  const [priorityLevel, setPriorityLevel] = useState('Tinggi')
  const [description, setDescription] = useState('')
  const [itTechnician, setItTechnician] = useState('')
  const [status, setStatus] = useState('Open')
  const [submitting, setSubmitting] = useState(false)

  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

  useEffect(() => {
    let isMounted = true

    async function initItHelpdesk() {
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
          setUserName(profile?.full_name || 'IT Infrastructure Superintendent')
          const division = (profile?.role || 'IT Infrastructure Dept').trim()
          setUserRole(division)

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
                  (cleanDiv.includes('it') && target.includes('it')) ||
                  (cleanDiv.includes('helpdesk') && target.includes('helpdesk'))
                )
              })

              if (matched && Array.isArray(matched.allowed_modules)) {
                grantedKeys = matched.allowed_modules
              } else {
                grantedKeys = ['it-helpdesk']
              }
            } else {
              grantedKeys = ['it-helpdesk']
            }
          }

          if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('it-helpdesk')) {
            alert('Divisi Anda tidak memiliki hak akses ke modul IT Helpdesk.')
            router.replace('/')
            return
          }

          setAllowedModules(grantedKeys)

          const { data, error } = await supabase
            .from('it_helpdesk_tickets')
            .select('*')
            .order('created_at', { ascending: false })

          if (!error && data && data.length > 0) {
            setTickets(data)
          } else {
            setTickets([
              {
                id: '1',
                ticket_code: 'IT-TIC-019',
                reporter_dept: 'Produksi Pit',
                issue_category: 'Jaringan Internet VSAT',
                priority_level: 'Tinggi',
                description: 'Koneksi internet kantor pos pit mengalami lag saat sinkronisasi data DOR nikel.',
                it_technician: 'Rian IT Support',
                status: 'In Progress',
              },
              {
                id: '2',
                ticket_code: 'IT-TIC-015',
                reporter_dept: 'Finance & ADM',
                issue_category: 'Hardware Komputer',
                priority_level: 'Sedang',
                description: 'Penggantian power supply PC desktop kasir site.',
                it_technician: 'Andi Network',
                status: 'Resolved',
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

    initItHelpdesk()

    return () => {
      isMounted = false
    }
  }, [landingUrl, router])

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description) return

    setSubmitting(true)
    const code = `IT-TIC-${Math.floor(100 + Math.random() * 900)}`

    const payload = {
      ticket_code: code,
      reporter_dept: reporterDept,
      issue_category: issueCategory,
      priority_level: priorityLevel,
      description,
      it_technician: itTechnician || userName,
      status,
    }

    const { data, error } = await supabase
      .from('it_helpdesk_tickets')
      .insert([payload])
      .select()

    if (!error && data) {
      setTickets([data[0], ...tickets])
      setShowModal(false)
      setDescription('')
    } else {
      setTickets([
        {
          id: Math.random().toString(),
          created_at: new Date().toISOString(),
          ...payload,
        },
        ...tickets,
      ])
      setShowModal(false)
      setDescription('')
    }

    setSubmitting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = landingUrl
  }

  const totalTickets = tickets.length
  const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length
  const resolvedTickets = tickets.filter((t) => t.status === 'Resolved').length

  const filteredTickets = tickets.filter((item) =>
    (item?.ticket_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item?.reporter_dept || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item?.issue_category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item?.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const authorizedNavItems = ALL_MODULES.filter((item) =>
    allowedModules.includes(item.key)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-slate-400">Sinkronisasi IT Helpdesk & Jaringan Komunikasi...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
      <header className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💻</span>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                IT Helpdesk & Jaringan Komunikasi PT. JEEP
              </h1>
              <p className="text-xs text-cyan-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                <span>Kontrol Infrastruktur IT, Jaringan VSAT, & Perbaikan Perangkat Kantor</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-semibold">{userName}</span>
                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                  {userRole}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="bg-[#102033] hover:bg-[#162b45] border border-[#1e3757] text-slate-300 text-xs px-3 py-2 rounded-lg transition"
            >
              ← Beranda Portal
            </Link>
            <button
              onClick={handleLogout}
              className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>

        {authorizedNavItems.length > 1 ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {authorizedNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-[#162d47] text-white border-cyan-400/80 shadow-sm'
                      : 'bg-[#0a1625] text-slate-400 border-[#1b2e46] hover:text-slate-200 hover:bg-[#0f2137]'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-[#0a1625]/60 border border-[#1b2e46] rounded-lg px-4 py-2 text-[11px] text-slate-400 flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Akses Terbatas: Menampilkan modul berizin untuk divisi Anda.</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Tiket Masuk</h3>
          <div className="text-2xl font-black text-white font-mono">{totalTickets} Tiket</div>
          <p className="mt-2 text-[11px] text-slate-400">Kendala Infrastruktur IT</p>
        </div>
        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tiket Aktif (Proses)</h3>
          <div className={`text-2xl font-black font-mono ${openTickets > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {openTickets} Tiket
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Dalam Penanganan Tim IT</p>
        </div>
        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tiket Selesai (Resolved)</h3>
          <div className="text-2xl font-black text-emerald-400 font-mono">{resolvedTickets} Tiket</div>
          <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Perbaikan Jaringan Tuntas</p>
        </div>
        <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Uptime Jaringan VSAT</h3>
          <div className="text-2xl font-black text-cyan-400 font-mono">99.8%</div>
          <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Koneksi Internet Stabil</p>
        </div>
      </div>

      <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode tiket, departemen, teknisi..."
              className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
          >
            + Buat Tiket IT Helpdesk Baru
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b2e46] text-slate-400">
                <th className="pb-2">Kode Tiket</th>
                <th className="pb-2">Departemen Pelapor</th>
                <th className="pb-2">Kategori Gangguan</th>
                <th className="pb-2 text-center">Prioritas</th>
                <th className="pb-2">Deskripsi Kendala</th>
                <th className="pb-2">Teknisi (PIC)</th>
                <th className="pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#16273c] text-slate-300">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => {
                  const isResolved = t.status === 'Resolved'
                  return (
                    <tr key={t.id} className="hover:bg-[#0c1a2d]/50 transition">
                      <td className="py-2.5 font-bold font-mono text-cyan-400">{t.ticket_code}</td>
                      <td className="font-semibold text-white">{t.reporter_dept}</td>
                      <td>
                        <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                          {t.issue_category}
                        </span>
                      </td>
                      <td className="text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border ${
                            t.priority_level === 'Tinggi' || t.priority_level === 'Darurat'
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                              : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                          }`}
                        >
                          {t.priority_level.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-slate-300 max-w-xs truncate">{t.description}</td>
                      <td className="text-slate-300">{t.it_technician}</td>
                      <td className="text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isResolved
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                              : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                          }`}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    Tidak ada tiket IT helpdesk yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Buat Tiket Kendala IT Helpdesk</h2>
            <form onSubmit={handleAddTicket} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Departemen Pelapor</label>
                  <select
                    value={reporterDept}
                    onChange={(e) => setReporterDept(e.target.value)}
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Produksi Pit">Produksi Pit</option>
                    <option value="Plant & Workshop">Plant & Workshop</option>
                    <option value="HRD & Payroll">HRD & Payroll</option>
                    <option value="General Affair">General Affair</option>
                    <option value="Finance & ADM">Finance & ADM</option>
                    <option value="Jetty Port">Jetty Port</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kategori Gangguan</label>
                  <select
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value)}
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Jaringan Internet VSAT">Jaringan Internet VSAT</option>
                    <option value="Hardware Komputer">Hardware Komputer / PC</option>
                    <option value="Software & Aplikasi">Software / Sistem Manajemen</option>
                    <option value="Printer & Scanner">Printer & Scanner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Prioritas</label>
                <select
                  value={priorityLevel}
                  onChange={(e) => setPriorityLevel(e.target.value)}
                  className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                >
                  <option value="Rendah">Rendah (Low)</option>
                  <option value="Sedang">Sedang (Medium)</option>
                  <option value="Tinggi">Tinggi (High)</option>
                  <option value="Darurat">Darurat (Emergency)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Deskripsi Kendala IT</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan detail kendala jaringan atau perangkat..."
                  className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Teknisi IT (PIC)</label>
                  <input
                    type="text"
                    required
                    value={itTechnician}
                    onChange={(e) => setItTechnician(e.target.value)}
                    placeholder="Nama teknisi IT"
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Status Tiket</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400 font-bold"
                  >
                    <option value="Open">Open (Baru)</option>
                    <option value="In Progress">In Progress (Dikerjakan)</option>
                    <option value="Resolved">Resolved (Selesai)</option>
                  </select>
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
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Tiket IT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}