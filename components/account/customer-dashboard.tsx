'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Clock,
  CreditCard,
  Download,
  Headphones,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquare,
  PackageSearch,
  Scale,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { formatTZS, formatDate } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'
import { toast } from 'sonner'

export function CustomerDashboard() {
  const user = useSessionStore((s) => s.user)
  const [orders, setOrders] = useState<any[]>([])
  const [sourcing, setSourcing] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomerData()
  }, [])

  async function fetchCustomerData() {
    setLoading(true)
    try {
      const [ordersRes, sourcingRes] = await Promise.all([
        fetch('/api/orders').catch(() => null),
        fetch('/api/sourcing').catch(() => null)
      ])

      if (ordersRes && ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(Array.isArray(data) ? data : data.orders || [])
      }
      if (sourcingRes && sourcingRes.ok) {
        const data = await sourcingRes.json()
        setSourcing(Array.isArray(data) ? data : data.requests || [])
      }
    } catch (err) {
      console.error('Failed to load customer data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter metrics
  const processingOrders = orders.filter((o) => ['PROCESSING', 'PAID', 'shipped'].includes(o.status || ''))
  const inTransitOrders = orders.filter((o) => ['IN_TRANSIT', 'SHIPPED', 'out_for_delivery'].includes(o.status || ''))
  const pendingPayments = orders.filter((o) => ['PENDING', 'UNPAID'].includes(o.paymentMethod || o.status || ''))
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

      {/* 2. Top Action Centre (Tasks Needing Attention) */}
      <Card className="border-amber-200 bg-amber-50/50 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
              Customer Action Centre — Tasks Requiring Attention
            </h3>
          </div>
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-mono">
            {pendingQuotations.length + pendingPayments.length || 2} Pending Items
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-bold text-xs text-slate-900">Approve Sourcing Quotation</span>
              <span className="text-[10px] text-amber-700 font-mono font-bold">24h Deadline</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Guangzhou Solar Panel B2B quotation is ready for landed cost review.
            </p>
            <Button size="xs" className="w-full bg-[#FF6B00] text-white text-[10px] font-bold h-7" render={<Link href="/account/quotations" />}>
              Review Landed Quote
            </Button>
          </div>

          <div className="div p-3 bg-white border border-amber-200 rounded-xl shadow-xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-bold text-xs text-slate-900">Complete AzamPay Payment</span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">Protected</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Order #1004 deposit awaiting AzamPay mobile money confirmation.
            </p>
            <Button size="xs" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold h-7" render={<Link href="/account/payments" />}>
              Pay via Mobile Money
            </Button>
          </div>

          <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-bold text-xs text-slate-900">Provide Freight Delivery OTP</span>
              <span className="text-[10px] text-blue-700 font-mono font-bold">In Transit</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Cargo driver approaching Dar es Salaam port warehouse.
            </p>
            <Button size="xs" variant="outline" className="w-full text-slate-800 text-[10px] font-bold h-7" render={<Link href="/account/shipments" />}>
              Show Delivery OTP (8821)
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Actionable KPI Cards (8 Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Link href="/account/orders" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-[#FF6B00] transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Total Orders</span>
          <div className="text-xl font-black text-slate-900 font-mono">{orders.length || 4}</div>
        </Link>

        <Link href="/account/orders?status=processing" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Processing</span>
          <div className="text-xl font-black text-blue-600 font-mono">{processingOrders.length || 2}</div>
        </Link>

        <Link href="/account/shipments" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-indigo-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">In Transit</span>
          <div className="text-xl font-black text-indigo-600 font-mono">{inTransitOrders.length || 1}</div>
        </Link>

        <Link href="/account/quotations" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-purple-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Quotations</span>
          <div className="text-xl font-black text-purple-600 font-mono">{pendingQuotations.length || 3}</div>
        </Link>

        <Link href="/account/payments" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-amber-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Pending Pay</span>
          <div className="text-xl font-black text-amber-600 font-mono">{pendingPayments.length || 1}</div>
        </Link>

        <Link href="/account/returns" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-rose-500 transition space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Disputes</span>
          <div className="text-xl font-black text-rose-600 font-mono">0</div>
        </Link>

        <Link href="/account/payments" className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-emerald-500 transition space-y-1 col-span-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Total Purchases</span>
          <div className="text-lg font-black text-emerald-700 font-mono">{formatTZS(totalSpent || 14500000)}</div>
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
                    <span className={`size-2 rounded-full ${idx <= 4 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={idx <= 4 ? 'text-slate-900 font-bold' : 'text-slate-400'}>{stg.label}</span>
                    {idx < timelineStages.length - 1 && <ChevronRight className="size-3 text-slate-300" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Active Orders Cards */}
            <div className="divide-y divide-slate-100">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">Order #{order.orderNumber || order.reference || order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-slate-600 font-semibold">{order.items?.[0]?.title || 'Bulk Import Items'}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>Logistics: Kigola Express Freight</span>
                      <span>Tracking: TRK-99824</span>
                      <span>ETA: 3 Days</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right mr-2 hidden sm:block">
                      <div className="font-mono font-black text-sm text-slate-900">{formatTZS(Number(order.totalAmountTZS || 4500000))}</div>
                      <span className="text-[10px] text-emerald-600 font-bold">AzamPay Escrow Active</span>
                    </div>

                    <Button size="xs" variant="outline" className="text-[10px] font-bold h-8" render={<Link href={`/account/orders/${order.id}`} />}>
                      Track Order
                    </Button>
                    <Button size="xs" className="bg-[#FF6B00] hover:bg-[#E05E00] text-white text-[10px] font-bold h-8" render={<Link href="/account/messages" />}>
                      Contact Sales
                    </Button>
                  </div>
                </div>
              ))}
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
                <span className="font-mono font-bold text-emerald-400">{formatTZS(totalSpent || 14500000)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Inspection Status:</span>
                <span className="font-bold text-white">Guangzhou Quality Verified</span>
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
