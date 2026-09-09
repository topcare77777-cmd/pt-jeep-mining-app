'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MODULE_KEY = 'ritase'

export default function FieldLoggingPage() {
    const router = useRouter()
    const [checkingAccess, setCheckingAccess] = useState(true)
    const [hasAccess, setHasAccess] = useState(false)
    const [userRole, setUserRole] = useState('')
    const [userName, setUserName] = useState('')

    // State Form Ritase Tambang Nikel
    const [ticket, setTicket] = useState('')
    const [pit, setPit] = useState('Pit B-01')
    const [material, setMaterial] = useState('Saprolite')
    const [weight, setWeight] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function verifyDivisionAccess() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                // 1. Ambil data profil pengguna
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, role, status')
                    .eq('id', session.user.id)
                    .maybeSingle()

                if (profileError || !profile) {
                    setHasAccess(false)
                    setCheckingAccess(false)
                    return
                }

                const division = profile.role || ''
                setUserRole(division)
                setUserName(profile.full_name || 'Staff Lapangan')

                // Administrator memiliki akses penuh
                if (division.toLowerCase().includes('admin')) {
                    setHasAccess(true)
                    setCheckingAccess(false)
                    return
                }

                // 2. Periksa matriks izin divisi dari tabel division_permissions
                const { data: permData, error: permError } = await supabase
                    .from('division_permissions')
                    .select('allowed_modules')
                    .eq('division_name', division)
                    .maybeSingle()

                if (!permError && permData && Array.isArray(permData.allowed_modules)) {
                    if (permData.allowed_modules.includes(MODULE_KEY)) {
                        setHasAccess(true)
                    } else {
                        setHasAccess(false)
                    }
                } else {
                    // Akses bawaan jika tabel permission belum dikonfigurasi
                    const defaultAllowedDivisions = ['operasional pit nikel', 'operasional lapangan']
                    if (defaultAllowedDivisions.includes(division.toLowerCase().trim())) {
                        setHasAccess(true)
                    } else {
                        setHasAccess(false)
                    }
                }
            } catch (err) {
                console.error('Kendala otorisasi modul:', err)
                setHasAccess(false)
            } finally {
                setCheckingAccess(false)
            }
        }

        verifyDivisionAccess()
    }, [landingUrl])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const { error } = await supabase.from('hauling_logs').insert([
            {
                ticket_number: ticket,
                pit_location: pit,
                material_type: material,
                netto_weight: parseFloat(weight),
                status_sync: 'Synced',
            },
        ])

        setLoading(false)
        if (error) {
            setMessage(`Gagal menyimpan: ${error.message}`)
        } else {
            setMessage('Ritase bijih nikel berhasil dicatat ke Supabase!')
            setTicket('')
            setWeight('')
        }
    }

    // Tampilan saat memvalidasi otorisasi
    if (checkingAccess) {
        return (
            <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans p-4">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs">Memvalidasi hak akses divisi operasional...</p>
            </main>
        )
    }

    // Tampilan blokir jika divisi tidak memiliki hak akses modul ini
    if (!hasAccess) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="bg-slate-900 border border-rose-900/50 rounded-2xl p-8 max-w-sm w-full space-y-4 shadow-2xl">
                    <span className="text-4xl block">🚫</span>
                    <h2 className="text-lg font-black text-rose-400 uppercase tracking-wide">Akses Modul Dikunci</h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Divisi <strong className="text-white">{userRole || 'Tidak Diketahui'}</strong> belum diberikan izin untuk membuka modul{' '}
                        <strong className="text-amber-400">Ritase & Timbangan Nikel</strong>.
                    </p>
                    <div className="pt-2">
                        <button
                            onClick={() => router.back()}
                            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold transition"
                        >
                            Kembali ke Menu
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-amber-400">📝 Input Ritase Lapangan</h1>
                    <p className="text-xs text-slate-400">PT. JEEP Nickel Mining Operations</p>
                </div>
                <span className="bg-slate-900 border border-slate-800 text-[10px] text-amber-400 px-2 py-1 rounded font-mono">
                    {userRole}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">No. Tiket / DO</label>
                    <input
                        type="text"
                        value={ticket}
                        onChange={(e) => setTicket(e.target.value)}
                        required
                        placeholder="Contoh: TIKET-NIKEL-001"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Lokasi Pit Tambang</label>
                    <select
                        value={pit}
                        onChange={(e) => setPit(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                        <option value="Pit B-01">Pit B-01 (Front Barat)</option>
                        <option value="Pit A-02">Pit A-02 (Front Timur)</option>
                        <option value="Stockpile Utama">Stockpile Utama ETO/EFO</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Jenis Material Nikel</label>
                    <select
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                        <option value="Saprolite">Saprolite (Bijih Kadar Tinggi - High Grade)</option>
                        <option value="Limonite">Limonite (Bijih Kadar Rendah - Low Grade)</option>
                        <option value="OB">OB (Overburden / Lapisan Penutup)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Tonase Netto (WMT)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                        placeholder="Contoh: 35.5"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition cursor-pointer"
                >
                    {loading ? 'Menyimpan...' : 'Kirim Data Ritase Nikel'}
                </button>

                {message && (
                    <p className={`text-xs text-center mt-2 ${message.includes('berhasil') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {message}
                    </p>
                )}
            </form>
        </main>
    )
}