'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ImagePlus, Save, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [logo, setLogo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('business_id, full_name').eq('user_id', user.id).maybeSingle()
      if (!profile?.business_id) {
        setAdminName(user.user_metadata?.full_name || user.email?.split('@')[0] || '')
        setLoading(false)
        return
      }
      setBusinessId(profile.business_id)
      setAdminName(profile.full_name || user.user_metadata?.full_name || '')
      const { data: business } = await supabase.from('businesses').select('name, logo_url').eq('id', profile.business_id).maybeSingle()
      setBusinessName(business?.name || '')
      setLogo(business?.logo_url || '')
      setLoading(false)
    }
    void load()
  }, [])

  const chooseLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 750_000) {
      setError('Please choose a logo smaller than 750 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogo(String(reader.result))
    reader.readAsDataURL(file)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Your session has expired. Please sign in again.'); setSaving(false); return }
    if (businessId) {
      const { error: businessError } = await supabase.from('businesses').update({ name: businessName.trim(), logo_url: logo || null }).eq('id', businessId)
      if (businessError) { setError('Unable to save business branding.'); setSaving(false); return }
      const { error: profileError } = await supabase.from('profiles').update({ full_name: adminName.trim() }).eq('user_id', user.id)
      if (profileError) { setError('Business branding saved, but the admin name could not be updated.'); setSaving(false); return }
      setMessage('Settings saved successfully.')
    } else {
      setError('Your account is not linked to a business profile yet.')
    }
    setSaving(false)
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#eef6ee] text-sm font-semibold text-[#39724a]">Loading settings…</main>

  return <main className="min-h-screen bg-[#eef6ee] p-5 text-[#183022] sm:p-10">
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#39724a] hover:underline"><ArrowLeft className="size-4" /> Back to dashboard</Link>
      <div className="overflow-hidden rounded-[28px] border border-[#d8e8d8] bg-white shadow-xl">
        <div className="bg-gradient-to-br from-[#1f5b37] via-[#2f7047] to-[#6da66e] p-7 text-white sm:p-10"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-white/15"><Store className="size-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d5ebd7]">Workspace settings</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Brand your dashboard</h1></div></div><p className="mt-4 max-w-xl text-sm leading-6 text-[#e0f0e1]">Update the business identity and administrator name shown across your workspace.</p></div>
        <form onSubmit={save} className="flex flex-col gap-7 p-7 sm:p-10">
          <div className="flex flex-col gap-3"><span className="text-sm font-semibold text-[#39483d]">Business logo</span><div className="flex items-center gap-4"><div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#b9d3bb] bg-[#f4faf3]">{logo ? <img src={logo} alt="Business logo preview" className="size-full object-cover" /> : <ImagePlus className="size-6 text-[#73a17b]" />}</div><label className="cursor-pointer rounded-xl border border-[#d8e5d8] px-4 py-2.5 text-sm font-semibold text-[#39724a] hover:bg-[#f4faf3]">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseLogo} className="sr-only" /></label><span className="text-xs text-[#7d8980]">PNG, JPG or WEBP · max 750 KB</span></div></div>
          <label className="flex flex-col gap-2 text-sm font-semibold text-[#39483d]">Business name<input value={businessName} onChange={e => setBusinessName(e.target.value)} required className="h-12 rounded-xl border border-[#d8e5d8] px-4 font-normal outline-none focus:border-[#39724a] focus:ring-4 focus:ring-[#dff0df]" placeholder="Your business name" /></label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-[#39483d]">Administrator name<input value={adminName} onChange={e => setAdminName(e.target.value)} required className="h-12 rounded-xl border border-[#d8e5d8] px-4 font-normal outline-none focus:border-[#39724a] focus:ring-4 focus:ring-[#dff0df]" placeholder="Admin name" /></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-[#e8f4e8] px-4 py-3 text-sm font-semibold text-[#39724a]">{message}</p>}
          <button disabled={saving} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2f7047] px-5 font-semibold text-white transition hover:bg-[#245d39] disabled:opacity-60"><Save className="size-4" />{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
      </div>
    </div>
  </main>
}
