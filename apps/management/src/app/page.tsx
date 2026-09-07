'use client'

import { useState } from 'react'

export default function ManagementDashboard() {
    const [activeMenu, setActiveMenu] = useState<'analytics' | 'validation' | 'fleet'>('analytics')

    // Simulasi data untuk Divisi Operasional
    const [pendingLogs, setPendingLogs] = useState([
        { id: 'LOG-001', truck: 'DT-001', pit: 'Pit B-01', material: 'Saprolite', weight: 35.5, time: '10:15 WITA', status: 'Menunggu' },
        { id: 'LOG-002', truck: 'DT-002', pit: 'Pit A-02', material: 'Limonite', weight: 32.0, time: '10:30 WITA', status: 'Menunggu' },
        { id: 'LOG-003', truck: 'DT-003', pit: 'Pit B-01', material: 'Saprolite', weight: 34.2, time: '10:45 WITA', status: 'Menunggu' },
    ])

    const [fleet, setFleet] = useState([
        { code: 'DT-001', model: 'Hino Profia 6x4', status: 'Beroperasi', operator: 'Budi Santoso' },
        { code: 'DT-002', model: 'Nissan Diesel', status: 'Beroperasi', operator: 'Andi M.' },
        { code: 'DT-003', model: 'Isuzu GIGA', status: 'Perbaikan (Breakdown)', operator: '-' },
    ])

    // Handler untuk memvalidasi ritase (Simulasi)
    const handleApprove = (id: string) => {
        setPendingLogs(pendingLogs.filter(log => log.id !== id))
        // Di dunia nyata, ini akan melakukan UPDATE ke tabel Supabase (status_sync = 'Approved')
    }

    // Handler Keluar
    const handleLogout = () => {
        window.location.href = 'http://localhost:3003' // Kembali ke Landing Page
    }

    return (
        <div className="flex h-screen bg-[#0f1115] text-slate-200 font-sans overflow-hidden selection:bg-amber-500 selection:text-black">

            {/* Sidebar Manajer */}
            <aside className="w-72 bg-[#16191f] border-r border-[#22262e] flex flex-col shadow-2xl z-10">
                <div className="p-6 border-b border-[#22262e]">
                    <h1 className="text-xl font-black tracking-wide text-amber-400 leading-tight">
                        PT. JANGKAR ENERGI<br />EKA PERKASA
                    </h1>
                    <p className="text-[11px] text-slate-400 mt-2 uppercase tracking-widest font-bold">Portal Divisi Operasional</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2">Menu Utama</p>
                    <button
                        onClick={() => setActiveMenu('analytics')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeMenu === 'analytics' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-[#1e222a] hover:text-slate-200'}`}
                    >
                        <span className="text-lg">📈</span> <span>Analitik Produksi</span>
                    </button>

                    <button
                        onClick={() => setActiveMenu('validation')}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${activeMenu === 'validation' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-[#1e222a] hover:text-slate-200'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <span className="text-lg">✅</span> <span>Validasi Ritase</span>
                        </div>
                        {pendingLogs.length > 0 && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeMenu === 'validation' ? 'bg-slate-950 text-amber-500' : 'bg-rose-500 text-white'}`}>
                                {pendingLogs.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveMenu('fleet')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeMenu === 'fleet' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-[#1e222a] hover:text-slate-200'}`}
                    >
                        <span className="text-lg">🚛</span> <span>Status Armada</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-[#22262e] bg-[#16191f]">
                    <div className="flex items-center space-x-3 bg-[#0f1115] p-3 rounded-xl border border-[#22262e] mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">MO</div>
                        <div>
                            <p className="text-xs font-bold text-white">Manajer Operasional</p>
                            <p className="text-[10px] text-emerald-400">Shift Pagi • Site A</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/50 py-2.5 rounded-lg text-sm transition font-medium"
                    >
                        <span>🚪</span> <span>Keluar Sistem</span>
                    </button>
                </div>
            </aside>

            {/* Area Konten Utama */}
            <main className="flex-1 overflow-y-auto p-8 relative">
                {/* Dekorasi Background Latar */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                {activeMenu === 'analytics' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Ringkasan Produksi Harian</h2>
                            <p className="text-sm text-slate-400">Data terakumulasi per hari ini. Target harian: 5.000 WMT.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Kartu Pencapaian Tonase */}
                            <div className="bg-[#16191f] p-6 rounded-2xl border border-[#22262e] shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                                <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Total Tonase Terangkut</p>
                                <div className="flex items-end space-x-2 mb-2">
                                    <h3 className="text-4xl font-black text-white">1,245</h3>
                                    <span className="text-sm text-slate-500 mb-1 font-bold">WMT</span>
                                </div>
                                <div className="w-full bg-[#0f1115] rounded-full h-2 mt-4 border border-[#22262e]">
                                    <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                                </div>
                                <p className="text-[10px] text-emerald-400 mt-2 font-medium">25% dari target harian</p>
                            </div>

                            {/* Kartu Ritase */}
                            <div className="bg-[#16191f] p-6 rounded-2xl border border-[#22262e] shadow-sm">
                                <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Total Ritase Valid</p>
                                <h3 className="text-4xl font-black text-amber-400">35 <span className="text-sm text-slate-500 mb-1 font-bold">Trip</span></h3>
                                <p className="text-xs text-slate-400 mt-4">Menunggu Validasi: <span className="text-rose-400 font-bold">{pendingLogs.length} Trip</span></p>
                            </div>

                            {/* Kartu Efisiensi */}
                            <div className="bg-[#16191f] p-6 rounded-2xl border border-[#22262e] shadow-sm">
                                <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Armada Beroperasi</p>
                                <h3 className="text-4xl font-black text-white">12 <span className="text-sm text-slate-500 mb-1 font-bold">/ 15 Unit</span></h3>
                                <p className="text-xs text-rose-400 mt-4 font-medium">3 Unit dalam perbaikan (Breakdown)</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeMenu === 'validation' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Persetujuan Ritase (Log Hauling)</h2>
                                <p className="text-sm text-slate-400">Verifikasi data yang diinput oleh checker / pengawas pit lapangan.</p>
                            </div>
                            <button className="bg-[#16191f] border border-[#22262e] text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                                Setujui Semua (Bulk Approve)
                            </button>
                        </div>

                        <div className="bg-[#16191f] rounded-2xl border border-[#22262e] shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#0f1115] border-b border-[#22262e] text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                    <tr>
                                        <th className="p-5">ID Tiket</th>
                                        <th className="p-5">Waktu & Lokasi</th>
                                        <th className="p-5">Unit Truk</th>
                                        <th className="p-5">Material & Tonase</th>
                                        <th className="p-5 text-right">Tindakan Validasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#22262e]">
                                    {pendingLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-10 text-center text-slate-500">🎉 Semua log ritase sudah tervalidasi. Area bersih!</td>
                                        </tr>
                                    ) : (
                                        pendingLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-[#1a1d24] transition">
                                                <td className="p-5 font-mono text-amber-400 font-bold">{log.id}</td>
                                                <td className="p-5">
                                                    <p className="text-white font-medium">{log.time}</p>
                                                    <p className="text-xs text-slate-500">{log.pit}</p>
                                                </td>
                                                <td className="p-5 text-slate-300 font-mono">{log.truck}</td>
                                                <td className="p-5">
                                                    <p className="text-white font-medium">{log.weight} WMT</p>
                                                    <p className="text-xs text-emerald-400">{log.material}</p>
                                                </td>
                                                <td className="p-5 text-right space-x-2">
                                                    <button className="text-xs border border-rose-900/50 text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 px-3 py-1.5 rounded transition font-medium">Tolak</button>
                                                    <button
                                                        onClick={() => handleApprove(log.id)}
                                                        className="text-xs border border-emerald-900/50 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/50 px-3 py-1.5 rounded transition font-medium"
                                                    >
                                                        Setujui
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeMenu === 'fleet' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Pemantauan Status Armada</h2>
                            <p className="text-sm text-slate-400">Pantau ketersediaan unit Dump Truck dan operator yang bertugas.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {fleet.map((unit) => (
                                <div key={unit.code} className="bg-[#16191f] p-5 rounded-2xl border border-[#22262e] hover:border-amber-500/30 transition group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-mono text-xl font-bold text-white">{unit.code}</h3>
                                            <p className="text-xs text-slate-500">{unit.model}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${unit.status === 'Beroperasi' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' : 'bg-rose-950/30 text-rose-400 border-rose-900/50'}`}>
                                            {unit.status}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-[#22262e]">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Operator Bertugas</p>
                                        <p className="text-sm text-slate-300 flex items-center">
                                            <span className="mr-2">👷</span> {unit.operator}
                                        </p>
                                    </div>
                                    {/* Tombol Aksi Muncul Saat Di-hover */}
                                    <div className="mt-4 pt-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition duration-200">
                                        <button className="flex-1 bg-[#0f1115] border border-[#22262e] text-xs text-slate-300 py-2 rounded hover:bg-[#22262e]">Ganti Status</button>
                                        <button className="flex-1 bg-[#0f1115] border border-[#22262e] text-xs text-slate-300 py-2 rounded hover:bg-[#22262e]">Lihat Riwayat</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}