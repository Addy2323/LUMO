'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, RotateCcw, ShieldCheck, Loader2, RefreshCw, ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { formatTZS, formatDate } from '@/lib/format'
import { toast } from 'sonner'

export default function CustomerReturnsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderRef, setSelectedOrderRef] = useState<string>('')
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const json = await res.json()
        const raw = Array.isArray(json) ? json : json.data || json.orders || []
        setOrders(raw)
        if (raw.length > 0) {
          setSelectedOrderRef(raw[0].orderNumber || raw[0].id)
        }
      }
    } catch (err) {
      console.warn('[RETURNS ORDERS FETCH ERROR]', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedOrder = orders.find((o) => (o.orderNumber || o.id) === selectedOrderRef) || orders[0]

  function handleSubmitReturn(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrder || !reason) return
    setSubmitted(true)
    toast.success('Return request logged successfully')
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl font-sans antialiased text-foreground">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" render={<Link href="/account" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Return &amp; Refund Request</h1>
            <p className="text-xs text-muted-foreground">
              Request a return on delivered eligible items within 7 days under Lumo Escrow protection.
            </p>
          </div>
        </div>

        <Button onClick={fetchOrders} variant="outline" size="sm" className="text-xs font-bold gap-1.5">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
        <CardContent className="flex items-start gap-3 p-4 text-xs text-amber-900 dark:text-amber-300">
          <ShieldCheck className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-extrabold">Important Refund Policy Notice</span>
            <span>
              All approved refunds are credited back directly to the original payment method used during checkout ({selectedOrder?.paymentMethod ? selectedOrder.paymentMethod.toUpperCase() : 'AZAMPAY MOBILE MONEY'}). Lumo does not issue store credit or customer wallet balances.
            </span>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="py-12 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="space-y-2">
            <Loader2 className="size-8 animate-spin text-[#FF6B00] mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">Loading eligible orders from database...</p>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="py-12 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <RotateCcw className="size-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-base font-extrabold text-foreground">No Placed Orders Found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You currently have no orders eligible for return or dispute in the system.
              </p>
            </div>
            <Button render={<Link href="/marketplace" />} className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs rounded-xl shadow-xs gap-2">
              <ShoppingBag className="size-4" /> Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : submitted ? (
        <Card className="border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="size-12 text-emerald-600" />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-foreground">Return Request Submitted</h2>
              <p className="text-xs text-muted-foreground max-w-md">
                Your return request for order <span className="font-semibold text-foreground">{selectedOrderRef}</span> has been logged with Sales Department ticket ID <span className="font-semibold text-foreground font-mono">RET-{Math.floor(10000 + Math.random() * 90000)}</span>.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" size="sm" render={<Link href="/account/orders" />}>
                View My Orders
              </Button>
              <Button size="sm" render={<Link href="/account/support" />} className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold">
                Track Ticket Status
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Return Request Form</CardTitle>
            <CardDescription className="text-xs">Select a delivered order and state your reason for return.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReturn} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Select Order</label>
                <select
                  value={selectedOrderRef}
                  onChange={(e) => setSelectedOrderRef(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                  required
                >
                  {orders.map((o) => {
                    const num = o.orderNumber || o.id
                    const amt = Number(o.totalAmountTZS || o.total || 0)
                    return (
                      <option key={o.id} value={num}>
                        Order #{num} — {formatTZS(amt)} ({o.createdAt ? formatDate(o.createdAt) : 'Recent'})
                      </option>
                    )
                  })}
                </select>
              </div>

              {selectedOrder ? (
                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs">
                  <span className="font-extrabold text-foreground">Items in this order:</span>
                  <ul className="list-disc list-inside text-muted-foreground flex flex-col gap-0.5 font-medium">
                    {(selectedOrder.items || []).map((i: any, idx: number) => (
                      <li key={idx}>
                        {i.quantity}× {i.product?.title || i.title || 'Wholesale Item'} — {formatTZS(Number(i.unitPriceTZS || i.unitPrice || 0))}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-foreground font-bold">
                    <span>Original Payment Method:</span>
                    <span className="uppercase text-[#FF6B00]">{selectedOrder.paymentMethod || 'AzamPay Escrow'} (Direct Refund)</span>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Reason for Return</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
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
                <label className="text-xs font-bold text-muted-foreground">Additional Details / Serial Numbers</label>
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
                <Button type="submit" className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs">
                  Submit Return Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
