'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SuperAdminConsole() {
    const [activeMenu, setActiveMenu] = useState<'system' | 'users' | 'roles' | 'audit'>('users')

    // State untuk daftar pengguna dari database
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // State untuk Modal Form Buat Pengguna
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('FieldUser')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Ambil data pengguna asli dari Supabase saat halaman dimuat
    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Gagal mengambil data pengguna:', error.message)
        } else {
            setUsers(data || [])
        }
        setLoading(false)
    }

    // Handler Submit Pengguna Baru (REAL KE SUPABASE)
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // 1. Daftarkan akun ke Supabase Auth agar bisa login
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) throw authError

            const userId = authData.user?.id

            if (userId) {
                // 2. Simpan detail profil tambahan ke tabel 'profiles'
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: userId,
                            full_name: fullName,
                            username: username,
                            email: email,
                            role: role,
                            status: 'Aktif',
                        }
                    ])

                if (profileError) throw profileError
            }

            alert('Pengguna baru berhasil didaftarkan ke sistem Supabase!')
            setIsModalOpen(false)

            // Reset form
            setFullName('')
            setUsername('')
            setEmail('')
            setPassword('')
            setRole('FieldUser')

            // Muat ulang daftar pengguna
            fetchUsers()

        } catch (error: any) {
            alert('Terjadi kesalahan: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handler Keluar (Logout)
    const handleLogout = () => {
        window.location.href = 'http://localhost:3003'
    }

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-slate-200 font-sans overflow-hidden selection:bg-amber-500 selection:text-black relative">

            {/* Sidebar Pengembang */}
            <aside className="w-64 bg-[#111] border-r border-[#333] flex flex-col">
                <div className="p-5 border-b border-[#333]">
                    <div className="text-[10px] text-amber-500 font-mono tracking-widest mb-1">PT-JEEP // JO SYSTEM</div>
                    <h1 className="text-lg font-bold text-white tracking-tight leading-none">Konsol Developer</h1>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">Sistem Inti</p>
                    <button onClick={() => setActiveMenu('system')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition ${activeMenu === 'system' ? 'bg-[#222] text-amber-400 border border-[#444]' : 'text-slate-400 hover:bg-[#1a1a1a] hover:text-white'}`}>
                        <span>⚡</span> <span>Kesehatan Sistem</span>
                    </button>

                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-6">Akses & Identitas</p>
                    <button onClick={() => setActiveMenu('users')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition ${activeMenu === 'users' ? 'bg-[#222] text-amber-400 border border-[#444]' : 'text-slate-400 hover:bg-[#1a1a1a] hover:text-white'}`}>
                        <span>👥</span> <span>Manajemen Pengguna</span>
                    </button>
                    <button onClick={() => setActiveMenu('roles')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition ${activeMenu === 'roles' ? 'bg-[#222] text-amber-400 border border-[#444]' : 'text-slate-400 hover:bg-[#1a1a1a] hover:text-white'}`}>
                        <span>🛡️</span> <span>Peran & Hak Akses</span>
                    </button>
                    <button onClick={() => setActiveMenu('audit')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition ${activeMenu === 'audit' ? 'bg-[#222] text-amber-400 border border-[#444]' : 'text-slate-400 hover:bg-[#1a1a1a] hover:text-white'}`}>
                        <span>📜</span> <span>Log Audit</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-[#333] bg-[#0a0a0a] space-y-4">
                    <div className="text-xs text-slate-400 font-mono">
                        <span className="text-emerald-500">●</span> Supabase: Terhubung
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/50 py-2 rounded-md text-sm transition font-medium"
                    >
                        <span>🚪</span> <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Area Konten Utama */}
            <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8">
                {activeMenu === 'users' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Manajemen Pengguna</h2>
                                <p className="text-sm text-slate-500">Data tersimpan secara real-time di database Supabase.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded text-sm transition"
                            >
                                + Buat Pengguna Baru
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-slate-500 text-sm py-10 text-center">Memuat data dari database...</div>
                        ) : (
                            <div className="bg-[#111] rounded-xl border border-[#333] overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#1a1a1a] border-b border-[#333] text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="p-4">Pengguna & Username</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Peran</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#222]">
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-500">Belum ada pengguna terdaftar di database.</td>
                                            </tr>
                                        ) : (
                                            users.map((u) => (
                                                <tr key={u.id} className="hover:bg-[#161616]">
                                                    <td className="p-4">
                                                        <p className="font-bold text-white">{u.full_name || '-'}</p>
                                                        <p className="text-xs text-amber-500/80 font-mono">@{u.username || '-'}</p>
                                                    </td>
                                                    <td className="p-4 font-mono text-slate-300">{u.email}</td>
                                                    <td className="p-4">
                                                        <span className="bg-[#222] border border-[#444] px-2 py-1 rounded text-xs text-amber-400">{u.role}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`flex items-center space-x-2 text-xs ${u.status === 'Aktif' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            <span className={`w-2 h-2 rounded-full ${u.status === 'Aktif' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                                            <span>{u.status}</span>
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right space-x-3">
                                                        <button className="text-slate-400 hover:text-white transition">Edit</button>
                                                        <button className="text-rose-500 hover:text-rose-400 transition">Cabut</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Overlay Modal Form Pembuatan Pengguna */}
            {isModalOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Buat Pengguna Sistem Baru (Real Supabase)</h3>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                                        placeholder="Contoh: Budi Santoso"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                                        placeholder="budi_pit"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Alamat Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                                    placeholder="budi@pt-jeep.com"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kata Sandi (Password)</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                                        placeholder="Min. 6 karakter"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tetapkan Peran</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="FieldUser">FieldUser (Operator Pit)</option>
                                        <option value="DivAdmin">DivAdmin (Manajer Lapangan)</option>
                                        <option value="Developer">Developer (Super Admin)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] text-white py-2.5 rounded text-sm transition font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black py-2.5 rounded text-sm transition font-bold flex justify-center items-center"
                                >
                                    {isSubmitting ? (
                                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        'Simpan ke Database'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}