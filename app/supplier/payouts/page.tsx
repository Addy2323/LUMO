'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, DollarSign, Lock, ShieldCheck, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/status-badge'
import { formatTZS, formatDate } from '@/lib/format'
import { useSupplierStore } from '@/lib/stores/supplier-store'

export default function SupplierPayoutsPage() {
  const { orders, settlements, profile, requestPayout } = useSupplierStore()

  const deliveredOrders = orders.filter((o) => o.status === 'delivered')
  const inTransitOrders = orders.filter((o) => ['processing', 'shipped', 'pending'].includes(o.status))

  const unlockedBalance = deliveredOrders.reduce((sum, o) => sum + o.totalAmountTZS, 0)
  const lockedBalance = inTransitOrders.reduce((sum, o) => sum + o.totalAmountTZS, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payout Ledger & B2B Settlements</h1>
          <p className="text-sm text-muted-foreground">
            Track unlocked revenue from delivered orders and initiate LUMO Pay / Bank payouts.
          </p>
        </div>

        <WithdrawalDialog unlockedBalance={unlockedBalance} />
      </div>

      <Card className="border-info-500/20 bg-info-50/40 dark:bg-info-950/20">
        <CardContent className="flex items-center gap-3 p-4 text-xs text-info-800 dark:text-info-400">
          <ShieldCheck className="size-4 shrink-0 text-info-600" />
          <span>
            <strong>Delivery Payout Security Lock:</strong> Pursuant to Lumo merchant rules, customer payment subtotals are locked until the logistics partner scans successful delivery. Upon delivery scan, funds immediately unlock for withdrawal.
          </span>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-success-500/30 bg-success-50/30 dark:bg-success-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-success-800 dark:text-success-400 uppercase tracking-wider flex items-center justify-between">
              Unlocked & Available
              <CheckCircle2 className="size-4 text-success-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tnum text-success-700 dark:text-success-400">
              {formatTZS(unlockedBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for immediate B2B payout request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Locked (In Transit / Processing)
              <Lock className="size-4 text-warning-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tnum text-warning-600">
              {formatTZS(lockedBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unlocks automatically upon delivery scan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Settlement Destination
              <Wallet className="size-4 text-primary-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">CRDB Bank Tanzania</span>
            <span>Account: 0152994821000</span>
            <span>Beneficiary: Kilimanjaro Electronics Ltd</span>
          </CardContent>
        </Card>
      </div>

      {/* Payout History Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Order Subtotal Settlement Ledger</CardTitle>
          <CardDescription>Itemized breakdown of orders and payout lock status.</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y border-t border-border">
            {orders.map((order) => {
              const isUnlocked = order.status === 'delivered'
              return (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm font-mono">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Customer: {order.customerName} · Destination: {order.destinationRegion} · Placed {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <span className="font-semibold text-base tnum font-mono">{formatTZS(order.totalAmountTZS)}</span>
                    {isUnlocked ? (
                      <Badge variant="secondary" className="gap-1 text-xs text-emerald-700 bg-emerald-50 font-bold">
                        <CheckCircle2 className="size-3 text-emerald-600" /> Unlocked &amp; Settled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-xs text-amber-600 border-amber-500/40 font-bold">
                        <Lock className="size-3 text-amber-500" /> Locked until delivery
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WithdrawalDialog({ unlockedBalance }: { unlockedBalance: number }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(unlockedBalance)
  const [method, setMethod] = useState('crdb')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm">
          <DollarSign data-icon="inline-start" />
          Request Payout Withdrawal
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initiate Supplier Settlement</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-success-600" />
            <span className="font-semibold text-sm">Payout Transfer Submitted</span>
            <span className="text-xs text-muted-foreground">
              Your request for {formatTZS(amount)} has been sent to LUMO Pay B2B settlement queue.
            </span>
            <Button size="sm" onClick={() => setOpen(false)} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1 rounded bg-muted p-3 text-xs">
              <span className="text-muted-foreground">Available Unlocked Balance:</span>
              <span className="font-bold text-base text-success-600 tnum">{formatTZS(unlockedBalance)}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Withdrawal Amount (TZS)</label>
              <Input
                type="number"
                max={unlockedBalance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Destination Channel</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="crdb">CRDB Bank — Account 0152994821000</option>
                <option value="nmb">NMB Bank — Account 2041009841</option>
                <option value="lumo_b2b">LUMO Merchant B2B Transfer</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={unlockedBalance === 0}>
                Confirm Payout Transfer
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
