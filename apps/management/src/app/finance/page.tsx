'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Transaction {
    id: string
    created_at: string
    description: string
    amount: number
    transaction_type?: string
    category: string
    status?: string
}

export default function FinanceDashboard() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('User Finance')
    const [userId, setUserId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('ringkasan')
    const [transactions, setTransactions] = useState<Transaction[]>([])

    // Modal Input Transaksi Baru
    const [showModal, setShowModal] = useState(false)
    const [newDesc, setNewDesc] = useState('')
    const [newAmount, setNewAmount] = useState('')
    const [newCategory, setNewCategory] = useState('BBM & Pelumas')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function initFinance() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                setUserId(session.user.id)

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

                setUserName(profile.full_name || 'Finance Officer')

                // Tarik data transaksi riil dari Supabase
                const { data: trxData, error: trxErr } = await supabase
                    .from('finance_transactions')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (!trxErr && trxData) {
                    setTransactions(trxData)
                }

                setLoading(false)
            } catch (err) {
                console.error('Error init finance:', err)
                setLoading(false)
            }
        }

        initFinance()
    }, [landingUrl])

    // Simpan Transaksi Baru ke Supabase
    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newDesc || !newAmount) return

        setSubmitting(true)

        // Sertakan transaction_type ('expense') agar memenuhi constraint NOT NULL
        const payload: Record<string, any> = {
            description: newDesc,
            amount: parseFloat(newAmount),
            category: newCategory,
            transaction_type: 'expense',
        }

        if (userId) {
            payload.user_id = userId
        }

        const { data, error } = await supabase
            .from('finance_transactions')
            .insert([payload])
            .select()

        if (!error && data) {
            setTransactions([data[0], ...transactions])
            setShowModal(false)
            setNewDesc('')
            setNewAmount('')
        } else {
            alert('Gagal menyimpan transaksi: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }
        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Database Finance...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Bar */}
            <header className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 mb-6 shadow-xl">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">⚓</span>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                            Dashboard Keuangan PT. Jangkar Energi Eka Perkasa
                        </h1>
                        <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Sync Site Operasional Tambang • {userName} (Finance)
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                    Keluar ke Beranda
                </button>
            </header>

            {/* Nav Tabs */}
            <nav className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'ringkasan', label: 'RINGKASAN EKSEKUTIF' },
                    { id: 'transaksi', label: 'LOG TRANSAKSI REAL-TIME', badge: `${transactions.length} DATA` },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${activeTab === tab.id
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
                {/* Kolom Kiri: Action Bar */}
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-sky-500/50 bg-sky-950/20 hover:bg-sky-900/30 text-sky-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Catat Pengeluaran Baru</div>
                            <div className="text-[10px] text-slate-400">BBM, Vendor, atau Operasional</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#16273c] bg-[#0a1625] text-slate-400 space-y-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Status Database</span>
                        <div className="text-[11px] flex justify-between">
                            <span>Koneksi RLS</span>
                            <span className="text-emerald-400 font-semibold">Tersambung</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Total Transaksi</span>
                            <span className="text-slate-200 font-bold">{transactions.length} baris</span>
                        </div>
                    </div>
                </aside>

                {/* Kolom Kanan: Tabel Log */}
                <main className="lg:col-span-9 space-y-6">
                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Log Transaksi Keuangan Site (Live Supabase)
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                                + Tambah
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">Keterangan</th>
                                        <th className="pb-2">Kategori</th>
                                        <th className="pb-2">Jumlah</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {transactions.length > 0 ? (
                                        transactions.map((trx) => (
                                            <tr key={trx.id}>
                                                <td className="py-2.5 text-white font-medium">{trx.description}</td>
                                                <td>
                                                    <span className="bg-sky-950/60 border border-sky-800/40 text-sky-400 px-2 py-0.5 rounded text-[10px]">
                                                        {trx.category || 'Operasional'}
                                                    </span>
                                                </td>
                                                <td className="font-semibold text-amber-400">
                                                    Rp {Number(trx.amount || 0).toLocaleString('id-ID')}
                                                </td>
                                                <td>
                                                    <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
                                                        {trx.status || 'Lunas'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                                                Belum ada transaksi di database. Klik tombol "+ Tambah" di atas untuk membuat transaksi pertama.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Form Tambah Transaksi */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Transaksi Pengeluaran Site</h2>
                        <form onSubmit={handleAddTransaction} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Keterangan / Keperluan</label>
                                <input
                                    type="text"
                                    required
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Contoh: Pembelian Solar Dexlite 500L"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nominal (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    placeholder="Contoh: 15000000"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Kategori</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-sky-400"
                                >
                                    <option value="BBM & Pelumas">BBM & Pelumas</option>
                                    <option value="Pembayaran Vendor">Pembayaran Vendor</option>
                                    <option value="Sparepart & Maintenance">Sparepart & Maintenance</option>
                                    <option value="Operasional Pit">Operasional Pit</option>
                                </select>
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}