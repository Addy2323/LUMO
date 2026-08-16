'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Barcode,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { ORDERS } from '@/lib/mock/orders'
import { formatDate } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'

export function LogisticsDashboard() {
  const user = useSessionStore((s) => s.user)
  const carrierName = user?.fullName || 'Baraka Freight Ltd'

  const [serverAssignments, setServerAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogisticsAssignments()
  }, [])

  async function fetchLogisticsAssignments() {
    setLoading(true)
    try {
      const res = await fetch('/api/assignments')
      if (res.ok) {
        const data = await res.json()
        setServerAssignments(data.assignments || [])
      }
    } catch (err) {
      console.error('[LOGISTICS DASHBOARD] Failed to fetch server assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  const mockCarrierOrders = ORDERS.filter((o) => o.logistics?.name === 'Baraka Freight Ltd')

  const displayOrders = serverAssignments.length > 0
    ? serverAssignments.map((a) => ({
        id: a.orderId,
        reference: `ORD-${a.orderId.slice(-6).toUpperCase()}`,
        status: a.status === 'ACCEPTED' ? 'shipped' : a.status.toLowerCase(),
        trackingNumber: `TRK-${a.id.slice(-6).toUpperCase()}`,
        placedAt: a.createdAt,
        supplier: { name: 'Verified Supplier' },
        shippingAddress: {
          recipient: 'Customer',
          ward: 'Kijitonyama',
          region: 'Dar es Salaam',
        },
      }))
    : mockCarrierOrders

  const awaitingPickup = displayOrders.filter((o) => o.status === 'processing' || o.status === 'offered')
  const inTransit = displayOrders.filter((o) => o.status === 'shipped' || o.status === 'accepted')
  const deliveredToday = displayOrders.filter((o) => o.status === 'delivered' || o.status === 'completed')

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">{carrierName}</h1>
            <Badge className="bg-brand-500/10 text-brand-500 border border-brand-500/20 text-xs font-bold gap-1">
              <Sparkles className="size-3 text-brand-500" />
              Lumo Carrier Partner · Dar / Arusha Zone
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Warehouse pickup queue, Air &amp; Sea container tracking, and delivery barcode scanning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs gap-1.5 shadow-sm" render={<Link href="/logistics/shipments" />}>
            <Barcode className="size-3.5" />
            Scan Delivery Barcode
          </Button>
        </div>
      </div>

      {/* Operational Policy Banner */}
      <div className="rounded-xl border border-info-400/30 bg-info-50/50 dark:bg-info-950/30 p-3.5 flex items-center gap-2.5 text-xs text-info-800 dark:text-info-300 shadow-xs">
        <ShieldCheck className="size-5 shrink-0 text-info-400" />
        <span>
          <strong>Critical Delivery Payout Rule:</strong> Scanning final customer delivery immediately marks the order as <code>delivered</code> and automatically unlocks the merchant supplier&apos;s payout subtotal in TZS.
        </span>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Warehouse Pickups
            </CardTitle>
            <Truck className="size-4 text-warning" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-warning">
              {awaitingPickup.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Ready at supplier facility</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              In Transit Packages
            </CardTitle>
            <Truck className="size-4 text-info" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">{inTransit.length}</div>
            <p className="text-[11px] text-muted-foreground">On courier delivery route</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Delivered Today
            </CardTitle>
            <CheckCircle2 className="size-4 text-success" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-success">
              {deliveredToday.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Payouts unlocked instantly</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              On-Time SLA Rate
            </CardTitle>
            <Clock className="size-4 text-success" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-success">98.4%</div>
            <p className="text-[11px] text-muted-foreground">Target: &gt;95.0%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Active Courier Dispatch Queue */}
      <Card className="border-border/80">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-extrabold">Active Freight &amp; Courier Shipments</CardTitle>
            <CardDescription className="text-xs">Order packages assigned to Baraka Freight for dispatch &amp; delivery scanning</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-brand-500 font-semibold" render={<Link href="/logistics/shipments" />}>
            All Shipments
            <ArrowRight className="size-3.5 ml-1" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {displayOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{order.reference}</span>
                    <StatusBadge status={order.status} />
                    <Badge variant="outline" className="text-[10px] font-mono font-semibold">
                      Tracking: {order.trackingNumber ?? 'TRK-PENDING'}
                    </Badge>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    From: <strong className="text-foreground">{order.supplier?.name}</strong> → To:{' '}
                    <strong className="text-foreground">{order.shippingAddress?.recipient}</strong> ({order.shippingAddress?.ward},{' '}
                    {order.shippingAddress?.region})
                  </span>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground tnum">
                    Updated: {formatDate(order.placedAt)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-semibold text-xs"
                    render={<Link href={`/logistics/shipments/${order.id}`} />}
                  >
                    Scan &amp; Update
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
