'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FinanceExport } from '@/components/finance-export'

type HistoryRow = { id: string; soldAt: string; receipt: string; staff: string; customer: string; phone: string; quantity: number; unitPrice: number; total: number; paymentMethod: string; paymentStatus: string; branch: string }

export function ProductHistory({ businessName, onClose }: { businessName: string; onClose?: () => void }) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<{ id: string; name: string; sku: string; stock: number } | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ range: 'all', sort: 'date', method: 'all', group: false })

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (query.trim().length < 2) return setSuggestions([])
      const { data } = await supabase.from('products').select('id,name,sku,stock_on_hand').or(`name.ilike.%${query.trim()}%,sku.ilike.%${query.trim()}%`).order('name').limit(8)
      setSuggestions(data ?? [])
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!selected) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('sale_items').select('id,qty,unit_price,line_total,created_at,sales(receipt_no,created_at,cashier_id,customer_id,branch_id),products(name,sku),customers(name,phone),branches(name)').eq('product_id', selected.id).order('created_at', { ascending: false })
      if (!cancelled) {
        setRows((data ?? []).map((item: any) => ({ id: item.id, soldAt: item.sales?.created_at || item.created_at, receipt: item.sales?.receipt_no || '—', staff: item.sales?.cashier_id || 'Staff', customer: item.customers?.name || 'Walk-in customer', phone: item.customers?.phone || '', quantity: Number(item.qty || 0), unitPrice: Number(item.unit_price || 0), total: Number(item.line_total || 0), paymentMethod: '—', paymentStatus: '—', branch: item.branches?.name || '—' })))
        setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [selected])

  const filtered = useMemo(() => [...rows].sort((a, b) => filters.sort === 'amount' ? b.total - a.total : filters.sort === 'quantity' ? b.quantity - a.quantity : +new Date(b.soldAt) - +new Date(a.soldAt)), [rows, filters.sort])
  const summary = { quantity: rows.reduce((sum, row) => sum + row.quantity, 0), revenue: rows.reduce((sum, row) => sum + row.total, 0), average: rows.length ? rows.reduce((sum, row) => sum + row.unitPrice, 0) / rows.length : 0 }
  const exportRows = filtered.map(row => ({ Date: new Date(row.soldAt).toLocaleString('en-NG'), Receipt: row.receipt, Staff: row.staff, Customer: row.customer, Phone: row.phone, Quantity: row.quantity, 'Unit price': row.unitPrice, Total: row.total, 'Payment method': row.paymentMethod, Status: row.paymentStatus, Branch: row.branch }))

  return <div className="rounded-[22px] border border-[#dfe9df] bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#39724a]">Product history</div><h2 className="mt-2 text-xl font-bold text-[#183022]">Search every sale by product</h2><p className="mt-1 text-sm text-[#7d8980]">Search by product name, SKU, or scan a barcode.</p></div>{onClose && <button onClick={onClose} aria-label="Close product history"><X className="size-5" /></button>}</div>
    <div className="relative mt-5"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9aa49c]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search product name, SKU, or barcode" className="h-11 w-full rounded-xl border border-[#dfe9df] pl-9 pr-3 text-sm" />{suggestions.length > 0 && <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow-lg">{suggestions.map(item => <button key={item.id} onClick={() => { setSelected({ id: item.id, name: item.name, sku: item.sku, stock: Number(item.stock_on_hand || 0) }); setQuery(item.name); setSuggestions([]) }} className="flex w-full items-center justify-between border-b px-4 py-3 text-left text-sm hover:bg-[#f4faf3]"><span className="font-semibold">{item.name}</span><span className="text-xs text-[#89958c]">{item.sku}</span></button>)}</div>}</div>
    {selected && <><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5"><div><small>Total quantity</small><b className="mt-1 block">{summary.quantity}</b></div><div><small>Total revenue</small><b className="mt-1 block">₦{summary.revenue.toLocaleString('en-NG')}</b></div><div><small>Number of sales</small><b className="mt-1 block">{rows.length}</b></div><div><small>Average price</small><b className="mt-1 block">₦{summary.average.toLocaleString('en-NG', { maximumFractionDigits: 2 })}</b></div><div><small>Current stock</small><b className="mt-1 block">{selected.stock}</b></div></div><div className="mt-5 flex flex-wrap items-end gap-2"><label className="text-xs font-semibold">Date range<select value={filters.range} onChange={event => setFilters({ ...filters, range: event.target.value })} className="mt-1 block h-9 rounded-lg border px-2"><option value="all">All time</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option></select></label><label className="text-xs font-semibold">Payment<select value={filters.method} onChange={event => setFilters({ ...filters, method: event.target.value })} className="mt-1 block h-9 rounded-lg border px-2"><option value="all">All methods</option><option>Cash</option><option>Transfer</option><option>Card</option></select></label><label className="text-xs font-semibold">Sort<select value={filters.sort} onChange={event => setFilters({ ...filters, sort: event.target.value })} className="mt-1 block h-9 rounded-lg border px-2"><option value="date">Newest</option><option value="quantity">Quantity</option><option value="amount">Amount</option></select></label><FinanceExport businessName={businessName} report={`Product-${selected.sku}-History`} rows={exportRows} label="Download history" /></div><div className="mt-5 overflow-x-auto rounded-xl border"><table className="w-full min-w-[980px] text-left text-xs"><thead className="bg-[#f7faf6] text-[#66746a]"><tr>{['Date and time','Receipt','Sold by','Bought by','Qty','Unit price','Total paid','Payment','Status','Branch'].map(header => <th key={header} className="px-3 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={10} className="p-6 text-center">Loading product history…</td></tr> : filtered.map(row => <tr key={row.id} className="border-t"><td className="px-3 py-3">{new Date(row.soldAt).toLocaleString('en-NG')}</td><td className="px-3 py-3 font-semibold text-[#39724a]">{row.receipt}</td><td className="px-3 py-3">{row.staff}</td><td className="px-3 py-3">{row.customer}<div className="text-[#89958c]">{row.phone}</div></td><td className="px-3 py-3">{row.quantity}</td><td className="px-3 py-3">₦{row.unitPrice.toLocaleString('en-NG')}</td><td className="px-3 py-3">₦{row.total.toLocaleString('en-NG')}</td><td className="px-3 py-3">{row.paymentMethod}</td><td className="px-3 py-3">{row.paymentStatus}</td><td className="px-3 py-3">{row.branch}</td></tr>)}</tbody></table></div></> }
  </div>
}
