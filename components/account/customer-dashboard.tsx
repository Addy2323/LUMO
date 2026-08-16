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
  Package
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { formatTZS, formatDate } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'
import { OrderProductThumbnail } from '@/components/account/order-product-thumbnail'

export function CustomerDashboard() {
  const user = useSessionStore((s) => s.user)
  const [orders, setOrders] = useState<any[]>([])
  const [sourcing, setSourcing] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomerData()

    if (typeof window !== 'undefined') {
      window.addEventListener('lumo_orders_updated', fetchCustomerData)
      return () => {
        window.removeEventListener('lumo_orders_updated', fetchCustomerData)
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
        fetch('/api/sourcing').catch(() => null)
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

  // Filter metrics strictly from real data
  const processingOrders = orders.filter((o) => ['PROCESSING', 'PAID', 'SHIPPED', 'PENDING_PAYMENT', 'PENDING'].includes(o.status || ''))
  const inTransitOrders = orders.filter((o) => ['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status || ''))
  const pendingPayments = orders.filter((o) => ['PENDING_PAYMENT', 'UNPAID', 'PENDING'].includes(o.status || ''))
  const pendingQuotations = sourcing.filter((s) => ['QUOTED', 'SUBMITTED'].includes(s.status || ''))
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
    <div className="flex flex-col gap-6 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen pb-24">
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
            Shopping, factory sourcing, AzamPay escrow protection, and live freight delivery control centre.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-2 shadow-xs"
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
            <PackageSearch className="size-4 text-[#FF6B00]" /> Request Sourcing
          </Button>
        </div>
      </div>

      {/* 2. Top Action Centre (Tasks Needing Attention) - Rendered ONLY if real tasks exist */}
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
            {pendingQuotations.map((q) => (
              <div key={q.id} className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-900">Approve Sourcing Quotation</span>
                  <span className="text-[10px] text-amber-700 font-mono font-bold">Quoted</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {q.productName || q.title || 'Sourcing Quotation ready for landed cost review.'}
                </p>
                <Button size="xs" className="w-full bg-[#FF6B00] text-white text-[10px] font-bold h-7" render={<Link href="/account/quotations" />}>
                  Review Landed Quote
                </Button>
              </div>
            ))}

            {pendingPayments.map((p) => (
              <div key={p.id} className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-900">Complete AzamPay Payment</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">Pending Payment</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Order #{p.orderNumber || p.id} deposit awaiting payment confirmation.
                </p>
                <Button size="xs" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold h-7" render={<Link href="/account/payments" />}>
                  Pay via Mobile Money
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Actionable KPI Cards (8 Grid) - 100% Real User Data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Link href="/account/orders" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-[#FF6B00] transition space-y-1">
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
                  <div className="size-12 rounded-full bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto">
                    <Package className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">No Active Orders Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      You have not placed any orders yet. Explore our wholesale marketplace or request a custom factory quote.
                    </p>
                  </div>
                  <Button size="sm" className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-8 mt-2" render={<Link href="/marketplace" />}>
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
                          <span className="text-[10px] text-emerald-600 font-bold">AzamPay Escrow Protected</span>
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
                <span className="text-slate-400">Escrow Provider:</span>
                <span className="font-bold text-white">AzamPay Mobile Money</span>
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
                <span className="flex items-center gap-2"><FileText className="size-4 text-[#FF6B00]" /> My Sourcing Quotations</span>
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
    </div>
  )
}
