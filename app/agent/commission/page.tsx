'use client'

import { useState } from 'react'
import {
  DollarSign,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  FileText,
  ArrowDownRight,
  PlusCircle,
  TrendingUp,
  Award,
  Send,
  Building2,
  Smartphone,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function AgentCommissionPage() {
  const [downloading, setDownloading] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)

  // Payout Form
  const [payoutAmount, setPayoutAmount] = useState('1450000')
  const [payoutMethod, setPayoutMethod] = useState<'wire' | 'mpesa'>('wire')
  const [bankAccount, setBankAccount] = useState('CRDB Bank Tanzania · 015029482019')

  // Expense Form
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Travel')

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

  function handleRequestPayout() {
    setShowPayoutModal(false)
    toast.success(`Payout request for ${formatTZS(Number(payoutAmount))} submitted to LUMO HQ Finance!`)
  }

  function handleAddExpense() {
    if (!expenseTitle || !expenseAmount) {
      toast.error('Please enter expense title and amount')
      return
    }
    setShowExpenseModal(false)
    toast.success(`Expense claim "${expenseTitle}" (${formatTZS(Number(expenseAmount))}) submitted for approval!`)
    setExpenseTitle('')
    setExpenseAmount('')
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

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowExpenseModal(true)}
            variant="outline"
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            <PlusCircle className="size-4 mr-1.5" /> Claim Expense
          </Button>

          <Button
            onClick={handleDownloadStatement}
            disabled={downloading}
            className="bg-primary hover:bg-primary/80 text-white font-bold text-xs gap-1.5"
          >
            <Download className="size-4" /> Download Statement
          </Button>
        </div>
      </div>

      {/* Tier Performance Banner */}
      <Card className="bg-slate-900 border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Gold Sourcing Agent Tier</h3>
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                3.5% Commission Rate
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              14 Completed Sourcing Jobs · 99.4% Quality Pass Rate · Next Tier: Platinum (20 Jobs)
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowPayoutModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 shadow-lg shadow-emerald-600/20 shrink-0"
        >
          <Send className="size-3.5 mr-1.5" /> Request HQ Payout
        </Button>
      </Card>

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
          <span className="text-xs text-slate-400 font-medium">Available for HQ Payout</span>
          <h3 className="text-2xl font-black text-amber-400 mt-0.5">{formatTZS(1450000)}</h3>
        </Card>
      </div>

      {/* Payout History Ledger */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-white">Recent Commission &amp; Expense Disbursements</h2>
          <span className="text-xs text-slate-400 font-mono">Last updated: Today</span>
        </div>

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

          <div className="py-3 flex justify-between items-center">
            <div>
              <p className="font-bold text-white">Sourcing Fee: Order #LUMO-TZ-84920</p>
              <p className="text-[10px] text-slate-400">Foshan Furniture Sourcing &amp; Landed Cost Negotiation</p>
            </div>
            <span className="font-mono font-bold text-emerald-400">+{formatTZS(920000)}</span>
          </div>
        </div>
      </Card>

      {/* Request Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Request Commission Payout</h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-bold">Withdrawal Amount (TZS)</Label>
                <Input
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-emerald-400 font-mono text-base font-black"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-bold block">Payout Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('wire')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                      payoutMethod === 'wire' ? 'bg-brand-500/20 border-brand-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building2 className="size-4 text-brand-400" /> Bank Wire
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('mpesa')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                      payoutMethod === 'mpesa' ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Smartphone className="size-4 text-emerald-400" /> M-Pesa / T-Pesa
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-bold">Account / Mobile Number</Label>
                <Input
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs font-bold"
                />
              </div>

              <Button
                onClick={handleRequestPayout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-11"
              >
                Confirm Payout Request
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Claim Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Claim Operational Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-bold">Expense Description</Label>
                <Input
                  placeholder="e.g. Guangzhou to Yiwu Factory Train Ticket"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-bold">Amount (TZS)</Label>
                <Input
                  placeholder="e.g. 180000"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleAddExpense}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs h-11"
              >
                Submit Expense Claim for Verification
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

