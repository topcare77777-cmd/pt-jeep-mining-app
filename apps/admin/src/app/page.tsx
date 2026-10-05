'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Daftar lengkap modul operasional tambang nikel PT. Jangkar Energi Eka Perkasa (Sesuai folder aktual apps/management/src/app)
const OPERATIONAL_MODULE_CARDS = [
    {
        key: 'manager-site',
        title: 'Pusat Komando Pit Nikel',
        badge: 'Operasional Pit',
        desc: 'Monitoring ritase bijih nikel, pengupasan overburden (OB), dan shift DOR tambang.',
        icon: '⛏️',
    },
    {
        key: 'geologi',
        title: 'Geologi & Eksplorasi',
        badge: 'Grade Control',
        desc: 'Database titik bor eksplorasi nikel, uji assay (%Ni, %Fe), dan pemodelan cadangan ore.',
        icon: '🧭',
    },
    {
        key: 'fleet',
        title: 'Kesiapan Alat Berat',
        badge: 'Plant & Alat Berat',
        desc: 'Kontrol unit excavator, dump truck nikel, rasio PA/MA, dan jam kerja (HM).',
        icon: '🚜',
    },
    {
        key: 'fleet-maintenance',
        title: 'Workshop & Perbaikan Unit',
        badge: 'Maintenance',
        desc: 'Jadwal servis berkala, perbaikan breakdown alat berat, dan backlog mekanik.',
        icon: '🔧',
    },
    {
        key: 'sparepart',
        title: 'Gudang & Suku Cadang',
        badge: 'Gudang Workshop',
        desc: 'Inventaris suku cadang, reorder point sparepart, dan stok komponen kritis.',
        icon: '📦',
    },
    {
        key: 'safety',
        title: 'Inspeksi K3 & HSE',
        badge: 'K3 Tambang Nikel',
        desc: 'Pencatatan hazard tambang nikel, investigasi insiden, dan jam kerja selamat.',
        icon: '⛑️',
    },
    {
        key: 'ritase',
        title: 'Ritase & Timbangan',
        badge: 'Weighbridge Site',
        desc: 'Verifikasi tonase bruto, tare, dan netto bijih nikel armada hauling.',
        icon: '🚛',
    },
    {
        key: 'jetty',
        title: 'Jetty & Tongkang LCT',
        badge: 'Pelabuhan Jetty',
        desc: 'Pemuatan ore nikel ke tongkang LCT, draught survey, dan surat persetujuan berlayar.',
        icon: '🚢',
    },
    {
        key: 'environment',
        title: 'Lingkungan & Reklamasi',
        badge: 'Lingkungan Hidup',
        desc: 'Pemantauan settling pond nikel, baku mutu TSS & pH, dan revegetasi pascatambang.',
        icon: '🌱',
    },
    {
        key: 'lingkungan',
        title: 'Kanal Pengendali Sedimen',
        badge: 'Sedimen & Air',
        desc: 'Pengendalian limpasan air tambang dan audit rona lingkungan tambang nikel.',
        icon: '🏞️',
    },
    {
        key: 'bbm',
        title: 'Tangki & BBM Solar',
        badge: 'Fuel Management',
        desc: 'Stok solar industri B35, pencatatan nozzle dispenser unit pit, dan burn rate.',
        icon: '⛽',
    },
    {
        key: 'finance',
        title: 'Kas & Finansial Site',
        badge: 'Finance Site',
        desc: 'Ledger pengeluaran kas kecil site, dropping dana operasional, dan rekonsiliasi.',
        icon: '💰',
    },
    {
        key: 'adm',
        title: 'Administrasi & Surat',
        badge: 'Site ADM',
        desc: 'Pengarsipan surat jalan pengangkutan ore nikel, izin masuk SIMP, dan persuratan.',
        icon: '📋',
    },
    {
        key: 'hrd',
        title: 'HRD & Ketenagakerjaan',
        badge: 'Human Resources',
        desc: 'Database pekerja tambang nikel, rotasi roster kerja, absensi, dan kebugaran.',
        icon: '👷‍♂️',
    },
    {
        key: 'ga',
        title: 'General Affair (GA)',
        badge: 'Fasilitas & Sarana',
        desc: 'Manajemen armada LV operasional, sarana genset site, dan infrastruktur camp.',
        icon: '🚙',
    },
    {
        key: 'assets',
        title: 'Manajemen Aset Tambang',
        badge: 'Asset Management',
        desc: 'Inventarisasi fisik fasilitas, penomoran kode barcode aset, dan audit depresiasi.',
        icon: '🏷️',
    },
    {
        key: 'mess',
        title: 'Hunian & Mess Karyawan',
        badge: 'Camp Accommodation',
        desc: 'Alokasi tempat tidur mess, pemeliharaan fasilitas kamar, dan kebersihan camp.',
        icon: '🏠',
    },
    {
        key: 'catering',
        title: 'Katering & Logistik Pangan',
        badge: 'Food Service',
        desc: 'Kontrol menu makanan bergizi kru tambang nikel dan jadwal suplai mess hall.',
        icon: '🍱',
    },
    {
        key: 'clinic',
        title: 'Klinik Medis Site',
        badge: 'Pelayanan Medis',
        desc: 'Pemeriksaan kesehatan pekerja, surat fit-to-work, dan penanganan darurat.',
        icon: '🏥',
    },
    {
        key: 'security',
        title: 'Security & Akses Gerbang',
        badge: 'Keamanan Site',
        desc: 'Pemeriksaan ID card gerbang masuk tambang, cek bagasi, dan buku tamu logistik.',
        icon: '🛡️',
    },
    {
        key: 'radio',
        title: 'Radio Komunikasi & Dispatch',
        badge: 'Dispatch Tambang',
        desc: 'Log komunikasi radio HT/SSB, pemanggilan unit pit, dan koordinasi darurat.',
        icon: '📻',
    },
    {
        key: 'legal',
        title: 'Legalitas & Perizinan IUP',
        badge: 'Hukum & Kepatuhan',
        desc: 'Kepatuhan IUP-OP nikel, dokumen RKAB ESDM, IPPKH, dan AMDAL operasional.',
        icon: '⚖️',
    },
    {
        key: 'csr',
        title: 'CSR & Hubungan Masyarakat',
        badge: 'Community Relations',
        desc: 'Program PPM/CSR desa lingkar tambang nikel dan komunikasi warga lokal.',
        icon: '🤝',
    },
    {
        key: 'vendor',
        title: 'Vendor & Kontraktor',
        badge: 'Mitra Usaha',
        desc: 'Daftar rekanan kontraktor penambangan nikel, subkontraktor, dan evaluasi vendor.',
        icon: '🏬',
    },
    {
        key: 'transport',
        title: 'Transportasi & Logistik Kru',
        badge: 'Mobilisasi Kru',
        desc: 'Jadwal bus penjemputan kru tambang, mobilisasi bandara, dan izin keluar area.',
        icon: '🚌',
    },
    {
        key: 'training',
        title: 'Pelatihan & Sertifikasi',
        badge: 'Training Center',
        desc: 'Pelatihan POP/POM, sertifikasi operator alat berat nikel, dan induksi keselamatan.',
        icon: '🎓',
    },
    {
        key: 'performance',
        title: 'Evaluasi Kinerja & KPI',
        badge: 'Performance KPI',
        desc: 'Pencapaian KPI produksi nikel, evaluasi disiplin kru, dan efisiensi operasional.',
        icon: '📈',
    },
    {
        key: 'it-helpdesk',
        title: 'IT Helpdesk & Jaringan VSAT',
        badge: 'Teknologi Informasi',
        desc: 'Kendala internet VSAT site tambang nikel, perawatan komputer, dan printer kantor.',
        icon: '💻',
    },
    {
        key: 'helpdesk',
        title: 'Helpdesk Sarana GA',
        badge: 'Bantuan Fasilitas',
        desc: 'Permintaan perbaikan fasilitas mess, AC kantor, dan saluran air bersih camp.',
        icon: '🛠️',
    },
    {
        key: 'investor',
        title: 'Portal Investor Tambang',
        badge: 'Investor Relations',
        desc: 'Transparansi pengapalan ore nikel, pendapatan, dan kepatuhan kuota RKAB ESDM.',
        icon: '📊',
    },
    {
        key: 'direktur',
        title: 'Eksekutif Direksi (BOD)',
        badge: 'Executive BOD',
        desc: 'Executive summary tambang nikel, tren produksi ore, dan ringkasan anggaran.',
        icon: '🏛️',
    },
    {
        key: 'laporan',
        title: 'Cetak Laporan Resmi',
        badge: 'Laporan DOR Nikel',
        desc: 'Format cetak resmi Daily Operation Report produksi nikel siap unduh PDF.',
        icon: '📄',
    },
]

interface CustomField {
    id: string
    module_key: string
    field_label: string
    field_name: string
    field_type: string
    is_required: boolean
    placeholder: string
}

export default function SuperAdminConsole() {
    const allowedSuperadminEmail = (process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || 'topcare77777@gmail.com').toLowerCase()
    const [authReady, setAuthReady] = useState(false)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [authEmail, setAuthEmail] = useState('')
    const [authPassword, setAuthPassword] = useState('')
    const [authError, setAuthError] = useState('')
    const [authSubmitting, setAuthSubmitting] = useState(false)
    const [activeMenu, setActiveMenu] = useState<'permissions' | 'form_builder' | 'users' | 'roles' | 'companies' | 'system' | 'audit'>('permissions')
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [companies, setCompanies] = useState<any[]>([])
    const [companyName, setCompanyName] = useState('')
    const [companySlug, setCompanySlug] = useState('')
    const [companyLogoUrl, setCompanyLogoUrl] = useState('')
    const [companyUserLimit, setCompanyUserLimit] = useState(25)
    const [companyAdminUserId, setCompanyAdminUserId] = useState('')
    const [companyIupStatus, setCompanyIupStatus] = useState('Belum Diverifikasi')
    const [companyRkabStatus, setCompanyRkabStatus] = useState('Belum Diverifikasi')
    const [savingCompany, setSavingCompany] = useState(false)

    // State Pengguna Baru
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // State Edit Pengguna
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
    const [editUserId, setEditUserId] = useState('')
    const [editFullName, setEditFullName] = useState('')
    const [editUsername, setEditUsername] = useState('')
    const [editRole, setEditRole] = useState('')

    // State Divisi
    const [roles, setRoles] = useState<any[]>([
        { id: '1', division: 'Administrator', position: 'Super Administrator', access_level: 'Full' },
        { id: '2', division: 'Operasional Pit Nikel', position: 'Pit Superintendent', access_level: 'Standard' },
        { id: '3', division: 'Geologi & Eksplorasi', position: 'Senior Geologist', access_level: 'Standard' },
        { id: '4', division: 'Keuangan & Administrasi', position: 'Finance & ADM Officer', access_level: 'Standard' },
        { id: '5', division: 'HSE & K3 Tambang', position: 'Safety Coordinator', access_level: 'Standard' },
        { id: '6', division: 'General Affair & Logistik', position: 'GA Supervisor', access_level: 'Standard' },
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

    // State Izin Modul per Divisi
    const [selectedDivisionForPermission, setSelectedDivisionForPermission] = useState('Administrator')
    const [divisionPermissions, setDivisionPermissions] = useState<Record<string, string[]>>({
        Administrator: OPERATIONAL_MODULE_CARDS.map((m) => m.key),
        'Operasional Pit Nikel': ['manager-site', 'geologi', 'fleet', 'fleet-maintenance', 'ritase', 'bbm', 'radio'],
        'Geologi & Eksplorasi': ['geologi', 'manager-site', 'ritase', 'laporan'],
        'Keuangan & Administrasi': ['finance', 'adm', 'hrd', 'assets', 'legal', 'laporan'],
        'HSE & K3 Tambang': ['safety', 'clinic', 'environment', 'lingkungan', 'training'],
        'General Affair & Logistik': ['adm', 'ga', 'assets', 'mess', 'catering', 'transport', 'sparepart', 'bbm', 'helpdesk'],
    })
    const [savingPermission, setSavingPermission] = useState(false)

    // State Modul Form Builder Dinamis
    const [selectedModuleForField, setSelectedModuleForField] = useState('bbm')
    const [customFields, setCustomFields] = useState<CustomField[]>([])
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false)
    const [newFieldLabel, setNewFieldLabel] = useState('')
    const [newFieldType, setNewFieldType] = useState('datetime-local')
    const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('')
    const [newFieldRequired, setNewFieldRequired] = useState(false)
    const [savingField, setSavingField] = useState(false)
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')

    useEffect(() => {
        verifyAdminSession()
    }, [])

    async function verifyAdminSession() {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) await authorizeAdmin(session.user)
        setAuthReady(true)
    }

    async function authorizeAdmin(user: { id: string; email?: string }) {
        const email = (user.email || '').toLowerCase().trim()
        if (email !== allowedSuperadminEmail) {
            await supabase.auth.signOut()
            setAuthError('Akun ini tidak memiliki akses developer.')
            setIsAuthorized(false)
            return false
        }

        const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).maybeSingle()
        const role = (profile?.role || '').toLowerCase().trim()
        const active = (profile?.status || 'Aktif').toLowerCase() !== 'nonaktif'
        if (!active || !['admin', 'administrator', 'superadmin'].includes(role)) {
            await supabase.auth.signOut()
            setAuthError('Akun belum memiliki role superadmin yang aktif.')
            setIsAuthorized(false)
            return false
        }

        setAuthError('')
        setIsAuthorized(true)
        return true
    }

    async function handleAdminLogin(e: React.FormEvent) {
        e.preventDefault()
        setAuthSubmitting(true)
        setAuthError('')
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })
        if (error || !data.user) {
            setAuthError('Email atau password tidak valid.')
        } else {
            await authorizeAdmin(data.user)
        }
        setAuthPassword('')
        setAuthSubmitting(false)
    }

    useEffect(() => {
        fetchUsers()
        fetchCompanies()
        fetchRoles()
        fetchPermissions()
        fetchCustomFields()
        fetchAuditLogs()
    }, [])

    useEffect(() => {
        const savedTheme = window.localStorage.getItem('pt-jeep-admin-theme')
        if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme)
    }, [])

    useEffect(() => {
        fetchCustomFields()
    }, [selectedModuleForField])

    async function fetchUsers() {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) setUsers(data)
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

    async function fetchCompanies() {
        const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
        if (!error && data) setCompanies(data)
    }

    async function fetchAuditLogs() {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('id, action, module, entity_type, entity_id, actor_email, actor_role, details, created_at')
            .order('created_at', { ascending: false })
            .limit(100)
        if (!error && data) setAuditLogs(data as AuditLog[])
    }

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(nextTheme)
        window.localStorage.setItem('pt-jeep-admin-theme', nextTheme)
    }

    async function handleCreateCompany(e: React.FormEvent) {
        e.preventDefault()
        if (!companyName.trim() || !companySlug.trim()) return
        setSavingCompany(true)
        try {
            const { data, error } = await supabase.rpc('create_company', {
                company_name: companyName.trim(),
                company_slug: companySlug.trim().toLowerCase(),
                company_logo_url: companyLogoUrl.trim() || null,
                company_user_limit: companyUserLimit,
                company_iup_status: companyIupStatus,
                company_rkab_status: companyRkabStatus,
            })
            if (error) throw error
            const createdCompany = Array.isArray(data) ? data[0] : data
            if (createdCompany?.id && companyAdminUserId) {
                const { error: mappingError } = await supabase.from('profiles').update({ company_id: createdCompany.id }).eq('id', companyAdminUserId)
                if (mappingError) throw mappingError
            }
            setCompanyName('')
            setCompanySlug('')
            setCompanyLogoUrl('')
            setCompanyUserLimit(25)
            setCompanyAdminUserId('')
            await fetchCompanies()
            await fetchAuditLogs()
            alert('Perusahaan baru berhasil dibuat dan siap dikonfigurasi.')
        } catch (err: any) {
            alert('Gagal membuat perusahaan: ' + (err?.message || 'Periksa migrasi dan hak akses superadmin.'))
        } finally {
            setSavingCompany(false)
        }
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
            // Fallback
        }
    }

    async function fetchCustomFields() {
        try {
            const { data, error } = await supabase
                .from('custom_form_fields')
                .select('*')
                .eq('module_key', selectedModuleForField)
                .order('created_at', { ascending: true })

            if (!error && data) {
                setCustomFields(data)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleCreateCustomField = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFieldLabel) return

        setSavingField(true)
        const fieldNameGenerated = newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')

        const payload = {
            module_key: selectedModuleForField,
            field_label: newFieldLabel,
            field_name: fieldNameGenerated,
            field_type: newFieldType,
            placeholder: newFieldPlaceholder,
            is_required: newFieldRequired,
        }

        const { data, error } = await supabase
            .from('custom_form_fields')
            .insert([payload])
            .select()

        if (!error && data) {
            setCustomFields([...customFields, data[0]])
            setIsFieldModalOpen(false)
            setNewFieldLabel('')
            setNewFieldPlaceholder('')
            setNewFieldRequired(false)
            alert(`Kolom "${newFieldLabel}" berhasil ditambahkan ke modul [${selectedModuleForField}]!`)
        } else {
            alert('Gagal membuat kolom: ' + (error?.message || 'Periksa tabel custom_form_fields di Supabase.'))
        }
        setSavingField(false)
    }

    const handleDeleteCustomField = async (fieldId: string, label: string) => {
        if (!confirm(`Hapus kolom input "${label}" dari modul ini?`)) return

        const { error } = await supabase.from('custom_form_fields').delete().eq('id', fieldId)
        if (!error) {
            setCustomFields(customFields.filter((f) => f.id !== fieldId))
        } else {
            alert('Gagal menghapus kolom: ' + error.message)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
            if (authError) throw authError

            if (authData.user?.id) {
                await supabase.from('profiles').insert([
                    {
                        id: authData.user.id,
                        full_name: fullName,
                        username,
                        email,
                        role: role || selectedDivisionForPermission,
                        status: 'Aktif',
                    },
                ])
            }
            alert('Pengguna baru berhasil didaftarkan!')
            setIsModalOpen(false)
            setFullName('')
            setUsername('')
            setEmail('')
            setPassword('')
            fetchUsers()
        } catch (err: any) {
            alert('Gagal: ' + err.message)
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

        if (!error) {
            alert('Data pengguna berhasil diperbarui!')
            setIsEditUserModalOpen(false)
            fetchUsers()
        } else {
            alert('Gagal: ' + error.message)
        }
    }

    const handleDeleteUser = async (id: string, emailUser: string) => {
        if (!confirm(`Hapus akun ${emailUser}?`)) return
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (!error) fetchUsers()
    }

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Aktif' ? 'Non-Aktif' : 'Aktif'
        const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id)
        if (!error) fetchUsers()
    }

    const handleAddRole = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!divisionName) return

        const newRoleItem = {
            id: Date.now().toString(),
            division: divisionName,
            position: positionName || 'Staff Operasional',
            access_level: accessLevel,
        }

        const { error } = await supabase.from('roles').insert([
            {
                division: divisionName,
                position: positionName,
                access_level: accessLevel,
            },
        ])

        if (!error) {
            alert('Divisi berhasil disimpan ke database!')
            fetchRoles()
        } else {
            setRoles([newRoleItem, ...roles])
            alert('Divisi ditambahkan secara lokal.')
        }

        setDivisionPermissions((prev) => ({
            ...prev,
            [divisionName]: ['manager-site', 'geologi', 'ritase', 'adm'],
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

        if (!error) {
            alert('Divisi berhasil diperbarui!')
            fetchRoles()
        } else {
            setRoles(
                roles.map((item) =>
                    item.id === editRoleId
                        ? { ...item, division: editDivisionName, position: editPositionName, access_level: editAccessLevel }
                        : item
                )
            )
        }
        setIsEditRoleModalOpen(false)
    }

    const handleDeleteRole = async (id: string) => {
        if (!confirm('Hapus divisi ini?')) return
        const { error } = await supabase.from('roles').delete().eq('id', id)
        if (!error) fetchRoles()
        else setRoles(roles.filter((r) => r.id !== id))
    }

    const handleToggleModulePermission = (moduleKey: string) => {
        const currentList = divisionPermissions[selectedDivisionForPermission] || []
        const updated = currentList.includes(moduleKey)
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
                .select()

            if (error) {
                alert('Gagal simpan ke Supabase: ' + error.message)
            } else {
                alert(`Hak akses divisi "${selectedDivisionForPermission}" (${allowedModules.length} modul) BERHASIL disimpan ke database!`)
            }
        } catch (err: any) {
            alert('Kendala koneksi database: ' + (err?.message || err))
        } finally {
            setSavingPermission(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'
    }

    const currentAllowed = divisionPermissions[selectedDivisionForPermission] || []

    if (!authReady) {
        return <div className="min-h-screen bg-[#070b12] text-white flex items-center justify-center text-sm">Memverifikasi akses developer...</div>
    }

    if (!isAuthorized) {
        return (
            <main className="min-h-screen bg-[#070b12] text-white flex items-center justify-center p-5">
                <form onSubmit={handleAdminLogin} className="w-full max-w-sm bg-[#0c121e] border border-[#263752] rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="text-center"><div className="text-3xl mb-2">🔐</div><h1 className="text-xl font-black">Akses Internal Developer</h1><p className="text-xs text-slate-400 mt-2">Halaman ini hanya untuk akun superadmin yang terdaftar.</p></div>
                    <input type="email" required autoComplete="username" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email superadmin" className="w-full bg-[#070b12] border border-[#263752] rounded-lg px-3 py-2.5 text-sm text-white" />
                    <input type="password" required autoComplete="current-password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password" className="w-full bg-[#070b12] border border-[#263752] rounded-lg px-3 py-2.5 text-sm text-white" />
                    {authError && <p className="text-xs text-rose-300 bg-rose-950/30 border border-rose-800/40 rounded-lg p-3">{authError}</p>}
                    <button type="submit" disabled={authSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black py-2.5 rounded-lg text-sm">{authSubmitting ? 'Memverifikasi...' : 'Masuk'}</button>
                </form>
            </main>
        )
    }

    return (
        <div className={`admin-page flex h-screen bg-[#070b12] text-slate-200 font-sans overflow-hidden select-none ${theme === 'light' ? 'admin-light' : ''}`}>
            {/* Sidebar Navigasi Konsol */}
            <aside className="w-64 bg-[#0c121e] border-r border-[#1a2333] flex flex-col">
                <div className="p-5 border-b border-[#1a2333]">
                    <div className="text-[10px] text-amber-400 font-mono tracking-widest mb-1">
                        PT. JANGKAR ENERGI EKA PERKASA
                    </div>
                    <h1 className="text-base font-black text-white tracking-tight leading-none">Konsol Developer</h1>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Akses & Modul Tambang</p>

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
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 font-mono font-bold">
                            {OPERATIONAL_MODULE_CARDS.length} MODUL
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveMenu('form_builder')}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeMenu === 'form_builder'
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                            : 'text-slate-400 hover:bg-[#131d2e] hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <span>📝</span>
                            <span>Kustomisasi Form Modul</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 font-mono">BUILDER</span>
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
                    <button
                        onClick={() => setActiveMenu('companies')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeMenu === 'companies'
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'text-slate-400 hover:bg-[#131d2e] hover:text-white'
                            }`}
                    >
                        <span>🏢</span> <span>Perusahaan / Tenant</span>
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
                    <button
                        onClick={toggleTheme}
                        className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                        {theme === 'dark' ? '☀️ Aktifkan Mode Terang' : '🌙 Aktifkan Mode Gelap'}
                    </button>
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
                {/* TAB: HAK AKSES MODUL */}
                {activeMenu === 'permissions' && (
                    <div className="space-y-6 max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a273b] pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                                    <span>🔑</span> Hak Akses Modul Operasional Tambang Nikel
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Pilih divisi untuk mengonfigurasi aplikasi mana saja (dari seluruh {OPERATIONAL_MODULE_CARDS.length} modul site) yang diizinkan untuk dibuka.
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

                {/* TAB: KUSTOMISASI FORM MODUL */}
                {activeMenu === 'form_builder' && (
                    <div className="space-y-6 max-w-5xl mx-auto">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a273b] pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                                    <span>📝</span> Kustomisasi Input Form Modul Site
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Tambahkan fasilitas kolom baru (seperti tanggal, waktu, no. dokumen, dll.) ke formulir modul tanpa perlu mengubah kode.
                                </p>
                            </div>

                            <button
                                onClick={() => setIsFieldModalOpen(true)}
                                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black px-4 py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                            >
                                <span>+</span> <span>Tambah Kolom Input Baru</span>
                            </button>
                        </div>

                        <div className="bg-[#0b1320] border border-[#1a273b] rounded-xl p-5 shadow-xl flex items-center gap-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Pilih Modul yang Ingin Ditambahkan Form:
                            </label>
                            <select
                                value={selectedModuleForField}
                                onChange={(e) => setSelectedModuleForField(e.target.value)}
                                className="bg-[#060a10] border border-cyan-500 text-cyan-300 font-bold text-xs px-4 py-2 rounded-lg focus:outline-none"
                            >
                                {OPERATIONAL_MODULE_CARDS.map((m) => (
                                    <option key={m.key} value={m.key}>
                                        {m.icon} {m.title} ({m.key})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-[#0b1320] border border-[#1a273b] rounded-xl p-5 shadow-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Daftar Kolom Tambahan di Modul <span className="text-cyan-400 font-mono font-black">[{selectedModuleForField}]</span>
                                </h3>
                                <span className="text-xs text-slate-400 font-mono">
                                    Total: <strong className="text-white">{customFields.length}</strong> Kolom Kustom
                                </span>
                            </div>

                            <div className="border border-[#16273c] rounded-lg overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#060a10] text-slate-400 border-b border-[#16273c]">
                                        <tr>
                                            <th className="p-3">Label Kolom</th>
                                            <th className="p-3">Nama Variabel (ID)</th>
                                            <th className="p-3">Tipe Input</th>
                                            <th className="p-3 text-center">Wajib Diisi</th>
                                            <th className="p-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#16273c] text-slate-300">
                                        {customFields.length > 0 ? (
                                            customFields.map((f) => (
                                                <tr key={f.id} className="hover:bg-[#0c1626] transition">
                                                    <td className="p-3 font-bold text-white">{f.field_label}</td>
                                                    <td className="p-3 font-mono text-cyan-300">{f.field_name}</td>
                                                    <td className="p-3">
                                                        <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                                            {f.field_type}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {f.is_required ? (
                                                            <span className="text-amber-400 font-bold">Wajib</span>
                                                        ) : (
                                                            <span className="text-slate-500">Opsional</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => handleDeleteCustomField(f.id, f.field_label)}
                                                            className="text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-800/40 text-[10px] px-2.5 py-1 rounded transition cursor-pointer"
                                                        >
                                                            Hapus Kolom
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                                                    Belum ada kolom kustom di modul ini. Klik tombol di atas untuk menambahkan fasilitas tanggal, jam, atau kolom baru lainnya.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeMenu === 'companies' && (
                    <div className="space-y-6 max-w-6xl mx-auto">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-2.5"><span>🏢</span> Perusahaan / Tenant</h2>
                            <p className="text-xs text-slate-400 mt-1">Buat platform terpisah untuk perusahaan tambang baru tanpa mencampur data tenant lain.</p>
                        </div>
                        <form onSubmit={handleCreateCompany} className="bg-[#0b1320] border border-emerald-500/30 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 text-sm font-bold text-emerald-300">Buat Perusahaan Baru</div>
                            <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nama perusahaan, contoh: PT. Vidia Indo Samudera" className="bg-[#060a10] border border-[#1f2f47] rounded-lg px-3 py-2.5 text-xs text-white" />
                            <input required value={companySlug} onChange={(e) => setCompanySlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '-'))} placeholder="Slug URL, contoh: pt-vidia-indo-samudera" className="bg-[#060a10] border border-[#1f2f47] rounded-lg px-3 py-2.5 text-xs text-white font-mono" />
                            <input value={companyLogoUrl} onChange={(e) => setCompanyLogoUrl(e.target.value)} placeholder="URL logo (opsional)" className="bg-[#060a10] border border-[#1f2f47] rounded-lg px-3 py-2.5 text-xs text-white" />
                            <input type="number" min={1} value={companyUserLimit} onChange={(e) => setCompanyUserLimit(Number(e.target.value))} placeholder="Batas pengguna" className="bg-[#060a10] border border-[#1f2f47] rounded-lg px-3 py-2.5 text-xs text-white" />
                            <select value={companyAdminUserId} onChange={(e) => setCompanyAdminUserId(e.target.value)} className="bg-[#060a10] border border-[#1f2f47] rounded-lg px-3 py-2.5 text-xs text-white">
                                <option value="">Pilih admin awal (opsional)</option>
                                {users.map((user) => <option key={user.id} value={user.id}>{user.full_name || user.email || user.id}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <select value={companyIupStatus} onChange={(e) => setCompanyIupStatus(e.target.value)} className="bg-[#060a10] border border-[#1f2f47] rounded-lg px-3 py-2.5 text-xs text-white"><option>Belum Diverifikasi</option><option>Dalam Verifikasi</option><option>Terverifikasi</option><option>Ditolak</option></select>
                                <select value={companyRkabStatus} onChange={(e) => setCompanyRkabStatus(e.target.value)} className="bg-[#060a10] border border-[#1f2f47] rounded-lg px-3 py-2.5 text-xs text-white"><option>Belum Diverifikasi</option><option>Dalam Verifikasi</option><option>Terverifikasi</option><option>Ditolak</option></select>
                            </div>
                            <button type="submit" disabled={savingCompany} className="md:col-span-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black px-5 py-2.5 rounded-lg text-xs">{savingCompany ? 'Membuat perusahaan...' : '＋ Buat Platform Perusahaan'}</button>
                        </form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {companies.map((company) => <div key={company.id} className="bg-[#0b1320] border border-[#1a273b] rounded-xl p-5"><div className="flex justify-between gap-3"><div><div className="font-bold text-white">{company.name}</div><div className="text-[11px] text-slate-500 font-mono mt-1">/{company.slug}</div></div><span className="text-[10px] text-emerald-300 border border-emerald-500/30 rounded px-2 py-1 h-fit">{company.status}</span></div><div className="grid grid-cols-3 gap-2 mt-4 text-[10px] text-slate-400"><div>IUP<br /><strong className="text-slate-200">{company.iup_status}</strong></div><div>RKAB<br /><strong className="text-slate-200">{company.rkab_status}</strong></div><div>Limit user<br /><strong className="text-slate-200">{company.user_limit}</strong></div></div></div>)}
                            {companies.length === 0 && <div className="text-xs text-slate-500">Belum ada data perusahaan atau migrasi belum dijalankan.</div>}
                        </div>
                    </div>
                )}

                {/* TAB: MANAJEMEN PENGGUNA */}
                {activeMenu === 'users' && (
                    <div className="space-y-6 max-w-6xl mx-auto">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Manajemen Pengguna</h2>
                                <p className="text-sm text-slate-500">Data akun karyawan tambang nikel PT. Jangkar Energi Eka Perkasa.</p>
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
                                            <th className="p-4">Divisi</th>
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
                            <p className="text-sm text-slate-500">Struktur divisi operasional penambangan nikel PT. Jangkar Energi Eka Perkasa.</p>
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
                                        placeholder="Contoh: Divisi Hauling Nikel"
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
                                        placeholder="Contoh: Foreman Hauling"
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
                                <div className="text-xs text-slate-400">Infrastruktur Server</div>
                                <div className="text-lg font-bold text-cyan-400 mt-1">Vercel Edge Network Aktif</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: LOG AUDIT */}
                {activeMenu === 'audit' && (
                    <div className="max-w-4xl mx-auto space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div><h2 className="text-2xl font-bold text-white">Log Audit Sistem</h2><p className="text-xs text-slate-400 mt-1">Aktivitas nyata user, admin, dan perubahan data dari database.</p></div>
                            <button onClick={fetchAuditLogs} className="bg-[#16233a] border border-[#2a3d5f] text-cyan-300 rounded-lg px-3 py-2 text-xs">↻ Refresh</button>
                        </div>
                        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                            {auditLogs.length === 0 ? <div className="p-6 text-xs text-slate-500">Belum ada log. Jalankan migrasi audit lalu lakukan aktivitas di aplikasi.</div> : <div className="divide-y divide-[#222]">{auditLogs.map((log) => <div key={log.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"><div><div className="text-white font-semibold">{log.action.toUpperCase()} · {log.module}</div><div className="text-slate-500 mt-1">{log.entity_type || 'system'} {log.entity_id ? `#${log.entity_id}` : ''} · {log.actor_email || 'system'}{log.actor_role ? ` (${log.actor_role})` : ''}</div></div><time className="text-slate-500 font-mono">{new Date(log.created_at).toLocaleString('id-ID')}</time></div>)}</div>}
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL BUAT KOLOM FORM KUSTOM BARU */}
            {isFieldModalOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0b1320] border border-cyan-500/50 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <h3 className="text-base font-bold text-white uppercase tracking-wider">
                            Tambah Input Form Modul [{selectedModuleForField}]
                        </h3>
                        <form onSubmit={handleCreateCustomField} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Label Kolom Form</label>
                                <input
                                    type="text"
                                    required
                                    value={newFieldLabel}
                                    onChange={(e) => setNewFieldLabel(e.target.value)}
                                    placeholder="Contoh: Waktu & Tanggal Ritase / No. Segel"
                                    className="w-full bg-[#060a10] border border-[#1b273b] rounded p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Tipe Input</label>
                                    <select
                                        value={newFieldType}
                                        onChange={(e) => setNewFieldType(e.target.value)}
                                        className="w-full bg-[#060a10] border border-[#1b273b] rounded p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-bold"
                                    >
                                        <option value="datetime-local">Tanggal & Waktu (WITA)</option>
                                        <option value="date">Tanggal Saja</option>
                                        <option value="time">Waktu / Pukul Saja</option>
                                        <option value="text">Teks Bebas</option>
                                        <option value="number">Angka / Tonase / HM</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Sifat Input</label>
                                    <select
                                        value={newFieldRequired ? 'yes' : 'no'}
                                        onChange={(e) => setNewFieldRequired(e.target.value === 'yes')}
                                        className="w-full bg-[#060a10] border border-[#1b273b] rounded p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                                    >
                                        <option value="no">Opsional</option>
                                        <option value="yes">Wajib Diisi (Required)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Petunjuk Placeholder (Opsional)</label>
                                <input
                                    type="text"
                                    value={newFieldPlaceholder}
                                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                                    placeholder="Contoh: Masukkan tanggal transaksi..."
                                    className="w-full bg-[#060a10] border border-[#1b273b] rounded p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div className="flex space-x-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFieldModalOpen(false)}
                                    className="flex-1 bg-[#131d2e] border border-[#1f2f47] text-slate-300 py-2.5 rounded-lg text-xs"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingField}
                                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded-lg text-xs"
                                >
                                    {savingField ? 'Menyimpan...' : 'Tambahkan Kolom'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                placeholder="Password (Min. 6 Karakter)"
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
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-amber-500 text-black py-2.5 rounded text-sm font-bold">
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

interface AuditLog {
    id: string
    action: string
    module: string
    entity_type: string | null
    entity_id: string | null
    actor_email: string | null
    actor_role: string | null
    details: Record<string, unknown>
    created_at: string
}
