'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface TransactionItem {
    id: string
    transaction_type: string
    category: string
    amount: number
    description: string
    transaction_date: string
}

export default function FinanceDashboard() {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // State Transaksi Keuangan
    const [transactions, setTransactions] = useState<TransactionItem[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(false)

    // State Form Input Kas/Payroll
    const [type, setType] = useState('Pengeluaran Operasional')
    const [category, setCategory] = useState('Bahan Bakar Solar (BBM)')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 1. Proteksi Hak Akses (Hanya Keuangan & Payroll dan Super Admin)
    useEffect(() => {
        async function verifyAccess() {
            setCheckingAuth(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert('Silakan masuk terlebih dahulu.')
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (!profile || profile.status !== 'Aktif') {
                alert('Akses ditolak: Akun dinonaktifkan.')
                await supabase.auth.signOut()
                router.push('/login')
                return
            }

            const allowedRoles = ['Keuangan & Payroll', 'Finance', 'Administrator', 'Developer']
            if (!allowedRoles.includes(profile.role)) {
                alert(`Akses Ditolak: Divisi ${profile.role} tidak memiliki wewenang ke Dasbor Keuangan.`)
                router.push('/login')
                return
            }

            setCurrentUser(profile)
            setIsAuthorized(true)
            setCheckingAuth(false)
            fetchTransactions()
        }

        verifyAccess()
    }, [router])

    // 2. Ambil data transaksi
    async function fetchTransactions() {
        setLoadingTransactions(true)
        const { data, error } = await supabase
            .from('finance_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            console.error('Gagal mengambil data kas:', error.message)
        } else if (data) {
            setTransactions(data)
        }
        setLoadingTransactions(false)
    }

    // 3. Simpan transaksi baru
    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount) return
        setIsSubmitting(true)

        const payload = {
            user_id: currentUser?.id,
            transaction_type: type,
            category: category,
            amount: parseFloat(amount),
            description: description,
        }

        const { error } = await supabase.from('finance_transactions').insert([payload])

        if (error) {
            alert('Gagal mencatat transaksi: ' + error.message)
        } else {
            setAmount('')
            setDescription('')
            fetchTransactions()
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
                    <p className="text-xs tracking-wider uppercase">Memverifikasi Wewenang Keuangan...</p>
                </div>
            </div>
        )
    }

    if (!isAuthorized) return null

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans p-6 md:p-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-zinc-800 gap-4 mb-8">
                <div>
                    <span className="text-xs font-mono text-amber-500 font-bold uppercase tracking-widest">
                        PT-JEEP // MODUL KEUANGAN & PAYROLL
                    </span>
                    <h1 className="text-2xl font-bold text-white mt-1">Dasbor Kas & Payroll Tambang</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Petugas: <span className="text-white font-medium">{currentUser?.full_name}</span> | Divisi:{' '}
                        <span className="text-amber-400 font-mono">{currentUser?.role}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLogout}
                        className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-300 text-xs px-4 py-2 rounded transition"
                    >
                        Keluar
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Catat Kas / Payroll */}
                <section className="bg-[#111] border border-zinc-800 rounded-xl p-6 shadow-xl h-fit">
                    <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-zinc-800">
                        Catat Pengeluaran / Payroll
                    </h2>

                    <form onSubmit={handleAddTransaction} className="space-y-4 text-sm">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Jenis Transaksi</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
                            >
                                <option value="Pengeluaran Operasional">Pengeluaran Operasional</option>
                                <option value="Gaji & Payroll">Gaji & Payroll</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Kategori Biaya</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
                            >
                                <option value="Bahan Bakar Solar (BBM)">Bahan Bakar Solar (BBM)</option>
                                <option value="Maintenance Alat Berat">Maintenance Alat Berat</option>
                                <option value="Gaji Karyawan Lapangan">Gaji Karyawan Lapangan</option>
                                <option value="Uang Makan & Lembur">Uang Makan & Lembur</option>
                                <option value="Logistik & Perlengkapan K3">Logistik & Perlengkapan K3</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nominal (Rp)</label>
                            <input
                                type="number"
                                required
                                placeholder="Contoh: 15000000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Keterangan / Memo</label>
                            <textarea
                                rows={3}
                                placeholder="Rincian pembayaran faktur / slip..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded transition disabled:opacity-50"
                        >
                            {isSubmitting ? 'Memproses...' : 'Simpan Transaksi Kas'}
                        </button>
                    </form>
                </section>

                {/* Tabel Riwayat Kas */}
                <section className="lg:col-span-2 bg-[#111] border border-zinc-800 rounded-xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                        <h2 className="text-base font-bold text-white">Buku Kas & Pengeluaran Terakhir</h2>
                        <button
                            onClick={fetchTransactions}
                            className="text-xs text-amber-400 hover:text-amber-300 font-mono transition"
                        >
                            ⟳ Segarkan
                        </button>
                    </div>

                    {loadingTransactions ? (
                        <div className="py-12 text-center text-xs text-slate-500">Memuat transaksi...</div>
                    ) : transactions.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-500">Belum ada transaksi tercatat.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-slate-500 uppercase">
                                        <th className="py-3 px-3">Tanggal</th>
                                        <th className="py-3 px-3">Jenis</th>
                                        <th className="py-3 px-3">Kategori</th>
                                        <th className="py-3 px-3">Keterangan</th>
                                        <th className="py-3 px-3 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-zinc-900/50 transition">
                                            <td className="py-3 px-3 font-mono text-slate-400">{t.transaction_date}</td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-0.5 rounded border text-[11px] ${t.transaction_type === 'Gaji & Payroll'
                                                        ? 'bg-purple-950/40 border-purple-800/40 text-purple-300'
                                                        : 'bg-blue-950/40 border-blue-800/40 text-blue-300'
                                                    }`}>
                                                    {t.transaction_type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-slate-200 font-medium">{t.category}</td>
                                            <td className="py-3 px-3 text-slate-400">{t.description || '-'}</td>
                                            <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                                                Rp {Number(t.amount).toLocaleString('id-ID')}
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