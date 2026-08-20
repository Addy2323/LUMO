'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  DollarSign,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { formatTZS, formatDate } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'
import { useSupplierStore } from '@/lib/stores/supplier-store'
import { OrderConversationPanel } from '@/components/conversations/order-conversation-panel'

export function SupplierDashboard() {
  const user = useSessionStore((s) => s.user)
  const { products, orders: localOrders, settlements } = useSupplierStore()

  const [serverAssignments, setServerAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  useEffect(() => {
    fetchSupplierAssignments()
  }, [])

  async function fetchSupplierAssignments() {
    setLoading(true)
    try {
      const res = await fetch('/api/assignments')
      if (res.ok) {
        const data = await res.json()
        setServerAssignments(data.assignments || [])
      }
    } catch (err) {
      console.error('[SUPPLIER DASHBOARD] Failed to fetch server assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  // Combine local and server orders
  const displayOrders = serverAssignments.length > 0
    ? serverAssignments.map((a) => ({
        id: a.orderId,
        orderNumber: `ORD-${a.orderId.slice(-6).toUpperCase()}`,
        status: a.status === 'ACCEPTED' ? 'PROCESSING' : a.status.toLowerCase(),
        customerName: 'Verified Buyer',
        destinationRegion: 'Dar es Salaam',
        createdAt: a.createdAt,
        totalAmountTZS: 450000,
        items: [{ variantSku: 'SKU-01', quantity: 1, productTitle: a.instructions || 'Supplier Assignment Item' }],
      }))
    : localOrders

  const allVariants = products.flatMap((p) => p.variants)
  const lowStockVariants = allVariants.filter((v) => v.stock > 0 && v.stock <= v.reorderPoint)
  const outOfStockVariants = allVariants.filter((v) => v.stock === 0)

  const pendingPackOrders = displayOrders.filter((o) => ['pending', 'processing', 'offered', 'accepted'].includes(o.status.toLowerCase()))
  const inTransitOrders = displayOrders.filter((o) => ['shipped', 'in_transit'].includes(o.status.toLowerCase()))

  const unlockedPayoutTotal = settlements
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.amountTZS, 0)

  const pendingPayoutTotal = displayOrders
    .filter((o) => ['processing', 'shipped', 'accepted'].includes(o.status.toLowerCase()))
    .reduce((sum, o) => sum + (o.totalAmountTZS || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {user?.fullName || 'Supplier Operations'}
            </h1>
            <Badge className="bg-brand-500/10 text-brand-500 border border-brand-500/20 text-xs font-bold gap-1">
              <Sparkles className="size-3 text-brand-500" />
              Verified Merchant
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fulfillment pipeline, stock synchronization, and Settlement payout settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold" render={<Link href="/supplier/inventory" />}>
            <Boxes className="size-3.5 text-brand-500" />
            Inventory Stock
          </Button>
          <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white gap-1.5 text-xs font-bold shadow-sm" render={<Link href="/supplier/products/new" />}>
            <Plus className="size-3.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Business Policy Banner */}
      <div className="rounded-xl border border-info-400/30 bg-info-50/50 dark:bg-info-950/30 p-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-info-800 dark:text-info-300 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-5 shrink-0 text-info-400" />
          <span>
            <strong>Lumo Trade Settlement Rule:</strong> Payouts release automatically into your account 24h after logistics carrier delivery scanning.
          </span>
        </div>
        <Link href="/supplier/payouts" className="font-bold text-brand-500 hover:underline shrink-0 text-xs flex items-center gap-1">
          Payout Ledger →
        </Link>
      </div>

      {/* Stats Cards Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Awaiting Packing
            </CardTitle>
            <Package className="size-4 text-warning" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-warning">
              {pendingPackOrders.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Trade protected orders</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              In Transit
            </CardTitle>
            <Truck className="size-4 text-info" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">
              {inTransitOrders.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Dispatched to carrier</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Unlocked Payouts
            </CardTitle>
            <DollarSign className="size-4 text-success" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-success">
              {formatTZS(unlockedPayoutTotal)}
            </div>
            <p className="text-[11px] text-muted-foreground">Ready for bank transfer</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Stock Warnings
            </CardTitle>
            <AlertTriangle className="size-4 text-danger" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-danger">
              {lowStockVariants.length + outOfStockVariants.length}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {outOfStockVariants.length} depleted · {lowStockVariants.length} low
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Order Queue & Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Fulfillment Queue */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-extrabold">Fulfillment Order Queue</CardTitle>
                <CardDescription className="text-xs">Paid orders requiring dispatch &amp; packing slip generation</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-brand-500 font-semibold" render={<Link href="/supplier/orders" />}>
                View All Orders
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {displayOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{order.orderNumber}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Customer: {order.customerName} · Destination: {order.destinationRegion} · Placed: {formatDate(order.createdAt)}
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-xs font-medium text-foreground mt-1">
                        {order.items.map((i: any, idx: number) => (
                          <span key={idx} className="rounded-md bg-muted px-2 py-0.5 border border-border text-[11px]">
                            {i.quantity}× {i.productTitle}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                      <span className="font-extrabold text-sm tnum text-foreground">
                        {formatTZS(order.totalAmountTZS)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold"
                          onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                        >
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-xs"
                          render={<Link href={`/supplier/orders`} />}
                        >
                          Pack &amp; Dispatch
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Embedded Order Communication Panel if order selected */}
          {selectedOrderId && (
            <OrderConversationPanel
              orderId={selectedOrderId}
              allowInternalNotes={true}
            />
          )}
        </div>

        {/* Right Column: Inventory Stock Alerts & Payout Summary */}
        <div className="flex flex-col gap-6">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stock Warnings</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-brand-500 font-semibold" render={<Link href="/supplier/inventory" />}>
                Inventory
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {outOfStockVariants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{v.sku}</span>
                      <span className="text-muted-foreground text-[11px]">{v.name}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px] font-bold">
                      0 stock
                    </Badge>
                  </div>
                ))}

                {lowStockVariants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{v.sku}</span>
                      <span className="text-muted-foreground text-[11px]">{v.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-warning border-warning/40 font-bold">
                      {v.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Payout Card */}
          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Delivery Settlements</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">In-Transit Subtotal:</span>
                <span className="font-extrabold text-sm tnum text-foreground">{formatTZS(pendingPayoutTotal)}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Funds unlock into Available Payouts immediately upon carrier delivery confirmation.
              </p>
              <Button variant="secondary" size="sm" className="w-full font-bold text-xs" render={<Link href="/supplier/payouts" />}>
                View Payout History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
