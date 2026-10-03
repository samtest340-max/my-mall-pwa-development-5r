'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, PackagePlus, Search, ShoppingBag, Tag, Truck, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Product = { id: string; name: string; sku: string | null; category: string; price: number; stock: number; published: boolean }
const money = (value: number) => `₦${value.toLocaleString('en-NG')}`

export function StoreManagement({ businessName, showNotice }: { businessName: string; showNotice: (message: string) => void }) {
  const [tab, setTab] = useState<'products' | 'orders' | 'settings' | 'analytics'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'General', price: '', stock: '' })
  const supabase = createClient()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined
    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const { data: profile } = await supabase.from('profiles').select('business_id').eq('user_id', auth.user.id).maybeSingle()
      if (!profile?.business_id) return
      setBusinessId(profile.business_id)
      const { data } = await supabase.from('products').select('id,name,sku,sell_price,active,category_id').eq('business_id', profile.business_id).is('deleted_at', null).order('created_at', { ascending: false })
      setProducts((data ?? []).map((item: any) => ({ id: item.id, name: item.name, sku: item.sku, category: item.category_id ? 'Catalog' : 'General', price: Number(item.sell_price || 0), stock: 0, published: item.active })))
      channel = supabase.channel(`inventory-products-${profile.business_id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `business_id=eq.${profile.business_id}` }, (payload) => {
        const item = (payload.new || payload.old) as any
        setProducts(current => payload.eventType === 'DELETE' || item.deleted_at ? current.filter(product => product.id !== item.id) : [{ id: item.id, name: item.name, sku: item.sku, category: item.category_id ? 'Catalog' : 'General', price: Number(item.sell_price || 0), stock: 0, published: item.active }, ...current.filter(product => product.id !== item.id)])
      }).subscribe()
    }
    void load()
    return () => { if (channel) void supabase.removeChannel(channel) }
  }, [supabase])

  const filtered = useMemo(() => products.filter(product => `${product.name} ${product.sku ?? ''} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [products, query])
  const addProduct = async () => {
    if (!businessId || !form.name.trim() || !form.price) return showNotice('Add a product name and price')
    const { error } = await supabase.from('products').insert({ id: crypto.randomUUID(), business_id: businessId, name: form.name.trim(), sku: `WEB-${Date.now()}`, sell_price: Number(form.price), active: true })
    if (error) return showNotice('Could not add product')
    setForm({ name: '', category: 'General', price: '', stock: '' }); setShowForm(false); showNotice('Product added to inventory and storefront')
  }

  return <section><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex rounded-full bg-[#e8f4e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#39724a]">Online store</div><h1 className="text-[30px] font-bold tracking-[-0.05em] text-[#183022]">Sell online from {businessName}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d8980]">Every active inventory product is published to your storefront and stays synchronized in real time.</p></div><a href={`/store/${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#2f7047] px-4 py-2.5 text-sm font-semibold text-white"><ExternalLink className="size-4" /> View storefront</a></div><div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-[#e3ebe2] bg-white p-2">{[['products', PackagePlus, 'Products'], ['orders', Truck, 'Orders'], ['analytics', ShoppingBag, 'Analytics'], ['settings', Tag, 'Store settings']].map(([value, Icon, label]) => <button key={value as string} onClick={() => setTab(value as typeof tab)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === value ? 'bg-[#e6f3e7] text-[#2f7047]' : 'text-[#748077] hover:bg-[#f5faf4]'}`}><Icon className="size-4" />{label as string}</button>)}</div>{tab === 'products' && <div className="rounded-[22px] border border-[#e3ebe2] bg-white p-5"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-bold text-[#1d2b22]">Inventory storefront catalog</h2><p className="mt-1 text-sm text-[#7d8980]">Products marked active are visible to shoppers.</p></div><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-[#2f7047] px-3 py-2 text-xs font-semibold text-white"><PackagePlus className="size-4" /> Add product</button></div><label className="mb-4 flex items-center gap-2 rounded-xl border border-[#d8e5d8] px-3 py-2 text-sm text-[#7d8980]"><Search className="size-4" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products or SKU" className="w-full bg-transparent outline-none" /></label><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[#edf1eb] text-xs uppercase tracking-[0.1em] text-[#9aa49c]"><tr><th className="pb-3">Product</th><th className="pb-3">Category</th><th className="pb-3">Price</th><th className="pb-3">Status</th></tr></thead><tbody>{filtered.map(product => <tr key={product.id} className="border-b border-[#f0f4ef]"><td className="py-4"><div className="font-semibold">{product.name}</div><div className="mt-1 text-xs text-[#9aa49c]">{product.sku || 'No SKU'}</div></td><td>{product.category}</td><td className="font-semibold">{money(product.price)}</td><td><span className="rounded-full bg-[#e8f4e8] px-2 py-1 text-xs font-semibold text-[#39724a]">{product.published ? 'Live' : 'Hidden'}</span></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="py-10 text-center text-sm text-[#7d8980]">No inventory products found.</p>}</div></div>}{tab === 'orders' && <div className="rounded-2xl border border-[#e3ebe2] bg-white p-6 text-sm text-[#657268]">Store orders will appear here as customers check out.</div>}{tab === 'analytics' && <div className="rounded-2xl border border-[#e3ebe2] bg-white p-6 text-sm text-[#657268]">Storefront analytics will appear here.</div>}{tab === 'settings' && <div className="rounded-2xl border border-[#e3ebe2] bg-white p-6 text-sm text-[#657268]">Store availability, delivery and payment settings.</div>}{showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#183022]/30 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-bold">Add inventory product</h2><p className="mt-1 text-sm text-[#7d8980]">It will be live on the storefront immediately.</p></div><button onClick={() => setShowForm(false)} aria-label="Close"><X className="size-5" /></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Product name" className="h-11 rounded-xl border px-3 sm:col-span-2" /><input value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} placeholder="Category" className="h-11 rounded-xl border px-3" /><input value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} type="number" placeholder="Selling price" className="h-11 rounded-xl border px-3" /></div><button onClick={() => void addProduct()} className="mt-5 w-full rounded-xl bg-[#2f7047] px-4 py-3 text-sm font-semibold text-white">Save product</button></div></div>}</section>
}
