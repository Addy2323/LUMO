'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useSessionStore } from '@/lib/stores/session-store'
import { ORDERS, getOrdersForUser } from '@/lib/mock/orders'
import { formatTZS, formatDate } from '@/lib/format'

export default function CustomerReturnsPage() {
  const user = useSessionStore((s) => s.user)
  const isDemoUser =
    user?.id === 'usr_cus_001' ||
    user?.id === 'cust_01' ||
    user?.email === 'amina.hassan@example.co.tz'

  const userOrders = user ? (isDemoUser ? ORDERS : getOrdersForUser(user)) : []
  const deliveredOrders = userOrders.filter((o) => o.status === 'delivered')

  const [selectedOrderRef, setSelectedOrderRef] = useState<string>(deliveredOrders[0]?.reference ?? '')
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const selectedOrder = userOrders.find((o) => o.reference === selectedOrderRef) ?? deliveredOrders[0]

  function handleSubmitReturn(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrder || !reason) return
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" render={<Link href="/account" />}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Return & Refund Request</h1>
          <p className="text-sm text-muted-foreground">
            Request a return on delivered eligible items within 7 days.
          </p>
        </div>
      </div>

      <Card className="border-warning-500/20 bg-warning-50/40 dark:bg-warning-950/20">
        <CardContent className="flex items-start gap-3 p-4 text-xs text-warning-800 dark:text-warning-400">
          <ShieldCheck className="size-4 shrink-0 text-warning-600 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Important Refund Policy Notice</span>
            <span>
              All approved refunds are credited back directly to the original payment method used during checkout ({selectedOrder?.paymentMethod.toUpperCase() ?? 'AzamPay'}). Lumo does not issue store credit or customer wallet balances.
            </span>
          </div>
        </CardContent>
      </Card>

      {submitted ? (
        <Card className="border-success-500/20 bg-success-50/40 dark:bg-success-950/20">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="size-12 text-success-600" />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-foreground">Return Request Submitted</h2>
              <p className="text-xs text-muted-foreground max-w-md">
                Your return request for order <span className="font-semibold text-foreground">{selectedOrderRef}</span> has been logged with Sales Department ticket ID <span className="font-semibold text-foreground">RET-{Math.floor(10000 + Math.random() * 90000)}</span>.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" size="sm" render={<Link href="/account/orders" />}>
                View My Orders
              </Button>
              <Button size="sm" render={<Link href="/account/support" />}>
                Track Ticket Status
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Return Request Form</CardTitle>
            <CardDescription>Select a delivered order and state your reason for return.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReturn} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Select Delivered Order</label>
                <select
                  value={selectedOrderRef}
                  onChange={(e) => setSelectedOrderRef(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  {deliveredOrders.map((o) => (
                    <option key={o.id} value={o.reference}>
                      {o.reference} — {formatTZS(o.total)} ({formatDate(o.placedAt)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder ? (
                <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 text-xs">
                  <span className="font-semibold">Items in this order:</span>
                  <ul className="list-disc list-inside text-muted-foreground flex flex-col gap-0.5">
                    {selectedOrder.items.map((i) => (
                      <li key={i.sku}>
                        {i.quantity}× {i.title} ({i.variantLabel}) — {formatTZS(i.unitPrice)}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between pt-2 border-t text-foreground font-medium">
                    <span>Original Payment Method:</span>
                    <span className="tnum uppercase">{selectedOrder.paymentMethod} (Direct Refund)</span>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Reason for Return</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">-- Select a reason --</option>
                  <option value="defective">Item received is defective or damaged</option>
                  <option value="wrong_item">Received incorrect variant or product</option>
                  <option value="size_mismatch">Item size/spec does not match listing</option>
                  <option value="not_needed">Item unopened, no longer needed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Additional Details / Serial Numbers</label>
                <Textarea
                  placeholder="Provide additional details regarding the condition of the item..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" render={<Link href="/account" />}>
                  Cancel
                </Button>
                <Button type="submit">Submit Return Request</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
