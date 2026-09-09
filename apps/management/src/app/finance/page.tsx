'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import NavigationHeader from '../../components/NavigationHeader'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Transaction {
    id: string
    created_at?: string
    date: string
    description: string
    amount: number
    category: string
    transaction_type?: string
    payment_method?: string
}

export default function FinanceDashboard() {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas Keuangan')
    const [transactions, setTransactions] = useState<Transaction[]>([])

    // Modal Input Kas
    const [showModal, setShowModal] = useState(false)
    const [txType, setTxType] = useState('expense')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('BBM Solar Pit')
    const [paymentMethod, setPaymentMethod] = useState('Transfer Bank')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initFinance() {
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
                    setUserName(profile?.full_name || 'Finance Controller Site')

                    const { data: txData, error } = await supabase
                        .from('finance_transactions')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && txData && txData.length > 0) {
                        setTransactions(txData)
                    } else {
                        setTransactions([
                            {
                                id: '1',
                                date: '2026-09-09',
                                description: 'Pembelian Solar Industri 10.000 L',
                                amount: 145000000,
                                category: 'BBM Solar Pit',
                                transaction_type: 'expense',
                                payment_method: 'Transfer Bank',
                            },
                            {
                                id: '2',
                                date: '2026-09-08',
                                description: 'Droping Dana Kas Operasional Kantor Site',
                                amount: 50000000,
                                category: 'Dropping Kas Pusat',
                                transaction_type: 'income',
                                payment_method: 'Transfer Bank',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error in Finance init:', err)
                if (isMounted) setLoading(false)
            }
        }

        initFinance()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    // Kalkulasi Ringkasan Kas
    const totalExpense = transactions
        .filter((t) => (t.transaction_type || 'expense') === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    const totalIncome = transactions
        .filter((t) => t.transaction_type === 'income')
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    const balance = totalIncome - totalExpense

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description || !amount) return

        setSubmitting(true)

        const payload = {
            description,
            amount: parseFloat(amount),
            category,
            transaction_type: txType,
            payment_method: paymentMethod,
            date: new Date().toISOString().slice(0, 10),
        }

        const { data, error } = await supabase
            .from('finance_transactions')
            .insert([payload])
            .select()

        if (!error && data) {
            setTransactions([data[0], ...transactions])
            setShowModal(false)
            setDescription('')
            setAmount('')
        } else {
            alert('Gagal mencatat transaksi kas: ' + (error?.message || 'Terjadi kesalahan sistem'))
        }

        setSubmitting(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Kas & Keuangan Site...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Global */}
            <NavigationHeader
                title="Pusat Manajemen Kas & Finansial Site"
                subtitle="Arus Kas Operasional Tambang & Pengawasan Anggaran"
                userName={userName}
                roleBadge="Finance & Accounting"
                accentColor="emerald"
            />

            {/* Metrik Keuangan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pengeluaran Kas (Expense)</h3>
                    <div className="text-2xl font-black text-rose-400">
                        Rp {totalExpense.toLocaleString('id-ID')}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Termasuk Solar, Sparepart, & Operasional</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dropping Dana Masuk (Income)</h3>
                    <div className="text-2xl font-black text-emerald-400">
                        Rp {totalIncome.toLocaleString('id-ID')}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Dari Rekening Pusat PT. JEEP</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimasi Saldo Kas Lapangan</h3>
                    <div className={`text-2xl font-black ${balance >= 0 ? 'text-white' : 'text-amber-400'}`}>
                        Rp {balance.toLocaleString('id-ID')}
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Rekonsiliasi Real-Time Aktif</p>
                </div>
            </div>

            {/* Grid Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Action Bar */}
                <aside className="lg:col-span-3 space-y-3">
                    <div
                        onClick={() => setShowModal(true)}
                        className="p-4 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 cursor-pointer transition flex items-center gap-3"
                    >
                        <span className="text-xl">➕</span>
                        <div>
                            <div className="text-xs font-bold">Catat Transaksi Kas</div>
                            <div className="text-[10px] text-slate-400">Pengeluaran atau Dana Masuk</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#16273c] bg-[#0a1625] text-slate-400 space-y-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Status Ledger</span>
                        <div className="text-[11px] flex justify-between">
                            <span>Tabel Supabase</span>
                            <span className="text-emerald-400 font-semibold">finance_transactions</span>
                        </div>
                        <div className="text-[11px] flex justify-between">
                            <span>Total Transaksi</span>
                            <span className="text-slate-200 font-bold">{transactions.length} entri</span>
                        </div>
                    </div>
                </aside>

                {/* Kolom Kanan: Tabel Buku Kas */}
                <main className="lg:col-span-9 space-y-6">
                    <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Buku Kas Operasional Lapangan (Live Supabase)
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                                + Transaksi Baru
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#1b2e46] text-slate-400">
                                        <th className="pb-2">Tanggal</th>
                                        <th className="pb-2">Keterangan Transaksi</th>
                                        <th className="pb-2">Kategori Biaya</th>
                                        <th className="pb-2">Metode</th>
                                        <th className="pb-2 text-right">Nominal (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#16273c] text-slate-300">
                                    {transactions.map((t) => {
                                        const isExp = (t.transaction_type || 'expense') === 'expense'
                                        return (
                                            <tr key={t.id}>
                                                <td className="py-2.5 font-mono text-slate-400">{t.date || 'Hari ini'}</td>
                                                <td className="font-semibold text-white">{t.description}</td>
                                                <td>
                                                    <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                        {t.category}
                                                    </span>
                                                </td>
                                                <td className="text-slate-400">{t.payment_method || 'Kas'}</td>
                                                <td className={`font-mono font-bold text-right ${isExp ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {isExp ? '- ' : '+ '}
                                                    Rp {Number(t.amount || 0).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Input Transaksi */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pencatatan Kas Keuangan Site</h2>
                        <form onSubmit={handleAddTransaction} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Tipe Transaksi</label>
                                <select
                                    value={txType}
                                    onChange={(e) => setTxType(e.target.value)}
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                >
                                    <option value="expense">Pengeluaran Kas Site (Expense)</option>
                                    <option value="income">Penerimaan / Dropping Kas (Income)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Perihal / Keterangan</label>
                                <input
                                    type="text"
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Contoh: Pengisian Solar Genset Camp"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nominal (Rupiah)</label>
                                <input
                                    type="number"
                                    step="1"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Contoh: 15000000"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori Biaya</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                    >
                                        <option value="BBM Solar Pit">BBM Solar Pit</option>
                                        <option value="Sewa Alat & Hauler">Sewa Alat & Hauler</option>
                                        <option value="Sparepart & Bengkel">Sparepart & Bengkel</option>
                                        <option value="Logistik Mess & Dapur">Logistik Mess & Dapur</option>
                                        <option value="K3 & Safety APD">K3 & Safety APD</option>
                                        <option value="Dropping Kas Pusat">Dropping Kas Pusat</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Metode Pembayaran</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                    >
                                        <option value="Transfer Bank">Transfer Bank</option>
                                        <option value="Kas Tunai Lapangan">Kas Tunai Lapangan</option>
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
                                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition cursor-pointer"
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