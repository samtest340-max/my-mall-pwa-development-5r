'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import { createClient } from '@/lib/supabase/client'

function safeName(value: string) {
  return value.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'Customer'
}

export function SalePdfButton({ saleId }: { saleId: string }) {
  const [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true)
    try {
      const supabase = createClient()
      const { data: sale, error: saleError } = await supabase.from('sales').select('id,business_id,receipt_no,customer_id,cashier_id,subtotal,discount,tax,total,occurred_at').eq('id', saleId).single()
      if (saleError || !sale) throw saleError ?? new Error('Sale not found')
      const [{ data: items }, { data: customer }, { data: payments }, { data: business }, { data: cashier }] = await Promise.all([
        supabase.from('sale_items').select('qty,unit_price,line_total,product_id,products(name,sku)').eq('sale_id', sale.id).order('created_at'),
        sale.customer_id ? supabase.from('customers').select('name,phone,address').eq('id', sale.customer_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('payments').select('amount,method').eq('sale_id', sale.id).order('created_at'),
        supabase.from('businesses').select('name,logo_url,currency').eq('id', sale.business_id).maybeSingle(),
        sale.cashier_id ? supabase.from('profiles').select('full_name').eq('user_id', sale.cashier_id).maybeSingle() : Promise.resolve({ data: null }),
      ])
      const paid = (payments ?? []).reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0)
      const currency = business?.currency || 'NGN'
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
      let y = 18
      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold'); pdf.text(business?.name || 'Business', 15, y); y += 7
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.text('INVOICE / RECEIPT', 15, y); pdf.text(`Receipt: ${sale.receipt_no}`, 145, y); y += 6
      pdf.text(`Date: ${new Date(sale.occurred_at).toLocaleString('en-NG')}`, 15, y); pdf.text(`Served by: ${cashier?.full_name || 'Staff'}`, 145, y); y += 8
      pdf.line(15, y, 195, y); y += 8
      pdf.setFont('helvetica', 'bold'); pdf.text('Customer', 15, y); y += 5; pdf.setFont('helvetica', 'normal'); pdf.text(customer?.name || 'Walk-in customer', 15, y); y += 5
      if (customer?.phone) { pdf.text(customer.phone, 15, y); y += 5 }
      if (customer?.address) { pdf.text(customer.address.slice(0, 90), 15, y); y += 5 }
      y += 4; pdf.setFont('helvetica', 'bold'); pdf.text('Item', 15, y); pdf.text('Qty', 112, y); pdf.text('Unit', 135, y); pdf.text('Total', 170, y); y += 6; pdf.setFont('helvetica', 'normal')
      for (const item of items ?? []) { const product = Array.isArray(item.products) ? item.products[0] : item.products; pdf.text(String(product?.name || 'Product').slice(0, 45), 15, y); pdf.text(String(item.qty), 112, y); pdf.text(`${currency} ${Number(item.unit_price).toLocaleString('en-NG')}`, 135, y); pdf.text(`${currency} ${Number(item.line_total).toLocaleString('en-NG')}`, 170, y); y += 6; if (y > 260) { pdf.addPage(); y = 18 } }
      y += 4; pdf.line(115, y, 195, y); y += 7
      const totals = [['Subtotal', sale.subtotal], ['Discount', sale.discount], ['Tax', sale.tax], ['Total', sale.total], ['Amount paid', paid], ['Balance', Number(sale.total) - paid]] as const
      for (const [label, value] of totals) { pdf.setFont('helvetica', label === 'Total' ? 'bold' : 'normal'); pdf.text(label, 125, y); pdf.text(`${currency} ${Number(value || 0).toLocaleString('en-NG')}`, 170, y); y += 6 }
      pdf.setFont('helvetica', 'normal'); pdf.text(`Payment method: ${(payments ?? []).map((payment: any) => payment.method).join(', ') || '—'}`, 15, y + 5)
      pdf.save(`Invoice_${safeName(String(sale.receipt_no))}_${safeName(customer?.name || 'Customer')}.pdf`)
    } catch (error) { console.error('[v0] sale PDF export failed', error); window.alert('Unable to download this sale invoice.') } finally { setBusy(false) }
  }
  return <button type="button" onClick={() => void download()} disabled={busy} aria-label="Download sale invoice" className="inline-flex items-center gap-1 rounded-lg border border-[#cfe2d0] px-2 py-1 text-xs font-semibold text-[#39724a] disabled:opacity-60">{busy ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />} PDF</button>
}
