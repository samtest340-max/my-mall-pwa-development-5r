'use client'

import { useMemo, useState } from 'react'
import { Download, X } from 'lucide-react'
import jsPDF from 'jspdf'

const pageDescriptions: Record<string, string> = {
  'Point of Sale': 'Sales history and completed transactions',
  Inventory: 'Products and their current stock, pricing and SKU details',
  Customers: 'Customer contacts and outstanding balances',
  'Credit & Debtors': 'Credit and debtor balances and payment details',
  Accounting: 'Sales history, profit and loss, business snapshot, staff sales, income, gross profit, expenses and net profit',
  Expenses: 'Expense records and amounts',
}

const fields: Record<string, string[]> = {
  'Point of Sale': ['Transaction', 'Customer', 'Total', 'Paid', 'Date'],
  Inventory: ['Product', 'SKU', 'Category', 'Cost', 'Price', 'Stock'],
  Customers: ['Customer', 'Phone', 'Location', 'Outstanding'],
  'Credit & Debtors': ['Customer', 'Credit', 'Payment', 'Balance', 'Date'],
  Accounting: ['Sales history', 'Profit & loss', 'Business snapshot', 'Sales by staff', 'Sales/income', 'Gross profit', 'Expenses', 'Net profit'],
  Expenses: ['Description', 'Category', 'Amount', 'Date', 'Recorded by'],
}

export function DownloadPanel({ active, close, selectPage, download }: { active: string; close: () => void; selectPage: (page: string) => void; download?: () => void }) {
  const pages = Object.keys(pageDescriptions)
  const [selected, setSelected] = useState<string[]>(fields[active] || [])
  const currentFields = useMemo(() => fields[active] || [], [active])
  const toggle = (field: string) => setSelected(value => value.includes(field) ? value.filter(item => item !== field) : [...value, field])
  const exportPdf = () => {
    const pdf = new jsPDF()
    pdf.setFontSize(18)
    pdf.text(`${active} report`, 16, 18)
    pdf.setFontSize(10)
    pdf.text(`Generated ${new Date().toLocaleString('en-NG')}`, 16, 26)
    pdf.setFontSize(12)
    selected.forEach((field, index) => pdf.text(`• ${field}`, 18, 40 + index * 8))
    pdf.save(`${active.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report.pdf`)
    close()
  }
  const changePage = (page: string) => { selectPage(page); setSelected(fields[page] || []) }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d2b22]/35 p-4" role="dialog" aria-modal="true" aria-labelledby="download-title">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><h2 id="download-title" className="text-xl font-bold text-[#1d2b22]">Build a PDF report</h2><p className="mt-1 text-sm text-[#7d8980]">Choose a section and the details to include.</p></div><button onClick={close} aria-label="Close download dialog"><X className="size-5" /></button></div>
      <label className="mt-5 block text-sm font-semibold text-[#39724a]">Section<select value={active} onChange={event => changePage(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8e5d8] bg-white px-3 text-sm font-medium text-[#1d2b22]">{pages.map(page => <option key={page} value={page}>{page}</option>)}</select></label>
      <fieldset className="mt-4 rounded-xl border border-[#dce9dc] p-4"><legend className="px-1 text-sm font-semibold text-[#39724a]">Tables and details</legend><div className="mt-2 grid gap-2">{currentFields.map(field => <label key={field} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-[#39483d] hover:bg-[#f4faf3]"><input type="checkbox" checked={selected.includes(field)} onChange={() => toggle(field)} className="size-4 accent-[#2f7047]" />{field}</label>)}</div></fieldset>
      <div className="mt-6 flex justify-end gap-2"><button onClick={close} className="rounded-xl border border-[#d8e5d8] px-4 py-2.5 text-sm font-semibold text-[#487054]">Cancel</button><button disabled={!selected.length} onClick={exportPdf} className="flex items-center gap-2 rounded-xl bg-[#2f7047] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Download className="size-4" /> Download PDF</button></div>
    </div>
  </div>
}

export { pageDescriptions }
