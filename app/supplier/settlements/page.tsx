'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Plus,
  ShieldCheck,
  Building2,
  Phone,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatTZS, formatDate } from '@/lib/format'
import { useSupplierStore } from '@/lib/stores/supplier-store'
import { toast } from 'sonner'

export default function SupplierSettlementsPage() {
  const { settlements, profile, requestPayout } = useSupplierStore()

  // On-Demand Payout Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState(5000000)
  const [payoutMethod, setPayoutMethod] = useState('CRDB Bank Direct Wire')

  const availableBalanceTZS = 0
  const pendingEscrowTZS = 0

  function handlePayoutSubmit() {
    if (payoutAmount <= 0 || payoutAmount > availableBalanceTZS) {
      toast.error('Invalid payout amount or exceeds available balance')
      return
    }

    requestPayout(payoutAmount, payoutMethod)
    toast.success(`Payout request for ${formatTZS(payoutAmount)} submitted!`)
    setIsModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Settlements &amp; Escrow Payouts</h1>
          <p className="text-sm text-muted-foreground">
            Manage unlocked earnings, request instant bank wire or M-Pesa payouts, and view past settlement statements.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
          <Plus className="size-4 mr-1" />
          Request Instant Payout
        </Button>
      </div>

      {/* Financial Balance Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border/80">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available for Withdrawal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">{formatTZS(availableBalanceTZS)}</div>
            <p className="text-[11px] text-muted-foreground">Unlocked after 24h delivery scan</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/80">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Escrow Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">{formatTZS(pendingEscrowTZS)}</div>
            <p className="text-[11px] text-muted-foreground">Held safely during logistics transit</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/80">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Settled Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">
              {formatTZS(settlements.reduce((sum, s) => sum + s.amountTZS, 0))}
            </div>
            <p className="text-[11px] text-muted-foreground">Across {settlements.length} settlement batches</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Info Bar */}
      <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
        <div className="flex items-center gap-3">
          <Building2 className="size-5 text-brand-500 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-foreground">Registered Payout Bank Account:</span>
            <span className="text-muted-foreground font-mono">
              {profile.bankAccount.bankName || 'Not configured'} · Acc #{profile.bankAccount.accountNumber || 'Pending'} ({profile.bankAccount.accountName || 'Merchant'})
            </span>
          </div>
        </div>
        <Link href="/supplier/company" className="text-brand-500 font-bold hover:underline shrink-0 text-xs">
          Edit Payout Details →
        </Link>
      </div>

      {/* Settlement History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Banknote className="size-5 text-brand-500" />
              Settlement Payout Ledger
            </CardTitle>
            <CardDescription className="text-xs">Past disbursed funds to your CRDB Bank &amp; M-Pesa accounts</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {settlements.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2 border-t">
              <Banknote className="size-10 text-muted-foreground/40 mx-auto" />
              <p className="font-bold text-sm text-foreground">No Payout Settlements Recorded</p>
              <p className="max-w-md mx-auto">
                Completed escrow releases and requested payouts will generate statements here.
              </p>
            </div>
          ) : (
            <div className="divide-y border-t border-border">
              {settlements.map((s) => (
                <div key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-brand-500 text-sm">{s.reference}</span>
                      <Badge
                        className={`text-[10px] font-bold ${
                          s.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                        }`}
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Method: <strong className="text-foreground">{s.method}</strong> · Period: {s.period}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">Transacted: {formatDate(s.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                    <span className="font-mono font-extrabold text-base text-foreground">{formatTZS(s.amountTZS)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.success(`Downloaded Receipt statement for ${s.reference}`)}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                    >
                      <Download className="size-3.5 mr-1" />
                      Download Statement
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Payout Modal */}
      {isModalOpen && (
        <Dialog open onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">Request Instant Payout</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-muted-foreground font-semibold">Available Balance:</span>
                <div className="font-mono font-extrabold text-lg text-emerald-600">{formatTZS(availableBalanceTZS)}</div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Payout Amount (TZS)</label>
                <Input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="font-mono text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Disbursement Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none"
                >
                  <option value="CRDB Bank Direct Wire">CRDB Bank Direct Wire ({profile.bankAccount.accountNumber})</option>
                  <option value="Vodacom M-Pesa Corporate">Vodacom M-Pesa Corporate ({profile.mobilePayout.phoneNumber})</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePayoutSubmit} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                Submit Payout Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
