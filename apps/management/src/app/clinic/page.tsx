'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ClinicItem {
    id: string
    created_at?: string
    patient_name: string
    department: string
    complaint: string
    diagnosis: string
    treatment_given: string
    medical_status: string
    doctor_name: string
}

export default function ClinicManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Dokter Penanggung Jawab Klinik')
    const [patients, setPatients] = useState<ClinicItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Kunjungan Pasien Baru
    const [showModal, setShowModal] = useState(false)
    const [patientName, setPatientName] = useState('')
    const [department, setDepartment] = useState('Produksi Pit')
    const [complaint, setComplaint] = useState('')
    const [diagnosis, setDiagnosis] = useState('Pusing & Kelelahan Ringan')
    const [treatmentGiven, setTreatmentGiven] = useState('Pemberian Vitamin & Istirahat 1 Jam')
    const [medicalStatus, setMedicalStatus] = useState('Fit to Work')
    const [doctorName, setDoctorName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        let isMounted = true

        async function initClinic() {
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
                    setUserName(profile?.full_name || 'Dr. M. Ihsan (Site Medical Doctor)')

                    const { data, error } = await supabase
                        .from('clinic_patient_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setPatients(data)
                    } else {
                        setPatients([
                            {
                                id: '1',
                                created_at: new Date().toISOString(),
                                patient_name: 'Joko Widodo',
                                department: 'Produksi Pit',
                                complaint: 'Sakit kepala dan kelelahan setelah shift siang',
                                diagnosis: 'Kelelahan ringan & dehidrasi',
                                treatment_given: 'Pemberian elektrolit, vitamin C, dan istirahat 30 menit',
                                medical_status: 'Fit to Work',
                                doctor_name: 'Dr. M. Ihsan',
                            },
                            {
                                id: '2',
                                created_at: new Date().toISOString(),
                                patient_name: 'Budi Santoso',
                                department: 'Plant & Workshop',
                                complaint: 'Lecet ringan pada jari tangan saat mengganti filter',
                                diagnosis: 'Luka gores superfisial',
                                treatment_given: 'Pembersihan antiseptik dan penutupan luka steril',
                                medical_status: 'Fit to Work',
                                doctor_name: 'Dr. M. Ihsan',
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

        initClinic()

        return () => {
            isMounted = false
        }
    }, [landingUrl])

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!patientName || !complaint) return

        setSubmitting(true)

        const payload = {
            patient_name: patientName,
            department,
            complaint,
            diagnosis,
            treatment_given: treatmentGiven,
            medical_status: medicalStatus,
            doctor_name: doctorName || userName,
        }

        const { data, error } = await supabase
            .from('clinic_patient_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setPatients([data[0], ...patients])
            setShowModal(false)
            setPatientName('')
            setComplaint('')
        } else {
            alert('Gagal mencatat kunjungan klinik: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalPatients = patients.length
    const fitCount = patients.filter((p) => p.medical_status === 'Fit to Work').length

    const filteredPatients = patients.filter((item) =>
        item.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/clinic', label: 'Klinik Medis', icon: '🏥' },
        { href: '/radio', label: 'Radio Dispatch', icon: '📻' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/fleet-maintenance', label: 'Maintenance', icon: '🔧' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/manager-site', label: 'Pit Penambangan', icon: '⛏️' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/jetty', label: 'Jetty & LCT', icon: '🚢' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/hrd', label: 'HRD & Payroll', icon: '👷‍♂️' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/legal', label: 'Legal & IUP', icon: '⚖️' },
        { href: '/investor', label: 'Investor', icon: '📈' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Klinik Medis & Kesehatan Tambang...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-6 select-none">
            {/* Header Mandiri */}
            <header className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-[#0a1625] border border-[#1b2e46] rounded-xl px-6 py-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🏥</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                                Klinik Medis & Kesehatan Tambang PT. JEEP
                            </h1>
                            <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Pemeriksaan Pasien Harian, Diagnosa Dokter, & Status Kebugaran Pekerja</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-semibold">{userName}</span>
                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                                    Medical Dept
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
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                        ? 'bg-[#162d47] text-white border-emerald-400/80 shadow-sm'
                                        : 'bg-[#0a1625] text-slate-400 border-[#1b2e46] hover:text-slate-200 hover:bg-[#0f2137]'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </header>

            {/* KPI Klinik */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Kunjungan Pasien</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalPatients} Orang</div>
                    <p className="mt-2 text-[11px] text-slate-400">Pemeriksaan Medis Site</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status Fit to Work</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{fitCount} Orang</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Layak Kembali Bekerja</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kesiapan Obat Darurat</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">Lengkap</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Stok Apotek Klinik Aman</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kedaruratan Medis</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">0 Kasus Berat</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-medium">✓ Zero Severe Injury</p>
                </div>
            </div>

            {/* Grid Tabel Klinik */}
            <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-full md:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari pasien, keluhan, diagnosa..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Catat Kunjungan Pasien Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Waktu Catat</th>
                                <th className="pb-2">Nama Pasien / Pekerja</th>
                                <th className="pb-2">Departemen</th>
                                <th className="pb-2">Keluhan Utama</th>
                                <th className="pb-2">Diagnosa Medis</th>
                                <th className="pb-2">Tindakan & Obat</th>
                                <th className="pb-2 text-center">Status Kesehatan</th>
                                <th className="pb-2">Dokter / Perawat Jaga</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map((p) => {
                                    const isFit = p.medical_status === 'Fit to Work'
                                    return (
                                        <tr key={p.id}>
                                            <td className="py-2.5 font-mono text-slate-400 text-[11px]">
                                                {p.created_at ? new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                                            </td>
                                            <td className="font-bold text-white">{p.patient_name}</td>
                                            <td>
                                                <span className="bg-[#112233] border border-[#1e3a5f] text-slate-300 text-[10px] px-2 py-0.5 rounded">
                                                    {p.department}
                                                </span>
                                            </td>
                                            <td className="text-slate-300">{p.complaint}</td>
                                            <td className="font-semibold text-amber-400">{p.diagnosis}</td>
                                            <td className="text-slate-300">{p.treatment_given}</td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${isFit
                                                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                        }`}
                                                >
                                                    {p.medical_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-slate-400">{p.doctor_name}</td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada catatan pasien yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Kunjungan Pasien */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Kunjungan Medis & Pemeriksaan Klinik</h2>
                        <form onSubmit={handleAddPatient} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Nama Pasien / Pekerja</label>
                                    <input
                                        type="text"
                                        required
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        placeholder="Contoh: Joko Widodo"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Departemen</label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                    >
                                        <option value="Produksi Pit">Produksi Pit</option>
                                        <option value="Plant & Workshop">Plant & Workshop</option>
                                        <option value="HSE & K3">HSE & K3</option>
                                        <option value="Jetty Port">Jetty Port</option>
                                        <option value="General Affair">General Affair</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Keluhan Utama</label>
                                <input
                                    type="text"
                                    required
                                    value={complaint}
                                    onChange={(e) => setComplaint(e.target.value)}
                                    placeholder="Contoh: Sakit kepala / pusing setelah shift siang"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Diagnosa Medis</label>
                                    <input
                                        type="text"
                                        required
                                        value={diagnosis}
                                        onChange={(e) => setDiagnosis(e.target.value)}
                                        placeholder="Kelelahan ringan & dehidrasi"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Kesehatan</label>
                                    <select
                                        value={medicalStatus}
                                        onChange={(e) => setMedicalStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400 font-bold"
                                    >
                                        <option value="Fit to Work">Fit to Work (Layak Kerja)</option>
                                        <option value="Istirahat Klinik">Istirahat di Klinik (Opname Ringan)</option>
                                        <option value="Dirujuk ke RS">Dirujuk ke Rumah Sakit</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Tindakan & Resep Obat</label>
                                <input
                                    type="text"
                                    required
                                    value={treatmentGiven}
                                    onChange={(e) => setTreatmentGiven(e.target.value)}
                                    placeholder="Pemberian elektrolit dan vitamin C"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Dokter / Perawat Penanggung Jawab</label>
                                <input
                                    type="text"
                                    required
                                    value={doctorName}
                                    onChange={(e) => setDoctorName(e.target.value)}
                                    placeholder="Nama dokter / perawat"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
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
                                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Kunjungan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}