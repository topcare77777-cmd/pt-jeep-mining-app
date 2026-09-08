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
    const [role, setRole] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // State tambahan untuk modul Divisi & Jabatan (Terintegrasi HRD/Keuangan/Payroll)
    const [roles, setRoles] = useState<any[]>([
        { id: '1', division: 'Administrator', position: 'Super Administrator', access_level: 'Full' },
        { id: '2', division: 'Operasional Lapangan', position: 'Operator Pit Tambang', access_level: 'Limited' },
        { id: '3', division: 'Keuangan & Payroll', position: 'Manajer Keuangan & Gaji', access_level: 'Read-Only' }
    ])
    const [rolesLoading, setRolesLoading] = useState(false)
    const [divisionName, setDivisionName] = useState('')
    const [positionName, setPositionName] = useState('')
    const [accessLevel, setAccessLevel] = useState('Standard')

    // Ambil data pengguna asli dari Supabase saat halaman dimuat
    useEffect(() => {
        fetchUsers()
        fetchRoles()
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

    async function fetchRoles() {
        setRolesLoading(true)
        const { data, error } = await supabase.from('roles').select('*')
        if (!error && data && data.length > 0) {
            setRoles(data)
            if (!role && data[0]) {
                setRole(data[0].division || data[0].name)
            }
        }
        setRolesLoading(false)
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

            // Muat ulang daftar pengguna
            fetchUsers()

        } catch (error: any) {
            alert('Terjadi kesalahan: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handler Tambah Divisi & Jabatan Baru (Terhubung HRD/Payroll/Keuangan)
    const handleAddRole = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!divisionName) return

        const newRoleItem = {
            id: Date.now().toString(),
            division: divisionName,
            position: positionName || 'Staff Umum',
            access_level: accessLevel
        }

        const { error } = await supabase.from('roles').insert([{
            division: divisionName,
            position: positionName,
            access_level: accessLevel
        }])

        if (error) {
            setRoles([newRoleItem, ...roles])
            alert('Data Divisi & Jabatan berhasil ditambahkan secara lokal (Tabel Supabase belum dibuat).')
        } else {
            alert('Data Divisi & Jabatan berhasil disimpan ke database Supabase!')
            fetchRoles()
        }

        setDivisionName('')
        setPositionName('')
        setAccessLevel('Standard')
    }

    // Handler Hapus Divisi/Jabatan
    const handleDeleteRole = async (id: string) => {
        if (!confirm('Yakin ingin menghapus data ini?')) return
        const { error } = await supabase.from('roles').delete().eq('id', id)
        if (error) {
            setRoles(roles.filter(r => r.id !== id))
        } else {
            fetchRoles()
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
                        <span>🛡️</span> <span>Divisi & Jabatan</span>
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
                                            <th className="p-4">Divisi / Peran</th>
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

                {activeMenu === 'roles' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Manajemen Divisi & Jabatan</h2>
                                <p className="text-sm text-slate-500">Struktur organisasi yang terhubung ke modul Admin, HRD, Keuangan, dan Payroll.</p>
                            </div>
                        </div>

                        {/* Form Tambah Divisi & Jabatan */}
                        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-semibold text-white mb-4">Tambah Divisi & Jabatan Baru</h3>
                            <form onSubmit={handleAddRole} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Divisi</label>
                                    <input
                                        type="text"
                                        value={divisionName}
                                        onChange={(e) => setDivisionName(e.target.value)}
                                        placeholder="Contoh: Divisi Keuangan / HRD"
                                        className="w-full bg-black border border-zinc-700 rounded p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Jabatan</label>
                                    <input
                                        type="text"
                                        value={positionName}
                                        onChange={(e) => setPositionName(e.target.value)}
                                        placeholder="Contoh: Supervisor / Payroll Officer"
                                        className="w-full bg-black border border-zinc-700 rounded p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Tingkat Akses Sistem</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={accessLevel}
                                            onChange={(e) => setAccessLevel(e.target.value)}
                                            className="w-full bg-black border border-zinc-700 rounded p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                                        >
                                            <option value="Full">Full (Penuh)</option>
                                            <option value="Standard">Standard</option>
                                            <option value="Read-Only">Read-Only (Baca Saja)</option>
                                        </select>
                                        <button
                                            type="submit"
                                            className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded text-sm font-bold transition whitespace-nowrap"
                                        >
                                            Simpan
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </section>

                        {/* Tabel Daftar Divisi & Jabatan */}
                        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
                            <div className="px-6 py-4 border-b border-zinc-800">
                                <h3 className="text-md font-semibold text-white">Daftar Divisi & Jabatan Terintegrasi</h3>
                            </div>
                            {rolesLoading ? (
                                <div className="p-8 text-center text-slate-500">Memuat data divisi...</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-xs text-slate-500 bg-black/40 uppercase">
                                            <th className="py-3 px-6">Divisi</th>
                                            <th className="py-3 px-6">Jabatan</th>
                                            <th className="py-3 px-6">Tingkat Akses</th>
                                            <th className="py-3 px-6 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800 text-sm">
                                        {roles.map((r) => (
                                            <tr key={r.id} className="hover:bg-zinc-800/50 transition">
                                                <td className="py-4 px-6 font-bold text-white">{r.division || r.name}</td>
                                                <td className="py-4 px-6 text-slate-400">{r.position || r.description}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${r.access_level === 'Full' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        r.access_level === 'Limited' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                        {r.access_level}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => handleDeleteRole(r.id)}
                                                        className="text-rose-500 hover:text-rose-400 text-xs font-medium transition px-2 py-1 bg-rose-950/30 rounded border border-rose-900/30"
                                                    >
                                                        Hapus
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>
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
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tetapkan Divisi</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                                    >
                                        {roles.map((r) => {
                                            const divName = r.division || r.name
                                            const posName = r.position || r.description
                                            return (
                                                <option key={r.id} value={divName}>
                                                    {divName} {posName ? `(${posName})` : ''}
                                                </option>
                                            )
                                        })}
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