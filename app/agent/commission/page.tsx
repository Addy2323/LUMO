'use client'

import { useState } from 'react'
import { DollarSign, Download, CreditCard, CheckCircle2, Clock, FileText, ArrowDownRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function AgentCommissionPage() {
  const [downloading, setDownloading] = useState(false)

  function handleDownloadStatement() {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      const content = `LUMO SOURCING AGENT COMMISSION STATEMENT\nAgent: Mwanahawa Juma (Guangzhou Hub)\nDate: ${new Date().toLocaleDateString()}\n----------------------------------------\nCompleted Jobs: 14\nEarned Commissions: TZS 4,850,000\nApproved Expenses: TZS 1,200,000\nTotal Payout: TZS 6,050,000\nStatus: PAID VIA WIRE`
      const element = document.createElement('a')
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`)
      element.setAttribute('download', `Agent_Commission_Statement_${new Date().toISOString().slice(0, 7)}.txt`)
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      toast.success('Downloaded Agent Commission Statement!')
    }, 1000)
  }

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Agent Commission &amp; Expense Console</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track origin sourcing inspection fees, approved factory visit expenses, and download monthly statements.
          </p>
        </div>

        <Button
          onClick={handleDownloadStatement}
          disabled={downloading}
          className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs gap-1.5"
        >
          <Download className="size-4" /> Download Monthly Statement
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800 border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-400 font-medium">Earned Commission (This Month)</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-0.5">{formatTZS(4850000)}</h3>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-400 font-medium">Approved Factory Visit Expenses</span>
          <h3 className="text-2xl font-black text-blue-400 mt-0.5">{formatTZS(1200000)}</h3>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-400 font-medium">Pending HQ Disbursement</span>
          <h3 className="text-2xl font-black text-amber-400 mt-0.5">{formatTZS(1450000)}</h3>
        </Card>
      </div>

      {/* Payout History Ledger */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <h2 className="font-extrabold text-sm text-white">Recent Commission Disbursements</h2>
        <div className="divide-y divide-slate-800 border-t border-slate-800 text-xs">
          <div className="py-3 flex justify-between items-center">
            <div>
              <p className="font-bold text-white">Inspection Fee: Order #LUMO-TZ-98201</p>
              <p className="text-[10px] text-slate-400">Guangzhou Sanitaryware Factory Audit</p>
            </div>
            <span className="font-mono font-bold text-emerald-400">+{formatTZS(350000)}</span>
          </div>

          <div className="py-3 flex justify-between items-center">
            <div>
              <p className="font-bold text-white">Approved Expense: Yiwu High-speed Rail Ticket</p>
              <p className="text-[10px] text-slate-400">Receipt Verified by Finance</p>
            </div>
            <span className="font-mono font-bold text-blue-400">+{formatTZS(180000)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
