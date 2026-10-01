'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('sammyfemi18@gmail.com')
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setMessage(error ? 'We could not send the reset email. Please try again.' : 'If this email is registered, a reset link has been sent.')
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#eef6ee] p-6"><div className="w-full max-w-md rounded-[28px] border border-[#d8e8d8] bg-white p-8 shadow-xl"><h1 className="text-2xl font-bold text-[#183022]">Reset your password</h1><p className="mt-2 text-sm text-[#7d8980]">Use the administrator email to receive a secure reset link.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl border border-[#d8e5d8] px-4" /><button className="h-12 rounded-xl bg-[#2f7047] font-semibold text-white">Send reset link</button></form>{message && <p className="mt-4 text-sm text-[#39724a]">{message}</p>}<Link href="/login" className="mt-6 block text-center text-sm font-semibold text-[#39724a]">Back to sign in</Link></div></main>
}
