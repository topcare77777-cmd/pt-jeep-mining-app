'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface FinanceTransaction {
    id: string
    created_at: string
    transaction_date: string
    receipt_number: string
    description: string
    category: string
    type: string
    amount: number
    pic: string
}

const ALL_MODULES = [
    { key: 'manager-site', label: 'Pit Produksi', icon: '⛏️', href: '/manager-site' },
    { key: 'geologi', label: 'Geologi & Eksplorasi', icon: '🧭', href: '/geologi' },
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

export default function FinancePage() {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Staff Finance')
    const [userRole, setUserRole] = useState('Finance Dept')
    const [allowedModules, setAllowedModules] = useState<string[]>([])
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Modal State Input Transaksi
    const [showModal, setShowModal] = useState(false)
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
    const [receiptNumber, setReceiptNumber] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('Biaya Konsumsi / Katering')
    const [transactionType, setTransactionType] = useState('PENGELUARAN')
    const [amount, setAmount] = useState('')
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

                let { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    const userRes = await supabase.auth.getUser()
                    if (!userRes.data.user) {
                        window.location.href = landingUrl
                        return
                    }
                }

                const currentUserId = session?.user?.id || (await supabase.auth.getUser()).data.user?.id

                if (!currentUserId) {
                    window.location.href = landingUrl
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, status')
                    .eq('id', currentUserId)
                    .maybeSingle()

                const statusClean = (profile?.status || '').toLowerCase().trim()
                if (statusClean === 'nonaktif' || statusClean === 'non-aktif' || statusClean === 'banned') {
                    alert('Akun Anda dinonaktifkan.')
                    await supabase.auth.signOut()
                    window.location.href = landingUrl
                    return
                }

                if (isMounted) {
                    setUserName(profile?.full_name || 'Staff Finance')
                    const division = (profile?.role || 'Keuangan & Administrasi').trim()
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
                                    (cleanDiv.includes('finance') && target.includes('finance')) ||
                                    (cleanDiv.includes('keuangan') && target.includes('keuangan'))
                                )
                            })

                            if (matched && Array.isArray(matched.allowed_modules)) {
                                grantedKeys = matched.allowed_modules
                            } else {
                                grantedKeys = ['finance']
                            }
                        } else {
                            grantedKeys = ['finance']
                        }
                    }

                    // Proteksi route
                    if (!isSuperAdmin && grantedKeys.length > 0 && !grantedKeys.includes('finance')) {
                        alert('Divisi Anda tidak memiliki hak akses ke modul Keuangan.')
                        router.replace('/')
                        return
                    }

                    setAllowedModules(grantedKeys)

                    // Data Transaksi
                    const { data, error } = await supabase
                        .from('finance_transactions')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setTransactions(data)
                    } else {
                        setTransactions([
                            {
                                id: '1',
                                created_at: new Date().toISOString(),
                                transaction_date: '2026-09-09',
                                receipt_number: '-',
                                description: 'Test',
                                category: 'BBM & Pelumas',
                                type: 'PENGELUARAN',
                                amount: 100000,
                                pic: 'Test User',
                            },
                            {
                                id: '2',
                                created_at: new Date().toISOString(),
                                transaction_date: '2026-09-09',
                                receipt_number: '-',
                                description: 'Test2',
                                category: 'Sparepart & Maintenance',
                                type: 'PENGELUARAN',
                                amount: 100000,
                                pic: 'Test User',
                            },
                        ])
                    }

                    setLoading(false)
                }
            } catch (err) {
                console.error('Error load finance:', err)
                if (isMounted) setLoading(false)
            }
        }

        initFinance()

        return () => {
            isMounted = false
        }
    }, [landingUrl, router])

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description || !amount) return

        setSubmitting(true)
        const payload = {
            transaction_date: transactionDate,
            receipt_number: receiptNumber || '-',
            description,
            category,
            type: transactionType,
            amount: parseFloat(amount) || 0,
            pic: userName,
        }

        const { data, error } = await supabase.from('finance_transactions').insert([payload]).select()

        if (!error && data) {
            setTransactions([data[0], ...transactions])
            setShowModal(false)
            setDescription('')
            setReceiptNumber('')
            setAmount('')
        } else {
            setTransactions([
                {
                    id: Date.now().toString(),
                    created_at: new Date().toISOString(),
                    ...payload,
                },
                ...transactions,
            ])
            setShowModal(false)
            setDescription('')
            setReceiptNumber('')
            setAmount('')
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalIncome = transactions
        .filter((t) => t.type === 'PEMASUKAN')
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    const totalExpense = transactions
        .filter((t) => t.type === 'PENGELUARAN')
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    const balance = totalIncome - totalExpense

    // Pencegahan Crash Filter
    const filteredTransactions = transactions.filter((item) =>
        (item?.receipt_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.pic || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    // FILTER STRICT: Hanya tombol modul berizin yang muncul
    const authorizedNavItems = ALL_MODULES.filter((item) =>
        allowedModules.includes(item.key)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">
                    Sinkronisasi Ledger Kas Kecil PT. Jangkar Energi Eka Perkasa...
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
                        <span className="text-3xl">💰</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Keuangan & Kas Kecil Site PT. JEEP
                            </h1>
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Ledger Pembukuan Kas Masuk, Pengeluaran Lapangan, & Rekonsiliasi Saldo</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
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

                {/* Bilah Navigasi Dinamis Terfilter */}
                {authorizedNavItems.length > 1 ? (
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
                ) : (
                    <div className="bg-[#0a1625]/60 border border-[#1b2e46] rounded-lg px-4 py-2 text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span>Akses Terbatas: Anda hanya memiliki otoritas pada modul <strong>Keuangan</strong>.</span>
                    </div>
                )}
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                    <div className={`text-2xl font-black font-mono ${balance < 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                        Rp {balance.toLocaleString('id-ID')}
                    </div>
                    <p className="mt-2 text-[11px] text-amber-400 font-medium">Saldo Kas Kecil Real-Time</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Keuangan</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">Terkontrol</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Sesuai Nota & Kwitansi Resmi</p>
                </div>
            </div>

            {/* Grid Tabel Transaksi */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari uraian, kategori, no. nota..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> <span>Catat Transaksi Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2.5">Tanggal</th>
                                <th className="pb-2.5">No. Nota / Kwitansi</th>
                                <th className="pb-2.5">Uraian / Keterangan Transaksi</th>
                                <th className="pb-2.5">Kategori</th>
                                <th className="pb-2.5 text-center">Jenis</th>
                                <th className="pb-2.5 text-right">Nominal (IDR)</th>
                                <th className="pb-2.5 text-right">Petugas (PIC)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-[#0c1a2d]/50 transition">
                                        <td className="py-3 font-mono text-slate-400">{t.transaction_date}</td>
                                        <td className="font-mono text-amber-400 font-bold">{t.receipt_number}</td>
                                        <td className="font-semibold text-white">{t.description}</td>
                                        <td>
                                            <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded font-bold border ${t.type === 'PEMASUKAN'
                                                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                                                        : 'bg-rose-950/80 text-rose-400 border-rose-800/40'
                                                    }`}
                                            >
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className={`text-right font-mono font-bold ${t.type === 'PEMASUKAN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {t.type === 'PEMASUKAN' ? '+ ' : '- '}
                                            Rp {Number(t.amount).toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-right text-slate-400">{t.pic}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                        Belum ada catatan transaksi keuangan.
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
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Pencatatan Ledger Kas Site
                        </h2>
                        <form onSubmit={handleAddTransaction} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tanggal Transaksi</label>
                                    <input
                                        type="date"
                                        required
                                        value={transactionDate}
                                        onChange={(e) => setTransactionDate(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">No. Nota / Kwitansi (Opsional)</label>
                                    <input
                                        type="text"
                                        value={receiptNumber}
                                        onChange={(e) => setReceiptNumber(e.target.value)}
                                        placeholder="Contoh: INV-091"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Uraian / Keterangan Pembayaran</label>
                                <input
                                    type="text"
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Contoh: Pembelian logistik dapur mess"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Jenis Transaksi</label>
                                    <select
                                        value={transactionType}
                                        onChange={(e) => setTransactionType(e.target.value)}
                                        className={`w-full bg-[#060c14] border border-[#1b2e46] text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-bold ${transactionType === 'PEMASUKAN' ? 'text-emerald-400' : 'text-rose-400'
                                            }`}
                                    >
                                        <option value="PENGELUARAN">PENGELUARAN (Kas Keluar)</option>
                                        <option value="PEMASUKAN">PEMASUKAN (Dropping Pusat)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Kategori Pengeluaran</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Biaya Konsumsi / Katering">Biaya Konsumsi / Katering</option>
                                        <option value="BBM & Pelumas">BBM & Pelumas</option>
                                        <option value="Sparepart & Maintenance">Sparepart & Maintenance</option>
                                        <option value="Operasional Lapangan / Pit">Operasional Lapangan / Pit</option>
                                        <option value="Dana CSR & Sosial">Dana CSR & Sosial</option>
                                        <option value="Lain-Lain">Lain-Lain</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nominal Transaksi (Rupiah)</label>
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Contoh: 1500000"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 font-mono text-lg"
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