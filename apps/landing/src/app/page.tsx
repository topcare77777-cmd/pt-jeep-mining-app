'use client'

import { useState } from 'react'

export default function LandingPage() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // URL dinamis berbasis Environment Variable dengan fallback lokal
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000'
    const managementUrl = process.env.NEXT_PUBLIC_MANAGEMENT_URL || 'http://localhost:3001'

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Arahkan ke modul Manajemen / Lapangan
        setTimeout(() => {
            window.location.href = managementUrl
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 relative">
            {/* Navbar */}
            <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-black tracking-wider text-amber-400">🚜 PT. Jangkar Energi Eka Perkasa</span>
                    <span className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 hidden md:inline-block">Operasi Tambang</span>
                </div>
                <div className="hidden md:flex space-x-8 text-sm text-slate-300">
                    <a href="#features" className="hover:text-amber-400 transition">Fitur Sistem</a>
                    <a href="#modules" className="hover:text-amber-400 transition">Ekosistem Modul</a>
                    <a href="#about" className="hover:text-amber-400 transition">Tentang Kami</a>
                </div>
                <div>
                    <a
                        href={adminUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition shadow-lg shadow-amber-500/10 inline-block"
                    >
                        Masuk Dasbor Admin
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="px-8 py-24 max-w-6xl mx-auto text-center">
                <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium mb-6">
                    <span>⚡ Integrasi Supabase & Monorepo Modern</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                    Sistem Pengelolaan Tambang Terpadu <br className="hidden md:block" />
                    <span className="text-amber-400">PT. Jangkar Energi Eka Perkasa</span>
                </h1>
                <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-10">
                    Solusi digital tangguh untuk pemantauan ritase pengangkutan, manajemen armada dump truck, dan pelaporan operasional lapangan secara real-time bahkan di wilayah site terpencil.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition"
                    >
                        Buka Aplikasi Lapangan (User)
                    </button>
                    <a href="#modules" className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold px-6 py-3 rounded-xl text-sm transition">
                        Pelajari Modul Sistem
                    </a>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="px-8 py-20 bg-slate-900/40 border-y border-slate-900">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-12 text-slate-200">Keunggulan Teknologi Operasional</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-amber-400 text-2xl mb-4">📡</div>
                            <h3 className="font-bold text-lg mb-2 text-white">Kemampuan Offline-First</h3>
                            <p className="text-slate-400 text-sm">Tetap dapat melakukan pencatatan data ritase di pit meskipun koneksi internet site sedang terganggu, sinkronisasi otomatis saat jaringan pulih.</p>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-amber-400 text-2xl mb-4">⚡</div>
                            <h3 className="font-bold text-lg mb-2 text-white">Data Supabase Real-time</h3>
                            <p className="text-slate-400 text-sm">Pembaruan data tonase dan status unit dump truck langsung terkirim ke pusat kendali tanpa jeda waktu yang lama.</p>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-amber-400 text-2xl mb-4">🛡️</div>
                            <h3 className="font-bold text-lg mb-2 text-white">Monorepo Multi-Modul</h3>
                            <p className="text-slate-400 text-sm">Arsitektur terpusat menggunakan Turborepo yang memisahkan modul Admin, Manajemen, Pengguna Lapangan, dan Landing Page dengan rapi.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-8 py-8 border-t border-slate-900 text-center text-xs text-slate-500">
                <p>&copy; 2026 PT. Jangkar Energi Eka Perkasa Operasi Tambang. Hak Cipta Dilindungi Undang-Undang.</p>
            </footer>

            {/* Overlay Modal Login Lapangan */}
            {isLoginModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-sm p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 text-xl">
                                👷
                            </div>
                            <h3 className="text-xl font-bold text-white">Otorisasi Lapangan</h3>
                            <p className="text-xs text-slate-400 mt-1">Silakan masuk untuk mencatat ritase</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Petugas</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                                    placeholder="operator@pt-jeep.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kata Sandi</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-black py-3 rounded-lg text-sm transition font-bold flex justify-center items-center"
                                >
                                    {isLoading ? (
                                        <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        'Masuk ke Sistem Lapangan'
                                    )}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsLoginModalOpen(false)}
                                className="w-full text-slate-500 hover:text-slate-300 text-xs py-2 transition mt-2"
                            >
                                Batal & Kembali
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}