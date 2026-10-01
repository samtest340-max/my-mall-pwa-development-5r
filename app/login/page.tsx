'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, LockKeyhole, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'admin@greenbasket.ng'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Password@123')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const email = username.trim().toLowerCase() === 'admin' ? ADMIN_EMAIL : username.trim()
    const { error: authError } = await createClient().auth.signInWithPassword({ email, password })
    if (authError) setError('Invalid username or password. Please try again.')
    else router.replace('/')
    setBusy(false)
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#eef6ee] p-6">
    <div className="grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#d8e8d8] bg-white shadow-2xl md:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-[#1f5b37] via-[#2f7047] to-[#6da66e] p-10 text-white md:block">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15"><Store /></div>
        <p className="mt-20 text-sm font-semibold uppercase tracking-[0.2em] text-[#d5ebd7]">My Mall workspace</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Run your business with clarity.</h1>
        <p className="mt-5 max-w-sm text-sm leading-7 text-[#e0f0e1]">Secure access for administrators and staff across every branch.</p>
      </div>
      <div className="p-7 sm:p-10">
        <div className="mb-8 md:hidden"><div className="flex size-11 items-center justify-center rounded-2xl bg-[#2f7047] text-white"><Store /></div></div>
        <h2 className="text-3xl font-bold tracking-tight text-[#183022]">Welcome back</h2>
        <p className="mt-2 text-sm text-[#7d8980]">Sign in to your dashboard.</p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
          <label className="text-sm font-semibold text-[#39483d]">Username or email<input value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" placeholder="admin" className="mt-2 h-12 w-full rounded-xl border border-[#d8e5d8] px-4 outline-none focus:border-[#39724a] focus:ring-4 focus:ring-[#dff0df]" /></label>
          <label className="text-sm font-semibold text-[#39483d]">Password<input value={password} onChange={e => setPassword(e.target.value)} required type="password" autoComplete="current-password" placeholder="Enter your password" className="mt-2 h-12 w-full rounded-xl border border-[#d8e5d8] px-4 outline-none focus:border-[#39724a] focus:ring-4 focus:ring-[#dff0df]" /></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2f7047] font-semibold text-white transition hover:bg-[#245d39] disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'} <ArrowRight className="size-4" /></button>
        </form>
        <a href="/forgot-password" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#39724a] hover:underline"><LockKeyhole className="size-4" /> Forgot password?</a>
      </div>
    </div>
  </main>
}
