'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface AttendanceRecord {
    id: string
    employee_name: string
    employee_id_badge: string
    work_location: string
    shift_type: string
    attendance_status: string
    safety_induction_passed: boolean
    notes: string
    log_date: string
}

export default function HRDDashboard() {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // State Log Kehadiran
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loadingRecords, setLoadingRecords] = useState(false)

    // State Form Absensi & Penugasan
    const [employeeName, setEmployeeName] = useState('')
    const [badgeNumber, setBadgeNumber] = useState('')
    const [workLocation, setWorkLocation] = useState('Pit Area')
    const [shiftType, setShiftType] = useState('Shift 1 (Pagi)')
    const [status, setStatus] = useState('Hadir')
    const [safetyPassed, setSafetyPassed] = useState(true)
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 1. Proteksi Hak Akses (Hanya HRD dan Administrator)
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
                alert('Akses ditolak: Akun Anda dinonaktifkan.')
                await supabase.auth.signOut()
                router.push('/login')
                return
            }

            const allowedRoles = ['Human Resources (HRD)', 'HRD', 'Administrator', 'Developer']
            if (!allowedRoles.includes(profile.role)) {
                alert(`Akses Ditolak: Divisi ${profile.role} tidak berhak membuka modul HRD.`)
                router.push('/login')
                return
            }

            setCurrentUser(profile)
            setIsAuthorized(true)
            setCheckingAuth(false)
            fetchAttendance()
        }

        verifyAccess()
    }, [router])

    // 2. Ambil data log kehadiran
    async function fetchAttendance() {
        setLoadingRecords(true)
        const { data, error } = await supabase
            .from('hrd_attendance_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            console.error('Gagal mengambil data kehadiran:', error.message)
        } else if (data) {
            setRecords(data)
        }
        setLoadingRecords(false)
    }

    // 3. Simpan data absensi
    const handleAddAttendance = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeName || !badgeNumber) return
        setIsSubmitting(true)

        const payload = {
            user_id: currentUser?.id,
            employee_name: employeeName,
            employee_id_badge: badgeNumber,
            work_location: workLocation,
            shift_type: shiftType,
            attendance_status: status,
            safety_induction_passed: safetyPassed,
            notes: notes,
        }

        const { error } = await supabase.from('hrd_attendance_logs').insert([payload])

        if (error) {
            alert('Gagal menyimpan log kehadiran: ' + error.message)
        } else {
            setEmployeeName('')
            setBadgeNumber('')
            setNotes('')
            fetchAttendance()
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
                    <p className="text-xs tracking-wider uppercase">Memverifikasi Wewenang HRD...</p>
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
                        PT-JEEP // MODUL HUMAN RESOURCES & SHE
                    </span>
                    <h1 className="text-2xl font-bold text-white mt-1">Dasbor SDM & Kehadiran Site</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Admin HRD: <span className="text-white font-medium">{currentUser?.full_name}</span> | Divisi:{' '}
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
                {/* Form Presensi & Kepatuhan K3 */}
                <section className="bg-[#111] border border-zinc-800 rounded-xl p-6 shadow-xl h-fit">
                    <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-zinc-800">
                        Pencatatan Personel Lapangan
                    </h2>

                    <form onSubmit={handleAddAttendance} className="space-y-4 text-sm">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nama Karyawan</label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Joko Widodo"
                                value={employeeName}
                                onChange={(e) => setEmployeeName(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Badge / NIK</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="NIK-102"
                                    value={badgeNumber}
                                    onChange={(e) => setBadgeNumber(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white font-mono focus:border-amber-500 focus:outline-none uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Status Kehadiran</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
                                >
                                    <option value="Hadir">Hadir</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Sakit">Sakit</option>
                                    <option value="Cuti">Cuti</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Zona Penempatan</label>
                            <select
                                value={workLocation}
                                onChange={(e) => setWorkLocation(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
                            >
                                <option value="Pit Area">Pit Area (Tambang Aktif)</option>
                                <option value="Workshop & Servis">Workshop & Servis</option>
                                <option value="Jetty / Pelabuhan Muat">Jetty / Pelabuhan Muat</option>
                                <option value="Kantor Administrasi Site">Kantor Administrasi Site</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Shift Kerja</label>
                            <select
                                value={shiftType}
                                onChange={(e) => setShiftType(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
                            >
                                <option value="Shift 1 (Pagi)">Shift 1 (Pagi: 07:00 – 15:00)</option>
                                <option value="Shift 2 (Malam)">Shift 2 (Malam: 15:00 – 23:00)</option>
                                <option value="Shift 3 (Subuh)">Shift 3 (Subuh: 23:00 – 07:00)</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                            <input
                                type="checkbox"
                                id="safetyInduction"
                                checked={safetyPassed}
                                onChange={(e) => setSafetyPassed(e.target.checked)}
                                className="w-4 h-4 rounded bg-black border-zinc-700 text-amber-500 focus:ring-amber-500"
                            />
                            <label htmlFor="safetyInduction" className="text-xs text-slate-300 select-none">
                                Lolos Safety Induction / Menggunakan APD Lengkap
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Keterangan Tambahan</label>
                            <textarea
                                rows={2}
                                placeholder="Catatan izin, surat dokter, dll."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded p-2.5 text-white focus:border-amber-500 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded transition disabled:opacity-50"
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Validasi Presensi Karyawan'}
                        </button>
                    </form>
                </section>

                {/* Tabel Log Kehadiran Terakhir */}
                <section className="lg:col-span-2 bg-[#111] border border-zinc-800 rounded-xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                        <h2 className="text-base font-bold text-white">Presensi Harian Personel Site</h2>
                        <button
                            onClick={fetchAttendance}
                            className="text-xs text-amber-400 hover:text-amber-300 font-mono transition"
                        >
                            ⟳ Segarkan
                        </button>
                    </div>

                    {loadingRecords ? (
                        <div className="py-12 text-center text-xs text-slate-500">Memuat log kehadiran...</div>
                    ) : records.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-500">Belum ada catatan presensi.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-slate-500 uppercase">
                                        <th className="py-3 px-3">Karyawan & NIK</th>
                                        <th className="py-3 px-3">Lokasi</th>
                                        <th className="py-3 px-3">Shift</th>
                                        <th className="py-3 px-3 text-center">K3 / APD</th>
                                        <th className="py-3 px-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                    {records.map((r) => (
                                        <tr key={r.id} className="hover:bg-zinc-900/50 transition">
                                            <td className="py-3 px-3">
                                                <p className="font-bold text-white">{r.employee_name}</p>
                                                <p className="text-[11px] font-mono text-amber-500/80">{r.employee_id_badge}</p>
                                            </td>
                                            <td className="py-3 px-3 text-slate-300">{r.work_location}</td>
                                            <td className="py-3 px-3 text-slate-400 font-mono">{r.shift_type}</td>
                                            <td className="py-3 px-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${r.safety_induction_passed
                                                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                                                        : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                                                    }`}>
                                                    {r.safety_induction_passed ? 'Lolos K3' : 'Belum K3'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <span className={`font-semibold ${r.attendance_status === 'Hadir'
                                                        ? 'text-emerald-400'
                                                        : r.attendance_status === 'Sakit'
                                                            ? 'text-amber-400'
                                                            : 'text-rose-400'
                                                    }`}>
                                                    ● {r.attendance_status}
                                                </span>
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