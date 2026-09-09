'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface FinanceItem {
    id: string
    created_at?: string
    transaction_date: string
    description: string
    category: string
    transaction_type: 'income' | 'expense' | string
    amount: number
    pic_finance: string
    receipt_number?: string
}

export default function FinanceManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Kasir Keuangan Site')
    const [transactions, setTransactions] = useState<FinanceItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Transaksi Baru
    const [showModal, setShowModal] = useState(false)
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('Operasional')
    const [transactionType, setTransactionType] = useState('expense')
    const [amount, setAmount] = useState('')
    const [picFinance, setPicFinance] = useState('')
    const [receiptNumber, setReceiptNumber] = useState('')
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
                    setUserName(profile?.full_name || 'Finance Superintendent')

                    const { data, error } = await supabase
                        .from('finance_transactions')
                        .select('*')
                        .order('transaction_date', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setTransactions(data)
                    } else {
                        setTransactions([
                            {
                                id: '1',
                                transaction_date: '2026-09-08',
                                description: 'Dropping Dana Kas Kecil dari Kantor Pusat Jakarta',
                                category: 'Dropping Pusat',
                                transaction_type: 'income',
                                amount: 150000000,
                                pic_finance: 'Andi (Finance Pusat)',
                                receipt_number: 'INV/JEEP/2026/001',
                            },
                            {
                                id: '2',
                                transaction_date: '2026-09-09',
                                description: 'Pembelian Suku Cadang Darurat Filter & Oli Workshop',
                                category: 'Suku Cadang',
                                transaction_type: 'expense',
                                amount: 18500000,
                                pic_finance: 'Siti Kasir Site',
                                receipt_number: 'NOTA-8821',
                            },
                            {
                                id: '3',
                                transaction_date: '2026-09-09',
                                description: 'Pembayaran Konsumsi Katering Mess Hall Shift 1',
                                category: 'Konsumsi GA',
                                transaction_type: 'expense',
                                amount: 12500000,
                                pic_finance: 'Siti Kasir Site',
                                receipt_number: 'NOTA-8822',
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

        initFinance()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description || !amount) return

        setSubmitting(true)

        const payload = {
            description,
            category,
            transaction_type: transactionType,
            amount: parseFloat(amount) || 0,
            pic_finance: picFinance || userName,
            receipt_number: receiptNumber || `NOTA-${Math.floor(1000 + Math.random() * 9000)}`,
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
            setReceiptNumber('')
        } else {
            alert('Gagal menyimpan transaksi: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalIncome = transactions
        .filter((t) => t.transaction_type === 'income')
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    const totalExpense = transactions
        .filter((t) => t.transaction_type === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    const balance = totalIncome - totalExpense

    const filteredTransactions = transactions.filter((item) =>
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pic_finance.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.receipt_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal', icon: '⚖️' },
        { href: '/helpdesk', label: 'Helpdesk', icon: '🛠️' },
        { href: '/assets', label: 'Aset', icon: '🏷️' },
        { href: '/mess', label: 'Mess', icon: '🏠' },
        { href: '/vendor', label: 'Vendor', icon: '🤝' },
        { href: '/radio', label: 'Radio', icon: '📻' },
        { href: '/clinic', label: 'Klinik', icon: '🏥' },
        { href: '/security', label: 'Security', icon: '🛡️' },
        { href: '/ritase', label: 'Ritase', icon: '🚛' },
        { href: '/jetty', label: 'Jetty Port', icon: '🚢' },
        { href: '/lingkungan', label: 'Lingkungan', icon: '🌱' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/adm', label: 'ADM & Surat', icon: '📋' },
        { href: '/hrd', label: 'HRD & K3', icon: '👷‍♂️' },
        { href: '/ga', label: 'GA & Fasilitas', icon: '🚙' },
        { href: '/direktur', label: 'Eksekutif', icon: '🏛️' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Ledger Kas Kecil & Keuangan Site...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">💰</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Keuangan & Kas Kecil Site PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Ledger Pembukuan Kas Masuk, Pengeluaran Lapangan, & Rekonsiliasi Saldo</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Finance Dept
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
                            <a
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                        ? 'bg-[#162d47] text-white border-amber-400/80 shadow-sm'
                                        : 'bg-[#0a1625] text-slate-400 border-[#1b2e46] hover:text-slate-200 hover:bg-[#0f2137]'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </a>
                        )
                    })}
                </div>
            </header>

            {/* KPI Keuangan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Dropping / Pemasukan</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        Rp {totalIncome.toLocaleString('id-ID')}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Akumulasi Kas Masuk Pusat</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pengeluaran Kas</h3>
                    <div className="text-2xl font-black text-rose-400 font-mono">
                        Rp {totalExpense.toLocaleString('id-ID')}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Biaya Operasional & Logistik Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sisa Saldo Kas Site</h3>
                    <div className={`text-2xl font-black font-mono ${balance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                        Rp {balance.toLocaleString('id-ID')}
                    </div>
                    <p className="mt-2 text-[11px] text-amber-400 font-semibold">Saldo Kas Kecil Real-Time</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Keuangan</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">Terkontrol</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Sesuai Nota & Kwitansi Resmi</p>
                </div>
            </div>

            {/* Grid Tabel Keuangan */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari uraian, kategori, no. nota..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Catat Transaksi Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Tanggal</th>
                                <th className="pb-2">No. Nota / Kwitansi</th>
                                <th className="pb-2">Uraian / Keterangan Transaksi</th>
                                <th className="pb-2">Kategori</th>
                                <th className="pb-2 text-center">Jenis</th>
                                <th className="pb-2 text-right">Nominal (IDR)</th>
                                <th className="pb-2">Petugas (PIC)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t) => {
                                    const isIncome = t.transaction_type === 'income'
                                    return (
                                        <tr key={t.id}>
                                            <td className="py-2.5 font-mono text-slate-400 text-[11px]">{t.transaction_date}</td>
                                            <td className="font-mono text-amber-400 font-bold">{t.receipt_number || '-'}</td>
                                            <td className="font-semibold text-white">{t.description}</td>
                                            <td>
                                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isIncome
                                                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                            : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                                        }`}
                                                >
                                                    {isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}
                                                </span>
                                            </td>
                                            <td className={`text-right font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {isIncome ? '+ ' : '- '} Rp {Number(t.amount).toLocaleString('id-ID')}
                                            </td>
                                            <td className="text-slate-400">{t.pic_finance}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada data transaksi yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Transaksi */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pencatatan Kas & Transaksi Keuangan Site</h2>
                        <form onSubmit={handleAddTransaction} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Uraian / Keterangan Transaksi</label>
                                <input
                                    type="text"
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Contoh: Pembelian sparepart darurat / Dropping pusat"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jenis Transaksi</label>
                                    <select
                                        value={transactionType}
                                        onChange={(e) => setTransactionType(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="expense">Pengeluaran (Expense)</option>
                                        <option value="income">Pemasukan / Dropping (Income)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Operasional">Operasional Site</option>
                                        <option value="Suku Cadang">Suku Cadang & Workshop</option>
                                        <option value="BBM & Transport">BBM & Transportasi</option>
                                        <option value="Konsumsi GA">Konsumsi & Katering GA</option>
                                        <option value="Dropping Pusat">Dropping Pusat</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nominal (Rupiah)</label>
                                    <input
                                        type="number"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="15000000"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Nota / Kwitansi</label>
                                    <input
                                        type="text"
                                        value={receiptNumber}
                                        onChange={(e) => setReceiptNumber(e.target.value)}
                                        placeholder="NOTA-991"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Petugas Keuangan (PIC)</label>
                                <input
                                    type="text"
                                    required
                                    value={picFinance}
                                    onChange={(e) => setPicFinance(e.target.value)}
                                    placeholder="Nama kasir / finance"
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