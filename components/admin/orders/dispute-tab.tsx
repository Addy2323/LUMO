'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, DollarSign, RefreshCw, ShieldAlert, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatTZS, formatDate } from '@/lib/format'
import { Order, DisputeInfo } from '@/lib/mock/orders'
import { toast } from 'sonner'

export function DisputeResolutionTab({
  order,
  onUpdateStatus,
}: {
  order: Order
  onUpdateStatus: (id: string, newStatus: any) => void
}) {
  const [refundAmount, setRefundAmount] = useState<string>(order.total.toString())
  const [resolutionNote, setResolutionNote] = useState<string>('')
  const [dispute, setDispute] = useState<DisputeInfo | null>(
    order.dispute || {
      id: `disp_${Date.now()}`,
      status: 'open',
      reason: 'Customer reported unexpected shipping delay or damaged goods.',
      createdAt: order.placedAt,
    }
  )

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(refundAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid TZS refund amount')
      return
    }

    const updatedDispute: DisputeInfo = {
      ...dispute!,
      status: 'resolved',
      refundAmount: amount,
      notes: resolutionNote || `Full refund of ${formatTZS(amount)} processed to ${order.paymentMethod.toUpperCase()}`,
    }

    setDispute(updatedDispute)
    onUpdateStatus(order.id, 'cancelled')
    toast.success(`Processed ${formatTZS(amount)} refund for Order ${order.reference}`)
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Dispute Status Card */}
      <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <h4 className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
              Customer Dispute Record
            </h4>
          </div>
          <Badge
            variant="outline"
            className={`font-bold text-[10px] uppercase ${
              dispute?.status === 'resolved'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-amber-500 text-white border-amber-500'
            }`}
          >
            Dispute {dispute?.status}
          </Badge>
        </div>

        <div className="space-y-1 text-slate-700 dark:text-slate-300">
          <p><strong>Reason Filed:</strong> {dispute?.reason}</p>
          <p><strong>Filed Date:</strong> {formatDate(dispute?.createdAt || order.placedAt)}</p>
          {dispute?.refundAmount && (
            <p className="text-emerald-700 dark:text-emerald-400 font-extrabold">
              <strong>Refund Issued:</strong> {formatTZS(dispute.refundAmount)}
            </p>
          )}
          {dispute?.notes && (
            <p className="italic text-slate-600 dark:text-slate-400">
              <strong>Resolution Notes:</strong> {dispute.notes}
            </p>
          )}
        </div>
      </div>

      {/* Admin Refund Action Form */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card space-y-3">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <DollarSign className="size-4 text-emerald-600" /> Issue TZS Refund &amp; Resolve Claim
        </h4>

        <form onSubmit={handleProcessRefund} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                Refund Amount (TZS)
              </label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount in TZS"
                className="h-9 text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Maximum refundable: {formatTZS(order.total)}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                Resolution Note &amp; Audit Log
              </label>
              <Input
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Reason for refund or resolution summary..."
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={dispute?.status === 'resolved'}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <CheckCircle2 className="size-3.5 mr-1" />
              {dispute?.status === 'resolved' ? 'Refund Already Issued' : 'Confirm & Issue Refund'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
