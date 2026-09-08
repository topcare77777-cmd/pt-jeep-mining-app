'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface DocumentLog {
    id: string
    created_at: string
    agenda_no: string
    title: string
    sender: string
    category: string
    status: string
}

export default function AdmDashboard() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas ADM')
    const [activeTab, setActiveTab] = useState('surat')
    const [documents, setDocuments] = useState<DocumentLog[]>([])

    // Modal Input Dokumen Baru
    const [showModal, setShowModal] = useState(false)
    const [agendaNo, setAgendaNo] = useState('')
    const [title, setTitle] = useState('')
    const [sender, setSender] = useState('')
    const [category, setCategory] = useState('Surat Jalan')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function initAdm() {
            try {
                // 1. Proteksi Sesi Supabase
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                // 2. Verifikasi Profil
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, status')
                    .eq('id', session.user.id)
                    .single()

                if (!profile || profile.status !== 'Aktif') {
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                setUserName(profile.full_name || 'Petugas ADM')

                // 3. Ambil data dokumen dari tabel adm_documents jika ada
                const { data: docData } = await supabase
                    .from('adm_documents')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (docData && docData.length > 0) {
                    setDocuments(docData)
                } else {
                    // Data cadangan lokal jika tabel belum di-migrate
                    setDocuments([
                        {
                            id: '1',
                            created_at: new Date().toISOString(),
                            agenda_no: 'ADM/2026/09/012',
                            title: 'Surat Jalan Pengiriman Solar 16.000L',
                            sender: 'PT Solar Pasifik',
                            category: 'Surat Jalan',
                            status: 'Tervalidasi',
                        },
                        {
                            id: '2',
                            created_at: new Date().toISOString(),
                            agenda_no: 'ADM/2026/09/011',
                            title: 'Permohonan Izin Masuk Pit (SIMP Site)',
                            sender: 'PT United Tractors',
                            category: 'SIMP',
                            status: 'Diproses K3',
                        },
                    ])
                }

                setLoading(false)
            } catch (err) {
                console.error('Error in ADM init:', err)
                setLoading(false)
            }
        }

        initAdm()
    }, [landingUrl])

    // Submit Dokumen Baru
    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !sender) return

        setSubmitting(true)
        const generatedNo = agendaNo || `ADM/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`

        const newDoc: DocumentLog = {
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            agenda_no: generatedNo,
            title,
            sender,
            category,
            status: 'Tercatat',
        }

        // Coba simpan ke Supabase jika tabel sudah ada
        const { data, error } = await supabase
            .from('adm_documents')
            .insert([newDoc])
            .select()

        if (!error && data) {
            setDocuments([data[0], ...documents])
        } else {
            // Fallback state lokal
            setDocuments([newDoc, ...documents])
        }

        setShowModal(false)
        setTitle('')
        setSender('')
        setAgendaNo('')
        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Dokumen ADM...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Bar */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 mb-6 shadow-xl">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">📋</span>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                            Dashboard Administrasi (ADM) PT. JEEP
                        </h1>
                        <p className="text-xs text-sky-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                            Live Sync Dokumen & Surat Jalan • {userName}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition"
                >
                    Keluar ke Beranda
                </button>
            </header>

            {/* Nav Tabs Atas */}
            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'surat', label: 'SURAT MASUK & KELUAR', badge: `${documents.length} DOKUMEN` },
                    { id: 'suratjalan', label: 'SURAT JALAN & RITASE', badge: '' },
                    { id: 'po', label: 'PURCHASE ORDER (PO)', badge: '' },
                    { id: 'simp', label: 'BUKU TAMU & SIMP', badge: '' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${activeTab === tab.id
                                ? 'bg-[#1b3b5f] border-sky-400 text-white shadow-lg shadow-sky-950/50'
                                : 'bg-[#0c1a2d] border-[#1b2e46] text-slate-400 hover:text-white hover:bg-[#12243d]'
                            }`}
                    >
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded font-black">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Konten Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Tombol Aksi Cepat */}
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-sky-500/50 bg-sky-950/20 hover:bg-sky-900/30 text-sky-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Catat Dokumen Baru</div>
                            <div className="text-[10px] text-slate-400">Surat Jalan, Memo, atau SIMP</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#16273c] bg-[#0a1625] text-slate-400 space-y-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Status Berkas</span>
                        <div className="text-[11px] flex justify-between">
                            <span>Total Terarsip</span>
                            <span className="text-slate-200">{documents.length} berkas</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Portal Terhubung</span>
                            <span className="text-emerald-400 font-semibold">Aktif</span>
                        </div>
                    </div>
                </aside>

                {/* Kolom Kanan: Tabel Log Dokumen */}
                <main className="lg:col-span-9 space-y-6">
                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Log Surat & Berkas Masuk Lapangan
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                            >
                                + Dokumen Baru
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">No. Agenda</th>
                                        <th className="pb-2">Perihal / Berkas</th>
                                        <th className="pb-2">Pengirim / Pihak Luar</th>
                                        <th className="pb-2">Kategori</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {documents.map((doc) => (
                                        <tr key={doc.id}>
                                            <td className="py-2.5 font-mono text-[11px] text-sky-400">{doc.agenda_no}</td>
                                            <td className="font-semibold text-white">{doc.title}</td>
                                            <td className="text-slate-400">{doc.sender}</td>
                                            <td>
                                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                    {doc.category}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
                                                    {doc.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Input Dokumen */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Dokumen / Surat Masuk</h2>
                        <form onSubmit={handleAddDocument} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nomor Agenda (Opsional)</label>
                                <input
                                    type="text"
                                    value={agendaNo}
                                    onChange={(e) => setAgendaNo(e.target.value)}
                                    placeholder="Otomatis jika kosong"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Perihal Dokumen / Surat</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Contoh: Surat Jalan Batubara Ritase 4"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Pengirim / Vendor / Divisi</label>
                                <input
                                    type="text"
                                    required
                                    value={sender}
                                    onChange={(e) => setSender(e.target.value)}
                                    placeholder="Contoh: PT Surya Jaya Transport"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Kategori Dokumen</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                >
                                    <option value="Surat Jalan">Surat Jalan (Delivery Order)</option>
                                    <option value="SIMP">Izin Masuk Site (SIMP)</option>
                                    <option value="Surat Dinas">Surat Masuk / Memo Internal</option>
                                    <option value="PO & Invoice">PO & Administrasi Vendor</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-[#1b2e46] text-slate-400 hover:text-white text-xs transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs transition"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Berkas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}