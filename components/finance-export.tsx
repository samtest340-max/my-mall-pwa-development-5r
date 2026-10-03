'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

export type ExportRow = Record<string, string | number>

function fileName(businessName: string, report: string, extension: string) {
  const safe = businessName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'business'
  const date = new Date().toISOString().slice(0, 10)
  return `${safe}_${report}_${date}.${extension}`
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function FinanceExport({ businessName, report, rows, summary = true, label = 'Export' }: { businessName: string; report: string; rows: ExportRow[]; summary?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false)
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf')
  const run = async () => {
    setBusy(true)
    try {
      const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))))
      if (format === 'csv') {
        const csv = [columns.join(','), ...rows.map(row => columns.map(column => JSON.stringify(row[column] ?? '')).join(','))].join('\n')
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName(businessName, report, 'csv'))
      } else if (format === 'xlsx') {
        const sheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, sheet, report.slice(0, 31))
        XLSX.writeFile(workbook, fileName(businessName, report, 'xlsx'))
      } else {
        const pdf = new jsPDF({ orientation: 'landscape' })
        pdf.setFontSize(16); pdf.text(`${businessName} — ${report}`, 14, 16)
        pdf.setFontSize(9); pdf.text(`Generated ${new Date().toLocaleString('en-NG')}`, 14, 23)
        let y = 34
        pdf.setFont('helvetica', 'bold'); pdf.text(columns.join(' | ').slice(0, 150), 14, y); y += 7
        pdf.setFont('helvetica', 'normal')
        rows.forEach(row => { if (y > 190) { pdf.addPage(); y = 18 } pdf.text(columns.map(column => String(row[column] ?? '')).join(' | ').slice(0, 180), 14, y); y += 6 })
        if (summary) pdf.text(`Total records: ${rows.length}`, 14, Math.min(y + 5, 200))
        pdf.save(fileName(businessName, report, 'pdf'))
      }
      await new Promise(resolve => setTimeout(resolve, 250))
    } finally { setBusy(false) }
  }
  return <div className="flex items-center gap-2"><select aria-label={`${report} export format`} value={format} onChange={event => setFormat(event.target.value as typeof format)} className="h-10 rounded-xl border border-[#d8e5d8] bg-white px-2 text-xs font-semibold text-[#39724a]"><option value="pdf">PDF</option><option value="xlsx">Excel</option><option value="csv">CSV</option></select><button onClick={() => void run()} disabled={busy} className="flex items-center gap-2 rounded-xl border border-[#cfe2d0] bg-[#eef7ed] px-3 py-2.5 text-xs font-semibold text-[#39724a] disabled:opacity-60">{busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}{busy ? 'Preparing…' : label}</button></div>
}
