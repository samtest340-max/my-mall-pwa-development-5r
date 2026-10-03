'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, Share2, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type StoreProduct = { id: string; name: string; price: number; oldPrice: number; description: string; sku: string | null }
const fallback: StoreProduct[] = []
const money = (value: number) => `₦${value.toLocaleString('en-NG')}`

export default function Storefront({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [businessName, setBusinessName] = useState(slug.split('-').map(word => word[0]?.toUpperCase() + word.slice(1)).join(' '))
  const [products, setProducts] = useState<StoreProduct[]>(fallback)
  const supabase = createClient()
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined
    async function load() {
      const { data: settings } = await supabase.from('store_settings').select('business_id,description').eq('store_slug', slug).maybeSingle()
      const businessId = settings?.business_id || '00000000-0000-0000-0000-000000000001'
      const { data: business } = await supabase.from('businesses').select('name').eq('id', businessId).maybeSingle()
      if (business?.name) setBusinessName(business.name)
      const { data } = await supabase.from('products').select('id,name,sku,sell_price,cost_price,active').eq('business_id', businessId).eq('active', true).is('deleted_at', null).order('created_at', { ascending: false })
      setProducts((data ?? []).map((item: any) => ({ id: item.id, name: item.name, sku: item.sku, price: Number(item.sell_price || 0), oldPrice: Number(item.sell_price || 0), description: item.sku ? `SKU ${item.sku}` : 'Available from our store.' })))
      channel = supabase.channel(`public-store-${businessId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `business_id=eq.${businessId}` }, (payload) => {
        const item = (payload.new || payload.old) as any
        setProducts(current => payload.eventType === 'DELETE' || item.deleted_at || !item.active ? current.filter(product => product.id !== item.id) : [{ id: item.id, name: item.name, sku: item.sku, price: Number(item.sell_price || 0), oldPrice: Number(item.sell_price || 0), description: item.sku ? `SKU ${item.sku}` : 'Available from our store.' }, ...current.filter(product => product.id !== item.id)])
      }).subscribe()
    }
    void load()
    return () => { if (channel) void supabase.removeChannel(channel) }
  }, [slug, supabase])
  return <main className="min-h-screen bg-[#f7fbf6] text-[#183022]"><header className="border-b border-[#dfe9df] bg-white/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href={`/store/${slug}`} className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#2f7047] text-white"><ShoppingBag className="size-5" /></span><span><b className="block text-sm">{businessName}</b><span className="text-xs text-[#7d8980]">Online store</span></span></Link><div className="flex items-center gap-2"><button aria-label="Search" className="rounded-xl p-2 text-[#39724a]"><Search className="size-5" /></button><button aria-label="Shopping bag" className="rounded-xl bg-[#e8f4e8] p-2 text-[#39724a]"><ShoppingBag className="size-5" /></button></div></div></header><section className="mx-auto max-w-6xl px-5 py-12"><div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-4 inline-flex rounded-full bg-[#e8f4e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#39724a]">Live inventory</div><h1 className="max-w-3xl text-4xl font-bold tracking-[-0.06em] sm:text-6xl">Shop directly from {businessName}.</h1><p className="mt-5 max-w-xl text-base leading-7 text-[#657268]">Every active product from the inventory is available here and new products appear automatically.</p></div><button onClick={() => navigator.share?.({ title: businessName, url: window.location.href })} className="flex items-center gap-2 rounded-xl border border-[#cfe2d0] bg-white px-5 py-3 text-sm font-semibold text-[#39724a]"><Share2 className="size-4" /> Share store</button></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map(product => <article key={product.id} className="overflow-hidden rounded-[24px] border border-[#dfe9df] bg-white"><div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#eaf5e9] to-[#d8ecd9]"><ShoppingBag className="size-12 text-[#72a878]" /></div><div className="p-5"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#6d9f73]">Inventory</span><span className="flex items-center gap-1 text-xs font-semibold text-[#d29348]"><Star className="size-3.5 fill-current" /> New</span></div><h2 className="mt-3 text-lg font-bold">{product.name}</h2><p className="mt-2 text-sm leading-6 text-[#657268]">{product.description}</p><div className="mt-5 flex items-center justify-between"><strong className="text-xl">{money(product.price)}</strong><button className="rounded-xl bg-[#2f7047] px-3 py-2 text-xs font-semibold text-white">Add to bag</button></div></div></article>)}</div>{products.length === 0 && <div className="rounded-2xl border border-dashed border-[#bdd7be] bg-white p-12 text-center text-sm text-[#657268]">No products are published yet. Add an active product in Inventory to see it here.</div>}</section></main>
}
