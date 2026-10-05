'use client'

import { useState } from 'react'
import { ShieldAlert, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function AdminDataControls({ showNotice }: { showNotice: (message: string) => void }) {
  const [busy, setBusy] = useState(false)
  const clearAll = async () => {
    if (!window.confirm('This will permanently clear business records except the audit log. Continue?')) return
    if (!window.confirm('Final confirmation: delete products, customers, sales, expenses, supplies and staff records?')) return
    setBusy(true)
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return setBusy(false)
    const { data: profile } = await supabase.from('profiles').select('business_id').eq('user_id', auth.user.id).maybeSingle()
    if (!profile?.business_id) return setBusy(false)
    const businessId = profile.business_id
    await supabase.from('dashboard_audit_logs').insert({ business_id: businessId, actor_id: auth.user.id, action: 'clear_business_records', entity_type: 'business', entity_id: businessId, details: { preserved: 'dashboard_audit_logs' } })
    for (const table of ['sale_items', 'sales', 'expenses', 'customers', 'products', 'order_supplies']) await supabase.from(table).delete().eq('business_id', businessId)
    setBusy(false)
    showNotice('Business records cleared; audit log preserved')
  }
  return <div className="mt-6 rounded-[22px] border border-[#f0c9c4] bg-[#fff8f7] p-5"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-5 text-[#b34a3c]" /><div className="flex-1"><h2 className="font-semibold text-[#7e332d]">Danger zone</h2><p className="mt-1 text-sm text-[#8f5b55]">Clear business records while preserving the permanent audit log.</p></div><button disabled={busy} onClick={clearAll} className="flex items-center gap-2 rounded-xl bg-[#b34a3c] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Trash2 className="size-4" /> {busy ? 'Clearing…' : 'Clear all records'}</button></div></div>
}
