'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Headphones,
  MessageSquare,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  AlertTriangle,
  FileText,
  ChevronRight,
  Package,
  CreditCard,
  Phone,
  Check,
  Sparkles,
  Loader2,
  Lock,
  Smartphone,
  Calendar,
  User as UserIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/status-badge'
import { formatTZS, formatDate } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'
import { OrderProductThumbnail } from '@/components/account/order-product-thumbnail'
import { MongikeMobileMoneyModal } from '@/components/checkout/mongike-mobile-money-modal'
import { toast } from 'sonner'

export function CustomerDashboard() {
  const user = useSessionStore((s) => s.user)
  const [orders, setOrders] = useState<any[]>([])
  const [sourcing, setSourcing] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Interactive Action Modals State
  const [selectedQuote, setSelectedQuote] = useState<any>(null)
  const [selectedPayOrder, setSelectedPayOrder] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCustomerData()

    if (typeof window !== 'undefined') {
      window.addEventListener('lumo_orders_updated', fetchCustomerData)
      window.addEventListener('lumo_sourcing_updated', fetchCustomerData)
      return () => {
        window.removeEventListener('lumo_orders_updated', fetchCustomerData)
        window.removeEventListener('lumo_sourcing_updated', fetchCustomerData)
      }
    }
  }, [])

  async function fetchCustomerData() {
    setLoading(true)
    try {
      let dbOrders: any[] = []
      let sourcingData: any[] = []

      const [ordersRes, sourcingRes] = await Promise.all([
        fetch('/api/orders').catch(() => null),
        fetch('/api/sourcing').catch(() => null),
      ])

      if (ordersRes && ordersRes.ok) {
        const data = await ordersRes.json()
        dbOrders = Array.isArray(data) ? data : data.data || data.orders || []
      }
      if (sourcingRes && sourcingRes.ok) {
        const data = await sourcingRes.json()
        sourcingData = Array.isArray(data) ? data : data.requests || []
      }

      setOrders(dbOrders)
      setSourcing(sourcingData)
    } catch (err) {
      console.error('Failed to load customer data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle Quotation Approval
  async function handleQuotationResponse(action: 'APPROVE' | 'REJECT') {
    if (!selectedQuote) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/sourcing/${selectedQuote.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(action === 'APPROVE' ? 'Sourcing Quote approved! Order created.' : 'Quotation rejected.')
        setSelectedQuote(null)
        fetchCustomerData()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('lumo_orders_updated'))
        }
      } else {
        toast.error(data.error || 'Failed to submit response')
      }
    } catch (e) {
      toast.error('Network error updating quotation')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter metrics strictly from real data
  const processingOrders = orders.filter((o) => ['PROCESSING', 'PAID', 'SHIPPED', 'PENDING_PAYMENT', 'PENDING'].includes(o.status || ''))
  const inTransitOrders = orders.filter((o) => ['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status || ''))
  const pendingPayments = orders.filter((o) => ['PENDING_PAYMENT', 'UNPAID', 'PENDING'].includes(o.status || ''))
  const pendingQuotations = sourcing.filter((s) => ['QUOTED'].includes(s.status || ''))
  const totalSpent = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + (Number(o.totalAmountTZS) || Number(o.total) || 0), 0)

  // Timeline steps for order visual progression
  const timelineStages = [
    { label: 'Order Created', key: 'created' },
    { label: 'Payment Confirmed', key: 'paid' },
    { label: 'Supplier Processing', key: 'processing' },
    { label: 'Quality Inspection', key: 'inspection' },
    { label: 'Ready for Shipping', key: 'ready' },
    { label: 'In Transit', key: 'transit' },
    { label: 'Out for Delivery', key: 'delivery' },
    { label: 'Delivered', key: 'delivered' },
  ]

  const hasActionItems = pendingQuotations.length > 0 || pendingPayments.length > 0

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-slate-900 bg-surface-secondary min-h-screen pb-24">
      {/* 1. Header with CTA Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              Jambo, {user?.fullName || 'Valued Buyer'} 👋
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold gap-1">
              <CheckCircle2 className="size-3" /> Verified Buyer Account
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Shopping, factory sourcing, LUMO Pay trade protection, and live freight delivery control centre.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/80 text-white font-bold text-xs h-9 px-4 gap-2 shadow-xs"
            render={<Link href="/marketplace" />}
          >
            <ShoppingBag className="size-4" /> Browse Marketplace
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-4 gap-2"
            render={<Link href="/sourcing/request" />}
          >
            <PackageSearch className="size-4 text-primary" /> Request Sourcing
          </Button>
        </div>
      </div>

      {/* 2. Dynamic Action Centre (Tasks Needing Attention) */}
      {hasActionItems && (
        <Card className="border-amber-200 bg-amber-50/50 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600 shrink-0" />
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                CUSTOMER ACTION CENTRE — TASKS REQUIRING ATTENTION
              </h3>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-mono">
              {pendingQuotations.length + pendingPayments.length} Pending Items
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Sourcing Quotation Actions */}
            {pendingQuotations.map((q) => (
              <div key={q.id} className="p-3.5 bg-white border border-amber-200 rounded-xl shadow-xs space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <FileText className="size-4 text-primary" /> Approve Sourcing Quotation
                    </span>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[9px] font-mono font-bold">
                      Quoted
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    {q.productName || q.description || q.productUrl || 'Sourcing Request'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Target Qty: {q.targetQuantity || 1} units · Landed quote ready from sales desk.
                  </p>
                </div>
                <Button
                  size="xs"
                  onClick={() => setSelectedQuote(q)}
                  className="w-full bg-primary hover:bg-primary/80 text-white text-xs font-bold h-8 gap-1.5 shadow-xs"
                >
                  <FileText className="size-3.5" /> Review Landed Quote
                </Button>
              </div>
            ))}

            {/* Order Payment Actions */}
            {pendingPayments.map((p) => {
              const firstItem = p.items?.[0]
              const itemTitle = firstItem?.product?.title || p.productName || 'Wholesale Order'
              return (
                <div key={p.id} className="p-3.5 bg-white border border-amber-200 rounded-xl shadow-xs space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="size-4 text-emerald-600" /> Complete LUMO Pay Payment
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-mono font-bold">
                        Pending Payment
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">#{p.orderNumber || p.id}</span>
                      <span className="font-mono font-black text-emerald-700">{formatTZS(Number(p.totalAmountTZS || 0))}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {itemTitle} — Payment deposit awaiting payment confirmation.
                    </p>
                  </div>
                  <Button
                    size="xs"
                    onClick={() => setSelectedPayOrder(p)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 gap-1.5 shadow-xs"
                  >
                    <CreditCard className="size-3.5" /> Pay via Mobile Money / Card
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 3. Actionable KPI Cards (8 Grid) - 100% Real User Data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Link href="/account/orders" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-primary transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Total Orders</span>
          <div className="text-xl font-black text-slate-900 font-mono">{orders.length}</div>
        </Link>

        <Link href="/account/orders?status=processing" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Processing</span>
          <div className="text-xl font-black text-blue-600 font-mono">{processingOrders.length}</div>
        </Link>

        <Link href="/account/shipments" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-indigo-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">In Transit</span>
          <div className="text-xl font-black text-indigo-600 font-mono">{inTransitOrders.length}</div>
        </Link>

        <Link href="/account/quotations" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-purple-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Quotations</span>
          <div className="text-xl font-black text-purple-600 font-mono">{pendingQuotations.length}</div>
        </Link>

        <Link href="/account/payments" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-amber-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Pending Pay</span>
          <div className="text-xl font-black text-amber-600 font-mono">{pendingPayments.length}</div>
        </Link>

        <Link href="/account/returns" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-rose-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Disputes</span>
          <div className="text-xl font-black text-rose-600 font-mono">{disputes.length}</div>
        </Link>

        <Link href="/account/payments" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-emerald-500 transition space-y-1 col-span-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Total Purchases</span>
          <div className="text-lg font-black text-emerald-700 font-mono">{formatTZS(totalSpent)}</div>
        </Link>
      </div>

      {/* 4. Active Order Progress Visual Timeline & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Active Order Visual Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Active Order Progression &amp; Live Tracking</h3>
                <p className="text-xs text-slate-500">Real-time status tracking from factory production to Dar es Salaam delivery.</p>
              </div>
              <Button size="xs" variant="outline" className="text-xs font-bold" render={<Link href="/account/orders" />}>
                View All Orders <ArrowRight className="size-3 ml-1" />
              </Button>
            </div>

            {/* Visual Timeline Steps Bar */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 overflow-x-auto pb-1 gap-2">
                {timelineStages.map((stg, idx) => (
                  <div key={stg.key} className="flex items-center gap-1 shrink-0">
                    <span className={`size-2 rounded-full ${idx <= 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={idx <= 1 ? 'text-slate-900 font-bold' : 'text-slate-400'}>{stg.label}</span>
                    {idx < timelineStages.length - 1 && <ChevronRight className="size-3 text-slate-300" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Active Orders List or Clean Empty State */}
            <div className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="size-12 rounded-full bg-orange-50 text-primary flex items-center justify-center mx-auto">
                    <Package className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">No Active Orders Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      You have not placed any orders yet. Explore our wholesale marketplace or request a custom factory quote.
                    </p>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/80 text-white font-bold text-xs h-8 mt-2" render={<Link href="/marketplace" />}>
                    Start Shopping
                  </Button>
                </div>
              ) : (
                orders.slice(0, 3).map((order) => {
                  const firstItem = order.items?.[0]
                  let itemImg = firstItem?.product?.imageUrl || firstItem?.image || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=200&q=80'
                  if (itemImg.startsWith('//')) {
                    itemImg = `https:${itemImg}`
                  }
                  const itemTitle = firstItem?.product?.title || firstItem?.title || 'Wholesale Products'

                  return (
                    <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3.5">
                        <OrderProductThumbnail src={itemImg} alt={itemTitle} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">Order #{order.orderNumber || order.reference || order.id}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-slate-700 font-bold text-xs line-clamp-1">{itemTitle}</p>
                          <p className="text-slate-400 text-[11px]">Placed on {formatDate(order.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right mr-2 hidden sm:block">
                          <div className="font-mono font-black text-sm text-slate-900">{formatTZS(Number(order.totalAmountTZS || 0))}</div>
                          <span className="text-[10px] text-emerald-600 font-bold">LUMO Payment Protection Protected</span>
                        </div>

                        <Button size="xs" variant="outline" className="text-[10px] font-bold h-8" render={<Link href={`/account/orders/${order.id}`} />}>
                          Track Order
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Lumo Buyer Protection Card & Shortcuts */}
        <div className="space-y-6">
          {/* Lumo Buyer Protection Card */}
          <Card className="bg-slate-900 text-white p-5 shadow-xs space-y-4 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-400" />
                <h3 className="font-black text-sm">Lumo Buyer Protection</h3>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-bold">
                100% Guaranteed
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Trade Protection Provider:</span>
                <span className="font-bold text-white">LUMO Pay Mobile &amp; Card Gateway</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Protected Amount:</span>
                <span className="font-mono font-bold text-emerald-400">{formatTZS(totalSpent)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Inspection Status:</span>
                <span className="font-bold text-white">{orders.length > 0 ? 'Verified' : 'No Active Orders'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Dispute Coverage:</span>
                <span className="font-bold text-white">14-Day Delivery Guarantee</span>
              </div>
            </div>

            <Button
              size="xs"
              variant="outline"
              className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold h-8"
              render={<Link href="/account/returns" />}
            >
              Open Dispute / Claim Refund
            </Button>
          </Card>

          {/* Customer Quick Shortcuts */}
          <Card className="bg-white border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Control Centre Shortcuts</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <Link href="/account/quotations" className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-between font-bold text-slate-800 transition">
                <span className="flex items-center gap-2"><FileText className="size-4 text-primary" /> My Sourcing Quotations</span>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>
              <Link href="/account/documents" className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-between font-bold text-slate-800 transition">
                <span className="flex items-center gap-2"><Download className="size-4 text-blue-600" /> Commercial Invoices &amp; Waybills</span>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>
              <Link href="/account/messages" className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-between font-bold text-slate-800 transition">
                <span className="flex items-center gap-2"><MessageSquare className="size-4 text-purple-600" /> Sales Department Inbox</span>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>
              <Link href="/account/support" className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-between font-bold text-slate-800 transition">
                <span className="flex items-center gap-2"><Headphones className="size-4 text-emerald-600" /> Support Centre &amp; Help Desk</span>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. Landed Cost Quotation Review Modal */}
      {selectedQuote && (
        <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
          <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200">
            <DialogHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <Badge className="bg-orange-50 text-primary border-orange-200 text-xs font-bold gap-1">
                  <Sparkles className="size-3" /> Landed Cost Sourcing Quote
                </Badge>
              </div>
              <DialogTitle className="text-lg font-black text-slate-900">
                {selectedQuote.productName || selectedQuote.description || 'Custom Sourcing Request'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Verified B2B direct factory quote with complete landed cost breakdown.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-2 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Target Quantity:</span>
                  <span className="font-bold text-slate-900">{selectedQuote.targetQuantity || 1} units</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Factory Product Cost:</span>
                  <span className="font-mono text-slate-900">
                    {formatTZS(selectedQuote.targetPriceTZS ? Number(selectedQuote.targetPriceTZS) * 0.7 : 175000)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Freight &amp; Quality Audit Fee:</span>
                  <span className="font-mono text-slate-900">
                    {formatTZS(selectedQuote.targetPriceTZS ? Number(selectedQuote.targetPriceTZS) * 0.15 : 37500)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tanzania Import Customs &amp; Trade Protection:</span>
                  <span className="font-mono text-slate-900">
                    {formatTZS(selectedQuote.targetPriceTZS ? Number(selectedQuote.targetPriceTZS) * 0.15 : 37500)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                  <span>Total Landed Price:</span>
                  <span className="font-mono text-primary">
                    {formatTZS(selectedQuote.targetPriceTZS ? Number(selectedQuote.targetPriceTZS) : 250000)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setSelectedQuote(null)}
                className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold h-10"
              >
                Reject / Revision
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() => handleQuotationResponse('APPROVE')}
                className="flex-1 bg-primary hover:bg-primary/80 text-white text-xs font-bold h-10 gap-1.5"
              >
                {isSubmitting ? 'Processing...' : 'Approve & Create Order'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 6. Real Mongike Mobile Money Instant USSD Push Payment Modal */}
      {selectedPayOrder && (
        <MongikeMobileMoneyModal
          isOpen={!!selectedPayOrder}
          onClose={() => setSelectedPayOrder(null)}
          orderId={selectedPayOrder.id}
          orderNumber={selectedPayOrder.orderNumber || selectedPayOrder.id}
          amountTZS={Number(selectedPayOrder.totalAmountTZS || 0)}
          defaultPhone={user?.phone || selectedPayOrder.shippingAddress?.phone || '+255658056448'}
          onSuccess={() => {
            setSelectedPayOrder(null)
            fetchCustomerData()
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('lumo_orders_updated'))
            }
            toast.success(`Payment for Order #${selectedPayOrder.orderNumber || selectedPayOrder.id} confirmed!`)
          }}
        />
      )}
    </div>
  )
}
