'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FieldLoggingPage() {
    const [ticket, setTicket] = useState('')
    const [unitCode, setUnitCode] = useState('')
    const [pit, setPit] = useState('Pit B-01')
    const [material, setMaterial] = useState('Saprolite')
    const [weight, setWeight] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

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
                status_sync: 'Synced'
            }
        ])

        setLoading(false)
        if (error) {
            setMessage(`Gagal menyimpan: ${error.message}`)
        } else {
            setMessage('Ritase berhasil dicatat ke Supabase!')
            setTicket('')
            setWeight('')
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans max-w-md mx-auto">
            <h1 className="text-xl font-bold text-amber-400 mb-2">📝 Input Ritase Lapangan</h1>
            <p className="text-xs text-slate-400 mb-6">PT-JEEP Mining Operations - Modul Pengawas Pit</p>

            <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">No. Tiket / DO</label>
                    <input
                        type="text"
                        value={ticket}
                        onChange={(e) => setTicket(e.target.value)}
                        required
                        placeholder="Contoh: TIKET-2026-001"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Lokasi Pit</label>
                    <select
                        value={pit}
                        onChange={(e) => setPit(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                        <option value="Pit B-01">Pit B-01 (Morowali)</option>
                        <option value="Pit A-02">Pit A-02</option>
                        <option value="Stockpile Utama">Stockpile Utama</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Jenis Material</label>
                    <select
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                        <option value="Saprolite">Saprolite (Kadar Tinggi)</option>
                        <option value="Limonite">Limonite (Kadar Rendah)</option>
                        <option value="OB">OB (Overburden)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">Berat / Tonase (WMT)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                        placeholder="Contoh: 35.5"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition"
                >
                    {loading ? 'Menyimpan...' : 'Kirim Data Ritase'}
                </button>

                {message && (
                    <p className={`text-xs text-center mt-2 ${message.includes('Berhasil') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {message}
                    </p>
                )}
            </form>
        </main>
    )
}