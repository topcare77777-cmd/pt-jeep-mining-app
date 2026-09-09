'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function LandingPage() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin-pied-pi-57.vercel.app'
    const managementUrl = process.env.NEXT_PUBLIC_MANAGEMENT_URL || 'https://pt-jeep-management.vercel.app'

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage('')

        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Konfigurasi Supabase belum lengkap di sistem.')
            }

            const supabase = createClient(supabaseUrl, supabaseAnonKey)

            // 1. Autentikasi Pengguna
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setErrorMessage(error.message || 'Email atau kata sandi tidak valid.')
                setIsLoading(false)
                return
            }

            if (!data.session || !data.user) {
                throw new Error('Gagal memverifikasi sesi login.')
            }

            const { access_token, refresh_token } = data.session

            // 2. Ambil Profil & Divisi Karyawan
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, status, full_name')
                .eq('id', data.user.id)
                .maybeSingle()

            if (profileError || !profile) {
                // Fallback langsung ke portal utama jika profil belum terdaftar
                window.location.href = `${managementUrl}#access_token=${access_token}&refresh_token=${refresh_token}`
                return
            }

            const statusClean = (profile.status || '').toLowerCase().trim()
            if (statusClean === 'non-aktif' || statusClean === 'nonaktif' || statusClean === 'banned') {
                setErrorMessage('Akun Anda dinonaktifkan oleh Administrator.')
                await supabase.auth.signOut()
                setIsLoading(false)
                return
            }

            const userDivision = profile.role || ''

            // Jika Super Administrator, langsung buka portal utama
            if (userDivision.toLowerCase().includes('admin')) {
                window.location.href = `${managementUrl}#access_token=${access_token}&refresh_token=${refresh_token}`
                return
            }

            // 3. Ambil Matriks Izin Divisi
            const { data: permData } = await supabase
                .from('division_permissions')
                .select('allowed_modules')
                .eq('division_name', userDivision)
                .maybeSingle()

            const allowedModules: string[] = Array.isArray(permData?.allowed_modules)
                ? permData.allowed_modules
                : []

            // 4. Pengalihan Rute Cerdas Berdasarkan Izin Modul
            let targetPath = ''
            if (allowedModules.length > 0) {
                // Arahkan ke modul pertama yang diizinkan (misal /ritase, /manager-site, atau /bbm)
                targetPath = `/${allowedModules[0]}`
            }

            // Alihkan ke URL Management dengan token sesi aktif
            window.location.href = `${managementUrl}${targetPath}#access_token=${access_token}&refresh_token=${refresh_token}`
        } catch (err: any) {
            setErrorMessage(err.message || 'Terjadi kesalahan sistem otentikasi.')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 relative">
            {/* Navbar */}
            <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-black tracking-wider text-amber-400">
                        ⛏️ PT. Jangkar Energi Eka Perkasa
                    </span>
                    <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-0.5 rounded border border-slate-800 hidden md:inline-block font-mono">
                        Operasi Tambang Nikel
                    </span>
                </div>
                <div className="hidden md:flex space-x-8 text-sm text-slate-300">
                    <a href="#features" className="hover:text-amber-400 transition">Fitur Tambang</a>
                    <a href="#modules" className="hover:text-amber-400 transition">Ekosistem 30 Modul</a>
                    <a href="#about" className="hover:text-amber-400 transition">Tentang Kami</a>
                </div>
                <div>
                    <a
                        href={adminUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition shadow-lg shadow-amber-500/10 inline-block"
                    >
                        Konsol Superadmin
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="px-8 py-24 max-w-6xl mx-auto text-center">
                <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium mb-6">
                    <span>⚡ Sistem Pengelolaan Pertambangan Nikel Terpadu</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                    Pusat Operasi Tambang Nikel Terintegrasi <br className="hidden md:block" />
                    <span className="text-amber-400">PT. Jangkar Energi Eka Perkasa</span>
                </h1>
                <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-10">
                    Manajemen komprehensif mulai dari pengupasan overburden, ekstraksi bijih nikel (saprolite & limonite), penimbangan ritase, kontrol BBM solar, hingga pengapalan tongkang LCT di jetty.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                        Masuk Portal Operasi Karyawan
                    </button>
                    <a
                        href="#features"
                        className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold px-6 py-3 rounded-xl text-sm transition"
                    >
                        Pelajari Infrastruktur Site
                    </a>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="px-8 py-20 bg-slate-900/40 border-y border-slate-900">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-12 text-slate-200">
                        Infrastruktur & Keunggulan Operasional Tambang Nikel
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-amber-400 text-2xl mb-4">⛏️</div>
                            <h3 className="font-bold text-lg mb-2 text-white">Pit & Produksi Ore Nikel</h3>
                            <p className="text-slate-400 text-sm">
                                Pemantauan ritase pengangkutan lapisan overburden dan pemilahan kadar bijih nikel saprolite/limonite secara akurat.
                            </p>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-amber-400 text-2xl mb-4">🚢</div>
                            <h3 className="font-bold text-lg mb-2 text-white">Logistik Jetty & Barging</h3>
                            <p className="text-slate-400 text-sm">
                                Koordinasi conveyor pelabuhan, draught survey tongkang LCT, dan verifikasi dokumen pengapalan resmi SPB.
                            </p>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-amber-400 text-2xl mb-4">🔑</div>
                            <h3 className="font-bold text-lg mb-2 text-white">Role-Based Access Control</h3>
                            <p className="text-slate-400 text-sm">
                                Setiap divisi karyawan hanya dapat mengakses modul aplikasi yang telah disetujui dan ditentukan oleh Superadmin.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-8 py-8 border-t border-slate-900 text-center text-xs text-slate-500">
                <p>&copy; 2026 PT. Jangkar Energi Eka Perkasa - Operasi Tambang Nikel. Hak Cipta Dilindungi Undang-Undang.</p>
            </footer>

            {/* Modal Login Karyawan Berbasis Divisi */}
            {isLoginModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-sm p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 text-xl">
                                👷
                            </div>
                            <h3 className="text-xl font-bold text-white">Otorisasi Karyawan</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Masuk untuk mengakses modul operasional sesuai divisi Anda
                            </p>
                        </div>

                        {errorMessage && (
                            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/40 rounded-lg text-rose-300 text-xs text-center">
                                {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Email Karyawan
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                                    placeholder="nama@pt-jeep.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Kata Sandi
                                </label>
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
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3 rounded-lg text-sm transition font-bold flex justify-center items-center cursor-pointer"
                                >
                                    {isLoading ? (
                                        <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        'Masuk ke Sistem Site'
                                    )}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsLoginModalOpen(false)
                                    setErrorMessage('')
                                }}
                                className="w-full text-slate-500 hover:text-slate-300 text-xs py-2 transition mt-2 cursor-pointer"
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