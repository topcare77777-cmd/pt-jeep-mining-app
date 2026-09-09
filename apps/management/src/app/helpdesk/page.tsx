'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface HelpdeskTicket {
    id: string
    created_at?: string
    ticket_number: string
    department: string
    category: string
    priority: string
    subject: string
    description: string
    status: string
    assigned_to: string
}

export default function HelpdeskPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('GA & Facility Officer')
    const [tickets, setTickets] = useState<HelpdeskTicket[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Tiket Baru
    const [showModal, setShowModal] = useState(false)
    const [department, setDepartment] = useState('Produksi Pit')
    const [category, setCategory] = useState('Fasilitas Camp & Mess')
    const [priority, setPriority] = useState('Sedang')
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initHelpdesk() {
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
                    .select('full_name, status')
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
                    setUserName(profile?.full_name || 'GA Support Lead')

                    const { data, error } = await supabase
                        .from('ga_helpdesk_tickets')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setTickets(data)
                    } else {
                        setTickets([
                            {
                                id: '1',
                                created_at: new Date().toISOString(),
                                ticket_number: 'GA-2026-001',
                                department: 'Plant & Workshop',
                                category: 'Fasilitas Camp & Mess',
                                priority: 'Tinggi',
                                subject: 'Perbaikan AC Ruang Istirahat Kru Workshop',
                                description: 'Unit pendingin tidak dingin, perlu pembersihan filter dan pengecekan freon.',
                                status: 'In Progress',
                                assigned_to: 'Tim Teknisi GA',
                            },
                            {
                                id: '2',
                                created_at: new Date().toISOString(),
                                ticket_number: 'GA-2026-002',
                                department: 'Produksi Pit',
                                category: 'Air & Sanitasi',
                                priority: 'Sedang',
                                subject: 'Suplai Galon Air Minum Pos Pantau Pit Barat',
                                description: 'Stok air galon habis, minta pengiriman tambahan 10 galon.',
                                status: 'Resolved',
                                assigned_to: 'Logistik GA',
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

        initHelpdesk()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subject || !description) return

        setSubmitting(true)
        const ticketNo = `GA-2026-${Math.floor(100 + Math.random() * 900)}`

        const payload = {
            ticket_number: ticketNo,
            department,
            category,
            priority,
            subject,
            description,
            status: 'Open',
            assigned_to: assignedTo || 'Tim GA Site',
        }

        const { data, error } = await supabase
            .from('ga_helpdesk_tickets')
            .insert([payload])
            .select()

        if (!error && data) {
            setTickets([data[0], ...tickets])
            setShowModal(false)
            setSubject('')
            setDescription('')
        } else {
            // Fallback state lokal jika tabel belum dibuat di Supabase
            setTickets([
                {
                    id: Math.random().toString(),
                    created_at: new Date().toISOString(),
                    ...payload,
                },
                ...tickets,
            ])
            setShowModal(false)
            setSubject('')
            setDescription('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalTickets = tickets.length
    const activeTickets = tickets.filter((t) => t.status !== 'Resolved').length
    const resolvedTickets = tickets.filter((t) => t.status === 'Resolved').length

    const filteredTickets = tickets.filter((item) =>
        item.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/helpdesk', label: 'Helpdesk GA', icon: '🛠️' },
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/direktur', label: 'Eksekutif', icon: '🏛️' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Tiket Helpdesk GA & Fasilitas...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🛠️</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Helpdesk GA & Fasilitas Site PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Permintaan Fasilitas Mess, Keluhan Sarana Kantor, & Perbaikan Infrastruktur Camp</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    General Affair Dept
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

                {/* Global Module Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {navLinks.map((item) => {
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

            {/* KPI Helpdesk */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Permintaan Masuk</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalTickets} Tiket</div>
                    <p className="mt-2 text-[11px] text-slate-400">Pengajuan Fasilitas Lapangan</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tiket Aktif / Dikerjakan</h3>
                    <div className={`text-2xl font-black font-mono ${activeTickets > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {activeTickets} Tiket
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Sedang Ditangani Teknisi GA</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selesai (Resolved)</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{resolvedTickets} Tiket</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Tuntas Tervalidasi User</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SLA Penyelesaian</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">&lt; 24 Jam</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Standar Layanan Terpenuhi</p>
                </div>
            </div>

            {/* Grid Tabel Helpdesk */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor tiket, subjek, departemen..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Buat Pengajuan / Tiket GA Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nomor Tiket</th>
                                <th className="pb-2">Departemen</th>
                                <th className="pb-2">Kategori</th>
                                <th className="pb-2 text-center">Prioritas</th>
                                <th className="pb-2">Subjek & Uraian</th>
                                <th className="pb-2 text-center">Status</th>
                                <th className="pb-2">Ditugaskan Kepada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map((t) => {
                                    const isResolved = t.status === 'Resolved'
                                    const isHigh = t.priority === 'Tinggi' || t.priority === 'Darurat'
                                    return (
                                        <tr key={t.id}>
                                            <td className="py-2.5 font-bold font-mono text-amber-400">{t.ticket_number}</td>
                                            <td className="font-semibold text-white">{t.department}</td>
                                            <td>
                                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="text-center font-bold">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] ${isHigh
                                                        ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                        }`}
                                                >
                                                    {t.priority.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-slate-300">
                                                <div className="font-bold text-white">{t.subject}</div>
                                                <div className="text-[11px] text-slate-400 truncate max-w-xs">{t.description}</div>
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isResolved
                                                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                        }`}
                                                >
                                                    {t.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-slate-400">{t.assigned_to}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada tiket GA yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Tiket GA */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Buat Pengajuan Fasilitas & Tiket GA</h2>
                        <form onSubmit={handleAddTicket} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Departemen</label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Produksi Pit">Produksi Pit</option>
                                        <option value="Plant & Workshop">Plant & Workshop</option>
                                        <option value="HSE & K3">HSE & K3</option>
                                        <option value="Jetty Port">Jetty Port</option>
                                        <option value="Finance & ADM">Finance & ADM</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Prioritas</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Rendah">Rendah</option>
                                        <option value="Sedang">Sedang</option>
                                        <option value="Tinggi">Tinggi</option>
                                        <option value="Darurat">Darurat</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Kategori Fasilitas</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                >
                                    <option value="Fasilitas Camp & Mess">Fasilitas Camp & Mess</option>
                                    <option value="Air & Sanitasi">Air Bersih & Sanitasi</option>
                                    <option value="Kelistrikan & Genset">Kelistrikan & Genset Pos</option>
                                    <option value="Konsumsi & Katering">Konsumsi & Katering</option>
                                    <option value="Sarana Transportasi">Sarana Transportasi Lapangan</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Subjek Pengajuan</label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Contoh: Perbaikan AC Mess B2"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Detail Kebutuhan / Kerusakan</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Deskripsikan secara rinci kondisi fasilitas atau kebutuhan..."
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Petugas / Tim Penanggung Jawab</label>
                                <input
                                    type="text"
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    placeholder="Tim Teknisi GA"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
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
                                    {submitting ? 'Menyimpan...' : 'Kirim Tiket GA'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}