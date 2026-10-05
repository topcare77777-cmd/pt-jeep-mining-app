'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function UpdatePasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmation, setConfirmation] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        let active = true

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (!active) return
            if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                setReady(true)
                setError('')
            }
        })

        supabase.auth.getSession().then(({ data }) => {
            if (!active) return
            if (data.session) {
                setReady(true)
                setError('')
            } else {
                setError('Link reset tidak valid atau sudah kedaluwarsa. Silakan minta link reset baru.')
            }
        })

        return () => {
            active = false
            listener.subscription.unsubscribe()
        }
    }, [])

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        if (password.length < 8) {
            setError('Password baru minimal 8 karakter.')
            return
        }
        if (password !== confirmation) {
            setError('Konfirmasi password belum sama.')
            return
        }
        setSaving(true)
        setError('')
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) setError(updateError.message)
        else {
            setMessage('Password berhasil diperbarui. Anda akan diarahkan ke login developer.')
            setTimeout(() => router.replace('/'), 1500)
        }
        setSaving(false)
    }

    return (
        <main className="min-h-screen bg-[#070b12] text-white flex items-center justify-center p-5">
            <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[#0c121e] border border-[#263752] rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="text-center"><div className="text-3xl mb-2">🔑</div><h1 className="text-xl font-black">Buat Password Baru</h1><p className="text-xs text-slate-400 mt-2">Gunakan minimal 8 karakter dan jangan gunakan ulang password lama.</p></div>
                <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password baru" disabled={!ready || saving} className="w-full bg-[#070b12] border border-[#263752] rounded-lg px-3 py-2.5 text-sm text-white" />
                <input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Ulangi password baru" disabled={!ready || saving} className="w-full bg-[#070b12] border border-[#263752] rounded-lg px-3 py-2.5 text-sm text-white" />
                {error && <p className="text-xs text-rose-300 bg-rose-950/30 border border-rose-800/40 rounded-lg p-3">{error}</p>}
                {message && <p className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-3">{message}</p>}
                <button type="submit" disabled={!ready || saving} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black py-2.5 rounded-lg text-sm">{saving ? 'Menyimpan...' : 'Simpan Password Baru'}</button>
            </form>
        </main>
    )
}
