'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ProductionLog {
    id: string
    created_at?: string
    date: string
    shift: string
    overburden_bcm: number
    coal_getting_ton: number
    fuel_consumed_liter: number
    weather_condition: string
}

interface HaulingLog {
    id: string
    truck_no: string
    driver_name: string
    netto_ton: number
    loading_point: string
    dumping_point: string
    created_at: string
}

export default function LaporanHarianSitePage() {
    const [loading, setLoading] = useState(true)
    const [prodLogs, setProdLogs] = useState<ProductionLog[]>([])
    const [haulingLogs, setHaulingLogs] = useState<HaulingLog[]>([])

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://pt-jeep.vercel.app'

    useEffect(() => {
        async function loadReportData() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    window.location.href = landingUrl
                    return
                }

                // 1. Tarik Data Produksi Pit
                const { data: pData } = await supabase
                    .from('site_production_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (pData) setProdLogs(pData)

                // 2. Tarik Data Ritase Hauling
                const { data: hData } = await supabase
                    .from('hauling_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20)

                if (hData) setHaulingLogs(hData)

                setLoading(false)
            } catch (err) {
                console.error('Error load report:', err)
                setLoading(false)
            }
        }

        loadReportData()
    }, [landingUrl])

    // Hitung Agregat Ringkasan
    const totalOb = prodLogs.reduce((acc, curr) => acc + Number(curr.overburden_bcm || 0), 0)
    const totalCoalPit = prodLogs.reduce((acc, curr) => acc + Number(curr.coal_getting_ton || 0), 0)
    const totalFuel = prodLogs.reduce((acc, curr) => acc + Number(curr.fuel_consumed_liter || 0), 0)
    const totalHaulingNetto = haulingLogs.reduce((acc, curr) => acc + Number(curr.netto_ton || 0), 0)

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060c14] flex flex-col items-center justify-center text-white font-sans">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400">Menyusun Rekapitulasi Laporan Tambang...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#060c14] text-slate-100 font-sans p-4 md:p-8">
            {/* Header Halaman (Sembunyi saat dicetak) */}
            <div className="print:hidden flex flex-wrap justify-between items-center bg-[#0a1625] border border-[#1b2e46] p-5 rounded-xl mb-6 shadow-xl">
                <div>
                    <h1 className="text-lg font-black text-white">Dokumen Rekapitulasi Operasional Site</h1>
                    <p className="text-xs text-slate-400">PT. Jangkar Energi Eka Perkasa • Konsolidasi Pit & Hauling</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 rounded-lg border border-[#1b2e46] text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                        ← Kembali
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                    >
                        🖨️ Cetak / Simpan PDF
                    </button>
                </div>
            </div>

            {/* Lembar Laporan Formal (Tampilan & Format Cetak A4) */}
            <div className="bg-white text-slate-900 rounded-xl p-8 max-w-5xl mx-auto shadow-2xl print:shadow-none print:p-0 print:m-0 print:max-w-full">
                {/* Kop Dokumen */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                            PT. Jangkar Energi Eka Perkasa
                        </h2>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Departemen Operasional & Teknik Pertambangan
                        </p>
                        <p className="text-[11px] text-slate-500">Site Project: Kutai Barat / Tabang • Kalimantan Timur</p>
                    </div>
                    <div className="text-right text-xs">
                        <p className="font-mono font-bold text-slate-800">DOR-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}</p>
                        <p className="text-slate-500 text-[10px]">Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                    </div>
                </div>

                <h3 className="text-center text-sm font-black uppercase tracking-widest text-slate-800 mb-6 underline">
                    Laporan Ringkasan Produksi & Pengangkutan Harian
                </h3>

                {/* Ringkasan Angka Kunci (Key Figures) */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="border border-slate-300 p-3 rounded text-center bg-slate-50">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Overburden</span>
                        <span className="text-base font-black text-slate-900">{totalOb.toLocaleString('id-ID')} BCM</span>
                    </div>
                    <div className="border border-slate-300 p-3 rounded text-center bg-slate-50">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Coal Getting (Pit)</span>
                        <span className="text-base font-black text-slate-900">{totalCoalPit.toLocaleString('id-ID')} Ton</span>
                    </div>
                    <div className="border border-slate-300 p-3 rounded text-center bg-slate-50">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Ritase Timbangan</span>
                        <span className="text-base font-black text-slate-900">{totalHaulingNetto.toFixed(2)} Ton</span>
                    </div>
                    <div className="border border-slate-300 p-3 rounded text-center bg-slate-50">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Konsumsi Solar</span>
                        <span className="text-base font-black text-slate-900">{totalFuel.toLocaleString('id-ID')} L</span>
                    </div>
                </div>

                {/* Tabel 1: Log Produksi Shift */}
                <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-l-4 border-slate-800 pl-2">
                        1. Rekapitulasi Stripping & Produksi Pit
                    </h4>
                    <table className="w-full text-left text-xs border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                                <th className="p-2">Tanggal / Shift</th>
                                <th className="p-2">Overburden (BCM)</th>
                                <th className="p-2">Coal Getting (Ton)</th>
                                <th className="p-2">Fuel (Liter)</th>
                                <th className="p-2">Cuaca</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {prodLogs.length > 0 ? (
                                prodLogs.map((p) => (
                                    <tr key={p.id}>
                                        <td className="p-2 font-medium">{p.date || 'Hari ini'} • {p.shift}</td>
                                        <td className="p-2 font-mono">{Number(p.overburden_bcm || 0).toLocaleString('id-ID')}</td>
                                        <td className="p-2 font-mono">{Number(p.coal_getting_ton || 0).toLocaleString('id-ID')}</td>
                                        <td className="p-2 font-mono">{Number(p.fuel_consumed_liter || 0).toLocaleString('id-ID')}</td>
                                        <td className="p-2">{p.weather_condition || 'Normal'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-slate-400 italic">Belum ada data produksi</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Tabel 2: Log Ritase Hauling */}
                <div className="mb-8">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-l-4 border-slate-800 pl-2">
                        2. Rekapitulasi Ritase Hauling ke Jetty / Stockpile
                    </h4>
                    <table className="w-full text-left text-xs border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                                <th className="p-2">Unit DT</th>
                                <th className="p-2">Driver</th>
                                <th className="p-2">Netto (Ton)</th>
                                <th className="p-2">Asal Muat (Pit)</th>
                                <th className="p-2">Titik Bongkar (Dumping)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {haulingLogs.length > 0 ? (
                                haulingLogs.slice(0, 10).map((h) => (
                                    <tr key={h.id}>
                                        <td className="p-2 font-mono font-bold">{h.truck_no}</td>
                                        <td className="p-2">{h.driver_name}</td>
                                        <td className="p-2 font-mono font-semibold">{Number(h.netto_ton || 0).toFixed(2)}</td>
                                        <td className="p-2 text-slate-600">{h.loading_point}</td>
                                        <td className="p-2 text-slate-600">{h.dumping_point}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-slate-400 italic">Belum ada data ritase</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Kolom Tanda Tangan Legalitas */}
                <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4 border-t border-slate-200">
                    <div>
                        <p className="text-slate-500 mb-14">Dibuat Oleh (Admin Site / Timbangan):</p>
                        <p className="font-bold border-t border-slate-400 pt-1 w-3/4 mx-auto">Petugas ADM & Timbangan</p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-14">Diperiksa Oleh (Mine Engineering / K3):</p>
                        <p className="font-bold border-t border-slate-400 pt-1 w-3/4 mx-auto">Supervisor Pit Operasional</p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-14">Disetujui Oleh (KTT / Site Manager):</p>
                        <p className="font-bold border-t border-slate-400 pt-1 w-3/4 mx-auto">Kepala Teknik Tambang (KTT)</p>
                    </div>
                </div>
            </div>
        </div>
    )
}