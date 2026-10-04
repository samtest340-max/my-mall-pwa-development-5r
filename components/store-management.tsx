'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, PackagePlus, Search, ShoppingBag, Tag, Truck, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Product = { id: string; name: string; sku: string | null; category: string; price: number; stock: number; published: boolean; imageUrl: string | null }

export function StoreManagement({ businessName, showNotice }: { businessName: string; showNotice: (message: string) => void }) {
  const [tab, setTab] = useState<'products' | 'orders' | 'settings' | 'analytics'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'General', price: '', stock: '', image: null as File | null })
  const supabase = createClient()
  const mapProduct = (item: any): Product => ({ id: item.id, name: item.name, sku: item.sku, category: item.category_id ? 'Catalog' : 'General', price: Number(item.sell_price || 0), stock: 0, published: item.active, imageUrl: item.image_url || null })

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined
    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const { data: profile } = await supabase.from('profiles').select('business_id').eq('user_id', auth.user.id).maybeSingle()
      if (!profile?.business_id) return
      setBusinessId(profile.business_id)
      const { data } = await supabase.from('products').select('id,name,sku,sell_price,active,category_id,image_url').eq('business_id', profile.business_id).is('deleted_at', null).order('created_at', { ascending: false })
      setProducts((data ?? []).map(mapProduct))
      channel = supabase.channel(`inventory-products-${profile.business_id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `business_id=eq.${profile.business_id}` }, payload => { const item = (payload.new || payload.old) as any; setProducts(current => payload.eventType === 'DELETE' || item.deleted_at ? current.filter(product => product.id !== item.id) : [mapProduct(item), ...current.filter(product => product.id !== item.id)]) }).subscribe()
    }
    void load()
    return () => { if (channel) void supabase.removeChannel(channel) }
  }, [supabase])

  const filtered = useMemo(() => products.filter(product => `${product.name} ${product.sku ?? ''} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [products, query])
  const addProduct = async () => {
    if (!businessId || !form.name.trim() || !form.price) return showNotice('Add a product name and price')
    const productId = crypto.randomUUID()
    let imageUrl: string | null = null
    if (form.image) {
      if (!form.image.type.startsWith('image/') || form.image.size > 5 * 1024 * 1024) return showNotice('Choose an image under 5MB')
      const path = `${businessId}/${productId}-${form.image.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
      const upload = await supabase.storage.from('product-images').upload(path, form.image, { contentType: form.image.type, upsert: true })
      if (upload.error) return showNotice('Could not upload product image')
      imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }
    const { error } = await supabase.from('products').insert({ id: productId, business_id: businessId, name: form.name.trim(), sku: `WEB-${Date.now()}`, sell_price: Number(form.price), active: true, image_url: imageUrl })
    if (error) return showNotice('Could not add product')
    setForm({ name: '', category: 'General', price: '', stock: '', image: null }); setShowForm(false); showNotice('Product added to inventory and storefront')
  }

  return <section><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex rounded-full bg-[#e8f4e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#39724a]">Online store</div><h1 className="text-[30px] font-bold tracking-[-0.05em] text-[#183022]">Sell online from {businessName}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d8980]">Every active inventory product is published to your storefront and stays synchronized in real time.</p></div><a href={`/store/${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#2f7047] px-4 py-2.5 text-sm font-semibold text-white"><ExternalLink className="size-4" /> View storefront</a></div><div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-[#e3ebe2] bg-white p-2">{[['products', PackagePlus, 'Products'], ['orders', Truck, 'Orders'], ['analytics', ShoppingBag, 'Analytics'], ['settings', Tag, 'Store settings']].map(([value, Icon, label]) => <button key={value as string} onClick={() => setTab(value as typeof tab)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === value ? 'bg-[#e6f3e7] text-[#2f7047]' : 'text-[#748077] hover:bg-[#f5faf4]'}`}><Icon className="size-4" />{label as string}</button>)}</div>{tab === 'products' && <div className="rounded-[22px] border border-[#e3ebe2] bg-white p-5"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-bold text-[#1d2b22]">Inventory storefront catalog</h2><p className="mt-1 text-sm text-[#7d8980]">Products marked active are visible to shoppers.</p></div><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-[#2f7047] px-3 py-2 text-xs font-semibold text-white"><PackagePlus className="size-4" /> Add product</button></div><label className="mb-4 flex items-center gap-2 rounded-xl border border-[#dfe9df] px-3 py-2 text-sm text-[#7d8980]"><Search className="size-4" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products" className="w-full outline-none" /></label><div className="grid gap-3 sm:grid-cols-2">{filtered.map(product => <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-[#e5ede4] p-3"><div className="size-14 overflow-hidden rounded-xl bg-[#e8f4e8]">{product.imageUrl && <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />}</div><div className="min-w-0"><div className="truncate text-sm font-bold text-[#1d2b22]">{product.name}</div><div className="text-xs text-[#7d8980]">₦{product.price.toLocaleString('en-NG')} · {product.published ? 'Published' : 'Hidden'}</div></div></div>)}</div></div>}{tab !== 'products' && <div className="rounded-[22px] border border-[#e3ebe2] bg-white p-8 text-sm text-[#657268]">{tab[0].toUpperCase() + tab.slice(1)} tools are ready for this store.</div>}{showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#183022]/30 p-4"><form onSubmit={event => { event.preventDefault(); void addProduct() }} className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold text-[#183022]">Add product</h2><div className="mt-5 grid gap-3"><input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Product name" className="rounded-xl border border-[#dfe9df] px-3 py-3 text-sm" /><input required type="number" min="0" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} placeholder="Selling price" className="rounded-xl border border-[#dfe9df] px-3 py-3 text-sm" /><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#9ec5a4] bg-[#f7fbf6] px-3 py-4 text-sm font-semibold text-[#39724a]"><Upload className="size-4" /><span>{form.image ? form.image.name : 'Upload product image'}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => setForm({ ...form, image: event.target.files?.[0] ?? null })} /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[#d8e5d8] px-4 py-2 text-sm font-semibold text-[#39724a]">Cancel</button><button type="submit" className="rounded-xl bg-[#2f7047] px-4 py-2 text-sm font-semibold text-white">Save product</button></div></form></div>}</section>
}
