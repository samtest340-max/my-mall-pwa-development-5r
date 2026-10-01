'use client'

import { Download, X } from 'lucide-react'

const pageDescriptions: Record<string, string> = {
  'Point of Sale': 'Sales history and completed transactions',
  Inventory: 'Products and their current stock, pricing and SKU details',
  Customers: 'Customer contacts and outstanding balances',
  'Credit & Debtors': 'Credit and debtor balances and payment details',
  Accounting: 'Sales history, profit and loss, business snapshot, staff sales, income, gross profit, expenses and net profit',
  Expenses: 'Expense records and amounts',
}

export function DownloadPanel({ active, close, selectPage, download }: { active: string; close: () => void; selectPage: (page: string) => void; download: () => void }) {
  const description = pageDescriptions[active] ?? 'All visible records and details on this page'
  const pages = Object.keys(pageDescriptions)
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d2b22]/35 p-4" role="dialog" aria-modal="true" aria-labelledby="download-title">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><h2 id="download-title" className="text-xl font-bold text-[#1d2b22]">Download page records</h2><p className="mt-1 text-sm text-[#7d8980]">Select the page you want to save as a PDF.</p></div><button onClick={close} aria-label="Close download dialog"><X className="size-5" /></button></div>
      <label className="mt-5 block text-sm font-semibold text-[#39724a]">Page to download<select value={active} onChange={event => selectPage(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8e5d8] bg-white px-3 text-sm font-medium text-[#1d2b22]">{pages.map(page => <option key={page} value={page}>{page}</option>)}</select></label><div className="mt-4 rounded-xl border border-[#dce9dc] bg-[#f7fbf6] p-4"><div className="text-xs font-bold uppercase tracking-[0.12em] text-[#39724a]">{active}</div><p className="mt-2 text-sm leading-6 text-[#657268]">{description}. The PDF uses the current table and details displayed on this page.</p></div>
      <div className="mt-6 flex justify-end gap-2"><button onClick={close} className="rounded-xl border border-[#d8e5d8] px-4 py-2.5 text-sm font-semibold text-[#487054]">Cancel</button><button onClick={download} className="flex items-center gap-2 rounded-xl bg-[#2f7047] px-4 py-2.5 text-sm font-semibold text-white"><Download className="size-4" /> Download PDF</button></div>
    </div>
  </div>
}
