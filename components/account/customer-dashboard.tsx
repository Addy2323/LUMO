'use client'

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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useState, useEffect } from 'react'
import { StatusBadge } from '@/components/status-badge'
import { getOrdersForUser, ADDRESSES, Order } from '@/lib/mock/orders'
import { TICKETS } from '@/lib/mock/support'
import { formatTZS, formatDate } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'

export function CustomerDashboard() {
  const user = useSessionStore((s) => s.user)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])

  useEffect(() => {
    function load() {
      setCustomerOrders(getOrdersForUser(user))
    }
    load()
    window.addEventListener('lumo_orders_updated', load)
    return () => window.removeEventListener('lumo_orders_updated', load)
  }, [user])

  const pendingDeliveries = customerOrders.filter((o) =>
    ['processing', 'shipped', 'paid'].includes(o.status),
  )

  const completedOrders = customerOrders.filter((o) => o.status === 'delivered')
  const totalSpent = customerOrders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.total, 0)

  const activeTickets = TICKETS.filter(
    (t) => (t.status as string) !== 'closed' && t.status !== 'resolved' && t.customer.name === (user?.fullName ?? 'Amina Hassan'),
  )

  // Profile completion calculation
  const profileSteps = [
    { label: 'Account registered', done: true },
    { label: 'Phone number verified (+255)', done: true },
    { label: 'Default delivery address added', done: ADDRESSES.length > 0 },
    { label: 'Preferred AzamPay payment method set', done: true },
  ]
  const completedCount = profileSteps.filter((s) => s.done).length
  const profilePercent = Math.round((completedCount / profileSteps.length) * 100)

  return (
    <div className="flex flex-col gap-8 antialiased">
      {/* Welcome Header & Profile Progress */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Jambo, {user?.fullName ?? 'Amina Hassan'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your orders, deliveries, addresses, and Sales Department support tickets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-xs"
            render={<Link href="/marketplace" />}
          >
            <ShoppingBag data-icon="inline-start" />
            Browse Marketplace
          </Button>
        </div>
      </div>

      {/* Profile Completion Banner */}
      <Card className="border-primary-500/30 bg-gradient-to-r from-primary-50/50 via-card to-card dark:from-primary-950/20 dark:via-card dark:to-card shadow-xs">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5 sm:max-w-md">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-primary-500" />
              <span className="font-bold text-sm">Account Verification &amp; Profile Status</span>
              <Badge className="bg-primary-600 text-white text-xs font-bold tnum">
                {profilePercent}% Complete
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your profile is verified for fast 1-click checkout with AzamPay mobile wallets.
            </p>
            <Progress value={profilePercent} className="mt-1 h-2 bg-primary-100 dark:bg-primary-950" />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {profileSteps.map((step) => (
              <span
                key={step.label}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                  step.done
                    ? 'bg-success-50 text-success-800 dark:bg-success-950/60 dark:text-success-400 border border-success-500/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                ✓ {step.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tnum">{customerOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {completedOrders.length} delivered successfully
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pending Deliveries
            </CardTitle>
            <Truck className="size-4 text-info-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tnum text-info-600 dark:text-info-400">
              {pendingDeliveries.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Active shipments in transit</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary-600 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Spent
            </CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tnum text-primary-600 dark:text-primary-400">
              {formatTZS(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">All orders via AzamPay</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Support Tickets
            </CardTitle>
            <Headphones className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tnum">{activeTickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Active with Sales Desk</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Orders & Quick Navigation */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Orders */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-base font-bold">Recent Orders</CardTitle>
                <CardDescription>Your latest purchases and live tracking status</CardDescription>
              </div>
              <Button variant="outline" size="sm" render={<Link href="/account/orders" />}>
                View All Orders
                <ArrowRight data-icon="inline-end" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {customerOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        <Image
                          src={order.items[0]?.image ?? '/images/products/phone-case-armour.png'}
                          alt={order.items[0]?.title ?? 'Order item'}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{order.reference}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {order.items.map((i) => i.title).join(', ')}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Placed {formatDate(order.placedAt)} · {order.logistics?.name ?? 'Logistics Courier'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                      <span className="font-extrabold text-base text-foreground tnum">
                        {formatTZS(order.total)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-medium"
                        render={<Link href={`/account/orders/${order.id}`} />}
                      >
                        Track Order
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Links & Address Preview */}
        <div className="flex flex-col gap-6">
          <Card className="shadow-xs">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-bold">Account Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-3">
              <Link
                href="/account/orders"
                className="flex items-center gap-3 rounded-lg p-2.5 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-colors"
              >
                <Package className="size-4 text-primary-500" />
                <span>My Orders &amp; Tracking</span>
              </Link>

              <Link
                href="/account/support"
                className="flex items-center gap-3 rounded-lg p-2.5 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-colors"
              >
                <Headphones className="size-4 text-primary-500" />
                <span>Sales Department Support</span>
              </Link>

              <Link
                href="/account/addresses"
                className="flex items-center gap-3 rounded-lg p-2.5 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-colors"
              >
                <MapPin className="size-4 text-primary-500" />
                <span>Saved Addresses</span>
              </Link>

              <Link
                href="/account/returns"
                className="flex items-center gap-3 rounded-lg p-2.5 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-colors"
              >
                <RotateCcw className="size-4 text-primary-500" />
                <span>Returns &amp; Refunds</span>
              </Link>
            </CardContent>
          </Card>

          {/* Default Address Preview */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-sm font-bold">Default Delivery Address</CardTitle>
              <Button variant="ghost" size="sm" render={<Link href="/account/addresses" />}>
                Edit
              </Button>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex flex-col gap-1 pt-3">
              <span className="font-bold text-foreground text-sm">{ADDRESSES[0].recipient}</span>
              <span>{ADDRESSES[0].street}</span>
              <span>
                {ADDRESSES[0].ward}, {ADDRESSES[0].district}, {ADDRESSES[0].region}
              </span>
              <span className="font-mono mt-1 text-foreground">Phone: {ADDRESSES[0].phone}</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
