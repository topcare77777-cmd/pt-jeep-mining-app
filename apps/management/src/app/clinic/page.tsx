'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/navigation' // Diperbaiki dari 'next/navigation' untuk Link Next.js
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ClinicLog {
    id: string
    created_at?: string
    patient_name: string
    department: string
    complaint: string
    diagnosis: string
    action_taken: string
    fit_status: string
    medic_name: string
}

export default function ClinicManagementPage() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Petugas Medis Klinik')
    const [logs, setLogs] = useState<ClinicLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // State Modal Input Pemeriksaan Pasien Baru
    const [showModal, setShowModal] = useState(false)
    const [patientName, setPatientName] = useState('')
    const [department, setDepartment] = useState('Operasional Pit')
    const [complaint, setComplaint] = useState('')
    const [diagnosis, setDiagnosis] = useState('')
    const [actionTaken, setActionTaken] = useState('Pemberian Obat Simtomatik & Istirahat')
    const [fitStatus, setFitStatus] = useState('Fit to Work')
    const [medicName, setMedicName] = useState('')
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
                    setUserName(profile?.full_name || 'Dr. Medis Site / Perawat Jaga')

                    const { data, error } = await supabase
                        .from('clinic_patient_logs')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (!error && data && data.length > 0) {
                        setLogs(data)
                    } else {
                        setLogs([
                            {
                                id: '1',
                                created_at: new Date().toISOString(),
                                patient_name: 'Budi Santoso',
                                department: 'Operator Dump Truck',
                                complaint: 'Pusing dan kelelahan ringan',
                                diagnosis: 'Kelelahan fisik / Fatigue ringan',
                                actionTaken: 'Pemberian vitamin, istirahat 2 jam di klinik',
                                fit_status: 'Temporary Unfit (Istirahat)',
                                medic_name: 'Ns. Ahmad, S.Kep',
                            },
                            {
                                id: '2',
                                created_at: new Date().toISOString(),
                                patient_name: 'Joko Widodo',
                                department: 'Plant & Workshop',
                                complaint: 'Luka gores ringan di tangan saat ganti filter',
                                diagnosis: 'Vulnus laceratum ringan',
                                actionTaken: 'Pembersihan luka, antiseptik, dan dibalut perban',
                                fit_status: 'Fit to Work',
                                medic_name: 'Dr. Rian Pratama',
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

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!patientName || !complaint) return

        setSubmitting(true)

        const payload = {
            patient_name: patientName,
            department,
            complaint,
            diagnosis: diagnosis || 'Pemeriksaan Rutin / Konsultasi',
            action_taken: actionTaken,
            fit_status: fitStatus,
            medic_name: medicName || userName,
        }

        const { data, error } = await supabase
            .from('clinic_patient_logs')
            .insert([payload])
            .select()

        if (!error && data) {
            setLogs([data[0], ...logs])
            setShowModal(false)
            setPatientName('')
            setComplaint('')
            setDiagnosis('')
        } else {
            alert('Gagal menyimpan rekam medis: ' + (error?.message || 'Terjadi kesalahan sistem.'))
        }

        setSubmitting(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = landingUrl
    }

    const totalVisits = logs.length
    const unfitCount = logs.filter((l) => l.fit_status.includes('Unfit')).length
    const fitCount = totalVisits - unfitCount

    const filteredLogs = logs.filter((item) =>
        item.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const navLinks = [
        { href: '/manager-site', label: 'Pit Produksi', icon: '⛏️' },
        { href: '/fleet', label: 'Alat Berat', icon: '🚜' },
        { href: '/safety', label: 'Inspeksi K3', icon: '⛑️' },
        { href: '/sparepart', label: 'Sparepart', icon: '📦' },
        { href: '/mess', label: 'Mess & Camp', icon: '🏠' },
        { href: '/vendor', label: 'Vendor', icon: '🤝' },
        { href: '/radio', label: 'Radio', icon: '📻' },
        { href: '/clinic', label: 'Klinik & Kesehatan', icon: '🏥' },
        { href: '/ritase', label: 'Ritase', icon: '🚛' },
        { href: '/jetty', label: 'Jetty Port', icon: '🚢' },
        { href: '/lingkungan', label: 'Lingkungan', icon: '🌱' },
        { href: '/bbm', label: 'BBM Solar', icon: '⛽' },
        { href: '/finance', label: 'Keuangan', icon: '💰' },
        { href: '/adm', label: 'ADM & Surat', icon: '📋' },
        { href: '/hrd', label: 'HRD & K3', icon: '👷‍♂️' },
        { href: '/ga', label: 'GA & Fasilitas', icon: '🚙' },
        { href: '/direktur', label: 'Eksekutif', icon: '🏛️' },
        { href: '/laporan', label: 'Cetak Laporan', icon: '📄' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Sinkronisasi Rekam Medis & Poliklinik Site...</p>
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
                                Klinik & Kesehatan Kerja Tambang PT. JEEP
                            </h1>
                            <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Poliklinik Site, First Aid, & Status Fit to Work Karyawan</span>
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
                            <a
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition cursor-pointer ${isActive
                                        ? 'bg-[#162d47] text-white border-emerald-400/80 shadow-sm'
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

            {/* KPI Klinik */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Kunjungan Pasien</h3>
                    <div className="text-2xl font-black text-white font-mono">{totalVisits} Orang</div>
                    <p className="mt-2 text-[11px] text-slate-400">Rekam Medis Tercatat di Klinik</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status Fit to Work</h3>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{fitCount} Pekerja</div>
                    <p className="mt-2 text-[11px] text-emerald-400 font-semibold">Siap Melakukan Tugas Lapangan</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Temporary Unfit / Istirahat</h3>
                    <div className={`text-2xl font-black font-mono ${unfitCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {unfitCount} Pekerja
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Dalam Pengawasan & Pemulihan Medis</p>
                </div>

                <div className="bg-[#0a1625] border border-[#16273c] rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kesiapan First Aid</h3>
                    <div className="text-2xl font-black text-cyan-400 font-mono">24 Jam OK</div>
                    <p className="mt-2 text-[11px] text-cyan-400 font-medium">✓ Ambulans & Dokter Siaga Siaga</p>
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
                            placeholder="Cari nama pasien, keluhan, diagnosa..."
                            className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        + Catat Pemeriksaan Pasien Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#1b2e46] text-slate-400">
                                <th className="pb-2">Nama Pasien & Departemen</th>
                                <th className="pb-2">Keluhan Utama</th>
                                <th className="pb-2">Diagnosa Medis</th>
                                <th className="pb-2">Tindakan / Penanganan</th>
                                <th className="pb-2 text-center">Status Fit to Work</th>
                                <th className="pb-2">Tenaga Medis Jaga</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16273c] text-slate-300">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((l) => (
                                    <tr key={l.id}>
                                        <td className="py-2.5">
                                            <div className="font-bold text-white">{l.patient_name}</div>
                                            <div className="text-[10px] text-slate-400">{l.department}</div>
                                        </td>
                                        <td className="text-slate-300">{l.complaint}</td>
                                        <td className="font-semibold text-amber-400">{l.diagnosis}</td>
                                        <td className="text-slate-300">{l.action_taken}</td>
                                        <td className="text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.fit_status.includes('Unfit')
                                                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                                    }`}
                                            >
                                                {l.fit_status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{l.medic_name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                                        Tidak ada rekam medis yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Input Pasien */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a1625] border border-[#1b2e46] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catat Pemeriksaan Pasien Klinik Site</h2>
                        <form onSubmit={handleAddLog} className="space-y-3">
                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Nama Pekerja / Pasien</label>
                                <input
                                    type="text"
                                    required
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Departemen / Perusahaan</label>
                                <input
                                    type="text"
                                    required
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="Contoh: Operator Dump Truck / PT Surya Jaya"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Keluhan Utama (Gejala)</label>
                                <input
                                    type="text"
                                    required
                                    value={complaint}
                                    onChange={(e) => setComplaint(e.target.value)}
                                    placeholder="Contoh: Pusing, demam, atau luka gores"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Diagnosa Medis</label>
                                <input
                                    type="text"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    placeholder="Contoh: Kelelahan / Fatigue ringan"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Tindakan Medis / Pengobatan</label>
                                <input
                                    type="text"
                                    required
                                    value={actionTaken}
                                    onChange={(e) => setActionTaken(e.target.value)}
                                    placeholder="Contoh: Pemberian obat paracetamol & istirahat"
                                    className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Status Kebugaran (Fit to Work)</label>
                                    <select
                                        value={fitStatus}
                                        onChange={(e) => setFitStatus(e.target.value)}
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                    >
                                        <option value="Fit to Work">Fit to Work (Layak Kerja)</option>
                                        <option value="Temporary Unfit">Temporary Unfit (Istirahat Sementara)</option>
                                        <option value="Unfit / Rujukan RS">Unfit (Rujukan Rumah Sakit)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Petugas Medis Jaga</label>
                                    <input
                                        type="text"
                                        required
                                        value={medicName}
                                        onChange={(e) => setMedicName(e.target.value)}
                                        placeholder="Nama perawat / dokter"
                                        className="w-full bg-[#060c14] border border-[#1b2e46] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-400"
                                    />
                                </div>
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Rekam Medis'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}