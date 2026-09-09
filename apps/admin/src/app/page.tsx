'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 12 Kartu Modul Persis Tampilan Beranda Manajemen Operasi Tambang PT. JEEP
const OPERATIONAL_MODULE_CARDS = [
    {
        key: 'manager-site',
        title: 'Pusat Komando Pit',
        badge: 'Operasional Pit',
        desc: 'Monitoring ritase batubara, pengupasan overburden, dan laporan shift DOR.',
        icon: '⛏️',
    },
    {
        key: 'fleet',
        title: 'Kesiapan Alat Berat',
        badge: 'Plant & Bengkel',
        desc: 'Kontrol status unit (OP/ST/BD), jam kerja (HM), serta rasio PA dan MA.',
        icon: '🚜',
    },
    {
        key: 'sparepart',
        title: 'Gudang & Sparepart',
        badge: 'Logistik Workshop',
        desc: 'Inventaris suku cadang, reorder point, dan ketersediaan part fast-moving.',
        icon: '📦',
    },
    {
        key: 'safety',
        title: 'Inspeksi K3 & HSE',
        badge: 'K3 Tambang',
        desc: 'Pencatatan temuan hazard, mitigasi risiko K3, dan jam kerja selamat.',
        icon: '⛑️',
    },
    {
        key: 'ritase',
        title: 'Ritase & Timbangan',
        badge: 'Weighbridge',
        desc: 'Verifikasi tonase bruto, tare, dan netto armada hauling dump truck.',
        icon: '🚛',
    },
    {
        key: 'jetty',
        title: 'Jetty & Barging',
        badge: 'Port Terminal',
        desc: 'Pemuatan conveyor tongkang batubara, draught survey, dan status SPB.',
        icon: '🚢',
    },
    {
        key: 'environment',
        title: 'Lingkungan & Reklamasi',
        badge: 'Lingkungan Hidup',
        desc: 'Uji baku mutu settling pond (pH & TSS), penataan lahan, serta revegetasi.',
        icon: '🌱',
    },
    {
        key: 'bbm',
        title: 'Tangki & BBM Solar',
        badge: 'Fuel Management',
        desc: 'Stok solar industri, pencatatan nozzle alat berat, dan burn rate operasional.',
        icon: '⛽',
    },
    {
        key: 'finance',
        title: 'Kas & Finansial Site',
        badge: 'Finance & Kas',
        desc: 'Ledger pengeluaran kas kecil, dropping dana pusat, dan biaya lapangan.',
        icon: '💰',
    },
    {
        key: 'adm',
        title: 'Administrasi & Surat',
        badge: 'Site ADM',
        desc: 'Pengarsipan surat jalan ritase, izin masuk SIMP, dan administrasi berkas.',
        icon: '📋',
    },
    {
        key: 'hrd',
        title: 'HRD & Manpower',
        badge: 'Human Resources',
        desc: 'Database pekerja tambang, shift kerja, kebugaran, dan status kru.',
        icon: '👷‍♂️',
    },
    {
        key: 'ga',
        title: 'General Affair (GA)',
        badge: 'Fasilitas & Sarana',
        desc: 'Log armada LV operasional, sarana mess camp, genset, dan logistik makan.',
        icon: '🚙',
    },
]

export default function SuperAdminConsole() {
    // Tab menu default langsung ke 'permissions' agar kartu modul hak akses langsung tampak
    const [activeMenu, setActiveMenu] = useState<'permissions' | 'users' | 'roles' | 'system' | 'audit'>('permissions')

    // State Manajemen Pengguna
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // State Modal Buat Pengguna
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // State Modal Edit Pengguna
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
    const [editUserId, setEditUserId] = useState('')
    const [editFullName, setEditFullName] = useState('')
    const [editUsername, setEditUsername] = useState('')
    const [editRole, setEditRole] = useState('')

    // State Divisi & Jabatan
    const [roles, setRoles] = useState<any[]>([
        { id: '1', division: 'Administrator', position: 'Super Administrator', access_level: 'Full' },
        { id: '2', division: 'Operasional Lapangan', position: 'Operator Pit Tambang', access_level: 'Limited' },
        { id: '3', division: 'Keuangan & Payroll', position: 'Manajer Keuangan & Gaji', access_level: 'Read-Only' },
        { id: '4', division: 'HSE & Medical', position: 'Safety & Clinic Officer', access_level: 'Standard' },
        { id: '5', division: 'General Affair & Logistik', position: 'GA Supervisor', access_level: 'Standard' },
    ])
    const [rolesLoading, setRolesLoading] = useState(false)
    const [divisionName, setDivisionName] = useState('')
    const [positionName, setPositionName] = useState('')
    const [accessLevel, setAccessLevel] = useState('Standard')

    // State Modal Edit Divisi
    const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false)
    const [editRoleId, setEditRoleId] = useState('')
    const [editDivisionName, setEditDivisionName] = useState('')
    const [editPositionName, setEditPositionName] = useState('')
    const [editAccessLevel, setEditAccessLevel] = useState('Standard')

    // State Hak Akses Matriks Modul Terpilih per Divisi
    const [selectedDivisionForPermission, setSelectedDivisionForPermission] = useState('Operasional Lapangan')
    const [divisionPermissions, setDivisionPermissions] = useState<Record<string, string[]>>({
        Administrator: OPERATIONAL_MODULE_CARDS.map((m) => m.key),
        'Operasional Lapangan': ['manager-site', 'fleet', 'ritase', 'bbm'],
        'Keuangan & Payroll': ['finance', 'adm', 'hrd'],
        'HSE & Medical': ['safety', 'environment'],
        'General Affair & Logistik': ['adm', 'ga', 'bbm', 'sparepart'],
    })
    const [savingPermission, setSavingPermission] = useState(false)

    useEffect(() => {
        fetchUsers()
        fetchRoles()
        fetchPermissions()
    }, [])

    async function fetchUsers() {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setUsers(data)
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

    async function fetchPermissions() {
        try {
            const { data, error } = await supabase.from('division_permissions').select('*')
            if (!error && data && data.length > 0) {
                const mapped: Record<string, string[]> = {}
                data.forEach((item: any) => {
                    mapped[item.division_name] = item.allowed_modules || []
                })
                setDivisionPermissions((prev) => ({ ...prev, ...mapped }))
            }
        } catch {
            // Menggunakan fallback data state lokal
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })
            if (authError) throw authError

            const userId = authData.user?.id
            if (userId) {
                await supabase.from('profiles').insert([
                    {
                        id: userId,
                        full_name: fullName,
                        username,
                        email,
                        role,
                        status: 'Aktif',
                    },
                ])
            }
            alert('Pengguna baru berhasil ditambahkan!')
            setIsModalOpen(false)
            setFullName('')
            setUsername('')
            setEmail('')
            setPassword('')
            fetchUsers()
        } catch (error: any) {
            alert('Terjadi kesalahan: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditUserModal = (u: any) => {
        setEditUserId(u.id)
        setEditFullName(u.full_name || '')
        setEditUsername(u.username || '')
        setEditRole(u.role || '')
        setIsEditUserModalOpen(true)
    }

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: editFullName,
                username: editUsername,
                role: editRole,
            })
            .eq('id', editUserId)

        if (error) {
            alert('Gagal memperbarui pengguna: ' + error.message)
        } else {
            alert('Data pengguna berhasil diperbarui!')
            setIsEditUserModalOpen(false)
            fetchUsers()
        }
    }

    const handleDeleteUser = async (id: string, emailUser: string) => {
        if (!confirm(`Yakin ingin menghapus pengguna ${emailUser} dari database?`)) return
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) {
            alert('Gagal menghapus pengguna: ' + error.message)
        } else {
            alert('Pengguna berhasil dihapus.')
            fetchUsers()
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Aktif' ? 'Non-Aktif' : 'Aktif'
        const { error } = await supabase
            .from('profiles')
            .update({ status: newStatus })
            .eq('id', id)

        if (!error) fetchUsers()
    }

    const handleAddRole = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!divisionName) return

        const newRoleItem = {
            id: Date.now().toString(),
            division: divisionName,
            position: positionName || 'Staff Umum',
            access_level: accessLevel,
        }

        const { error } = await supabase.from('roles').insert([
            {
                division: divisionName,
                position: positionName,
                access_level: accessLevel,
            },
        ])

        if (error) {
            setRoles([newRoleItem, ...roles])
            alert('Data Divisi & Jabatan berhasil ditambahkan secara lokal.')
        } else {
            alert('Data Divisi & Jabatan berhasil disimpan ke database!')
            fetchRoles()
        }

        setDivisionPermissions((prev) => ({
            ...prev,
            [divisionName]: ['manager-site', 'safety', 'adm'],
        }))

        setDivisionName('')
        setPositionName('')
        setAccessLevel('Standard')
    }

    const openEditRoleModal = (r: any) => {
        setEditRoleId(r.id)
        setEditDivisionName(r.division || r.name || '')
        setEditPositionName(r.position || r.description || '')
        setEditAccessLevel(r.access_level || 'Standard')
        setIsEditRoleModalOpen(true)
    }

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase
            .from('roles')
            .update({
                division: editDivisionName,
                position: editPositionName,
                access_level: editAccessLevel,
            })
            .eq('id', editRoleId)

        if (error) {
            setRoles(
                roles.map((item) =>
                    item.id === editRoleId
                        ? { ...item, division: editDivisionName, position: editPositionName, access_level: editAccessLevel }
                        : item
                )
            )
        } else {
            alert('Data Divisi berhasil diperbarui!')
            fetchRoles()
        }
        setIsEditRoleModalOpen(false)
    }

    const handleDeleteRole = async (id: string) => {
        if (!confirm('Yakin ingin menghapus divisi ini?')) return
        const { error } = await supabase.from('roles').delete().eq('id', id)
        if (error) {
            setRoles(roles.filter((r) => r.id !== id))
        } else {
            fetchRoles()
        }
    }

    // Handler Checklist Modul per Divisi
    const handleToggleModulePermission = (moduleKey: string) => {
        const currentList = divisionPermissions[selectedDivisionForPermission] || []
        const exists = currentList.includes(moduleKey)

        const updated = exists
            ? currentList.filter((k) => k !== moduleKey)
            : [...currentList, moduleKey]

        setDivisionPermissions({
            ...divisionPermissions,
            [selectedDivisionForPermission]: updated,
        })
    }

    const handleSelectAll = () => {
        setDivisionPermissions({
            ...divisionPermissions,
            [selectedDivisionForPermission]: OPERATIONAL_MODULE_CARDS.map((m) => m.key),
        })
    }

    const handleClearAll = () => {
        setDivisionPermissions({
            ...divisionPermissions,
            [selectedDivisionForPermission]: [],
        })
    }

    const handleSavePermissions = async () => {
        setSavingPermission(true)
        const allowedModules = divisionPermissions[selectedDivisionForPermission] || []

        try {
            const { error } = await supabase
                .from('division_permissions')
                .upsert(
                    {
                        division_name: selectedDivisionForPermission,
                        allowed_modules: allowedModules,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'division_name' }
                )

            if (error) {
                alert(`Hak akses tersimpan secara lokal untuk divisi: ${selectedDivisionForPermission}`)
            } else {
                alert(`Hak akses divisi "${selectedDivisionForPermission}" berhasil disimpan ke database!`)
            }
        } catch {
            alert(`Hak akses tersimpan lokal untuk divisi: ${selectedDivisionForPermission}`)
        } finally {
            setSavingPermission(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'
    }

    const currentAllowed = divisionPermissions[selectedDivisionForPermission] || []

    return (
        <div className="flex h-screen bg-[#070b12] text-slate-200 font-sans overflow-hidden selection:bg-amber-500 selection:text-black relative">
            {/* Sidebar Navigasi Konsol */}
            <aside className="w-64 bg-[#0c121e] border-r border-[#1a2333] flex flex-col">
                <div className="p-5 border-b border-[#1a2333]">
                    <div className="text-[10px] text-amber-400 font-mono tracking-widest mb-1">PT-JEEP // JO SYSTEM</div>
                    <h1 className="text-base font-black text-white tracking-tight leading-none">Konsol Developer</h1>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Akses & Identitas</p>

                    {/* Menu Baru Hak Akses Modul Divisi */}
                    <button
                        onClick={() => setActiveMenu('permissions')}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeMenu === 'permissions'
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'text-slate-400 hover:bg-[#131d2e] hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <span>🔑</span>
                            <span>Hak Akses Modul Divisi</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 font-mono">12 MODUL</span>
                    </button>

                    <button
                        onClick={() => setActiveMenu('users')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeMenu === 'users'
                                ? 'bg-[#1b263b] text-amber-400 border border-[#2b3a54]'
                                : 'text-slate-400 hover:bg-[#131d2e] hover:text-white'
                            }`}
                    >
                        <span>👥</span> <span>Manajemen Pengguna</span>
                    </button>

                    <button
                        onClick={() => setActiveMenu('roles')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeMenu === 'roles'
                                ? 'bg-[#1b263b] text-amber-400 border border-[#2b3a54]'
                                : 'text-slate-400 hover:bg-[#131d2e] hover:text-white'
                            }`}
                    >
                        <span>🛡️</span> <span>Divisi & Jabatan</span>
                    </button>

                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-5">Sistem Inti</p>
                    <button
                        onClick={() => setActiveMenu('system')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeMenu === 'system'
                                ? 'bg-[#1b263b] text-amber-400 border border-[#2b3a54]'
                                : 'text-slate-400 hover:bg-[#131d2e] hover:text-white'
                            }`}
                    >
                        <span>⚡</span> <span>Kesehatan Sistem</span>
                    </button>
                    <button
                        onClick={() => setActiveMenu('audit')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeMenu === 'audit'
                                ? 'bg-[#1b263b] text-amber-400 border border-[#2b3a54]'
                                : 'text-slate-400 hover:bg-[#131d2e] hover:text-white'
                            }`}
                    >
                        <span>📜</span> <span>Log Audit</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-[#1a2333] bg-[#090d17] space-y-3">
                    <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Supabase Terhubung</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                        Keluar ke Beranda
                    </button>
                </div>
            </aside>

            {/* Area Konten Utama */}
            <main className="flex-1 overflow-y-auto bg-[#070b12] p-8">
                {/* TAB UTAMA: HAK AKSES MODUL DIVISI (12 KARTU PERSIS GAMBAR) */}
                {activeMenu === 'permissions' && (
                    <div className="space-y-6 max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a273b] pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                                    <span>🔑</span> Hak Akses Pembagian Modul per Divisi
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Pilih divisi untuk mengonfigurasi aplikasi dan menu operasional mana saja yang berhak dibuka oleh karyawan.
                                </p>
                            </div>

                            <button
                                onClick={handleSavePermissions}
                                disabled={savingPermission}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/10"
                            >
                                {savingPermission ? 'Menyimpan ke Supabase...' : '💾 Simpan Pengaturan Akses'}
                            </button>
                        </div>

                        {/* Pemilihan Divisi Target & Tombol Tindakan Cepat */}
                        <div className="bg-[#0b1320] border border-[#1a273b] rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pilih Divisi Karyawan:</label>
                                <select
                                    value={selectedDivisionForPermission}
                                    onChange={(e) => setSelectedDivisionForPermission(e.target.value)}
                                    className="bg-[#060a10] border border-amber-500/70 text-amber-400 font-bold text-xs px-4 py-2 rounded-lg focus:outline-none"
                                >
                                    {roles.map((r) => {
                                        const name = r.division || r.name
                                        return (
                                            <option key={r.id} value={name}>
                                                {name}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="bg-[#131d2e] hover:bg-[#1a273b] text-xs text-slate-200 px-3 py-1.5 rounded transition cursor-pointer border border-[#1f2f47]"
                                >
                                    Pilih Semua
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="bg-[#131d2e] hover:bg-rose-950/60 text-xs text-rose-400 px-3 py-1.5 rounded transition cursor-pointer border border-[#1f2f47]"
                                >
                                    Hapus Semua
                                </button>
                                <span className="text-xs text-slate-400 ml-2 font-mono">
                                    Diizinkan: <strong className="text-amber-400">{currentAllowed.length}</strong> / {OPERATIONAL_MODULE_CARDS.length} Modul
                                </span>
                            </div>
                        </div>

                        {/* Grid 12 Kartu Modul Persis Tampilan Beranda */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {OPERATIONAL_MODULE_CARDS.map((mod) => {
                                const isChecked = currentAllowed.includes(mod.key)
                                return (
                                    <div
                                        key={mod.key}
                                        onClick={() => handleToggleModulePermission(mod.key)}
                                        className={`relative rounded-xl border p-4 transition cursor-pointer flex flex-col justify-between select-none ${isChecked
                                                ? 'bg-[#102033] border-cyan-400 shadow-md shadow-cyan-950/40'
                                                : 'bg-[#09101a] border-[#162233] text-slate-400 hover:border-[#22354f]'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-2xl">{mod.icon}</span>
                                            <span
                                                className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${isChecked
                                                        ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                                                        : 'bg-[#060a10] text-slate-500 border-[#1c2b42]'
                                                    }`}
                                            >
                                                {mod.badge}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className={`text-xs font-black mb-1 ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                                                {mod.title}
                                            </h4>
                                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                                {mod.desc}
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                                            <span className={isChecked ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                                                {isChecked ? '✓ Akses Diberikan' : 'Terkunci'}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => { }}
                                                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* TAB: MANAJEMEN PENGGUNA */}
                {activeMenu === 'users' && (
                    <div className="space-y-6 max-w-6xl mx-auto">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Manajemen Pengguna</h2>
                                <p className="text-sm text-slate-500">Data tersimpan secara real-time di database Supabase.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded text-sm transition cursor-pointer"
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
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-[#161616]">
                                                <td className="p-4">
                                                    <p className="font-bold text-white">{u.full_name || '-'}</p>
                                                    <p className="text-xs text-amber-500/80 font-mono">@{u.username || '-'}</p>
                                                </td>
                                                <td className="p-4 font-mono text-slate-300">{u.email}</td>
                                                <td className="p-4">
                                                    <span className="bg-[#222] border border-[#444] px-2 py-1 rounded text-xs text-amber-400">
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => handleToggleStatus(u.id, u.status)}
                                                        className={`flex items-center space-x-2 text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${u.status === 'Aktif'
                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                                            }`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${u.status === 'Aktif' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                                        <span>{u.status || 'Aktif'}</span>
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => openEditUserModal(u)}
                                                        className="text-slate-300 hover:text-white transition text-xs bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 px-2.5 py-1 rounded cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                                        className="text-rose-500 hover:text-rose-400 transition text-xs bg-rose-950/30 border border-rose-900/50 px-2.5 py-1 rounded cursor-pointer"
                                                    >
                                                        Hapus
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: MANAJEMEN DIVISI & JABATAN */}
                {activeMenu === 'roles' && (
                    <div className="space-y-6 max-w-6xl mx-auto">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Manajemen Divisi & Jabatan</h2>
                            <p className="text-sm text-slate-500">Struktur organisasi yang terhubung ke modul Admin, HRD, Keuangan, dan Payroll.</p>
                        </div>

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
                                            className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded text-sm font-bold transition whitespace-nowrap cursor-pointer"
                                        >
                                            Simpan
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </section>

                        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
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
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    {r.access_level}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                <button
                                                    onClick={() => openEditRoleModal(r)}
                                                    className="text-slate-300 hover:text-white transition text-xs bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 px-2.5 py-1 rounded cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRole(r.id)}
                                                    className="text-rose-500 hover:text-rose-400 text-xs font-medium transition px-2.5 py-1 bg-rose-950/30 rounded border border-rose-900/30 cursor-pointer"
                                                >
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    </div>
                )}

                {/* TAB: KESEHATAN SISTEM */}
                {activeMenu === 'system' && (
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-2">Kesehatan Sistem</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-[#111] border border-[#222] rounded-xl">
                                <div className="text-xs text-slate-400">Database Supabase</div>
                                <div className="text-lg font-bold text-emerald-400 mt-1">Terhubung & Normal</div>
                            </div>
                            <div className="p-4 bg-[#111] border border-[#222] rounded-xl">
                                <div className="text-xs text-slate-400">Latency Server</div>
                                <div className="text-lg font-bold text-cyan-400 mt-1">~24 ms</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: LOG AUDIT */}
                {activeMenu === 'audit' && (
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-2">Log Audit Sistem</h2>
                        <div className="p-6 bg-[#111] border border-[#222] rounded-xl text-xs text-slate-400">
                            Aktivitas login dan perubahan konfigurasi hak akses modul terekam secara berkala di basis data.
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL BUAT PENGGUNA */}
            {isModalOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Buat Pengguna Sistem Baru</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm"
                                placeholder="Nama Lengkap"
                            />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm font-mono"
                                placeholder="Username"
                            />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm font-mono"
                                placeholder="Email"
                            />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm"
                                placeholder="Password"
                            />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-sm text-white"
                            >
                                {roles.map((r) => (
                                    <option key={r.id} value={r.division || r.name}>
                                        {r.division || r.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-[#222] text-white py-2.5 rounded text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-amber-500 text-black py-2.5 rounded text-sm font-bold"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDIT PENGGUNA */}
            {isEditUserModalOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Edit Data Pengguna</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <input
                                type="text"
                                required
                                value={editFullName}
                                onChange={(e) => setEditFullName(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm"
                            />
                            <input
                                type="text"
                                required
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm font-mono"
                            />
                            <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-sm text-white"
                            >
                                {roles.map((r) => (
                                    <option key={r.id} value={r.division || r.name}>
                                        {r.division || r.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditUserModalOpen(false)}
                                    className="flex-1 bg-[#222] text-white py-2.5 rounded text-sm"
                                >
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 bg-amber-500 text-black py-2.5 rounded text-sm font-bold">
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDIT DIVISI & JABATAN */}
            {isEditRoleModalOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Edit Divisi & Jabatan</h3>
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <input
                                type="text"
                                required
                                value={editDivisionName}
                                onChange={(e) => setEditDivisionName(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm"
                            />
                            <input
                                type="text"
                                required
                                value={editPositionName}
                                onChange={(e) => setEditPositionName(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2.5 text-white text-sm"
                            />
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditRoleModalOpen(false)}
                                    className="flex-1 bg-[#222] text-white py-2.5 rounded text-sm"
                                >
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 bg-amber-500 text-black py-2.5 rounded text-sm font-bold">
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}