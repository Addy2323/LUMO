'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ClipboardList,
  Search,
  Eye,
  RefreshCw,
  ShieldAlert,
  CreditCard,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Globe,
  Tag,
  AlertTriangle,
  Zap,
  Filter,
  ArrowUpDown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatTZS, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { BillOfLadingModal } from '@/components/admin/orders/waybill-modal'

type DatabaseOrder = {
  id: string
  orderNumber: string
  status: string
  subtotalTZS: number
  shippingFeeTZS: number
  totalAmountTZS: number
  paymentMethod: string
  shippingAddress: any
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    unitPriceTZS: number
    product: { title: string; imageUrl: string; slug: string }
  }>
  shipments?: Array<{ trackingNumber: string; carrierName: string; status: string }>
  payments?: Array<{ provider: string; transactionRef: string; status: string }>
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DatabaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<DatabaseOrder | null>(null)
  const [waybillOrder, setWaybillOrder] = useState<DatabaseOrder | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDatabaseOrders = async () => {
    setIsRefreshing(true)
    setLoading(true)
    try {
      const res = await fetch('/api/orders?perPage=100')
      const result = await res.json()
      if (result.data) {
        setOrders(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch database orders:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDatabaseOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status.toLowerCase() !== statusFilter.toLowerCase()) return false
      if (paymentFilter !== 'all' && !o.paymentMethod.toLowerCase().includes(paymentFilter.toLowerCase())) return false

      if (!search.trim()) return true
      const q = search.toLowerCase()
      const addr = typeof o.shippingAddress === 'object' ? o.shippingAddress : {}
      const name = (addr.fullName || addr.name || '').toLowerCase()
      const phone = (addr.phone || '').toLowerCase()

      return (
        o.id.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        o.items.some((item) => item.product?.title?.toLowerCase().includes(q))
      )
    })
  }, [orders, statusFilter, paymentFilter, search])

  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, o) => acc + (o.totalAmountTZS || 0), 0)
  }, [orders])

  return (
    <div className="flex flex-col gap-6 font-sans text-foreground antialiased pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Database Administrative Orders Audit
            </h1>
            <Badge variant="outline" className="border-brand-500/40 text-brand-600 bg-brand-500/5 font-mono text-xs">
              Live PostgreSQL Database
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time platform supervision, cross-border order fulfillment tracking, and audit trails connected to live database records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDatabaseOrders}
            disabled={isRefreshing}
            className="text-xs font-semibold h-9 gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Database
          </Button>
        </div>
      </div>

      {/* Metric Cards Ribbon */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#FF6B00] bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Database Orders</p>
              <p className="text-2xl font-black tracking-tight tnum">{orders.length}</p>
            </div>
            <div className="rounded-lg bg-orange-500/10 p-2.5 text-primary">
              <ClipboardList className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Database Revenue</p>
              <p className="text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tnum">
                {formatTZS(totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600">
              <CreditCard className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Orders</p>
              <p className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 tnum">
                {orders.filter((o) => o.status === 'PENDING_PAYMENT').length}
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Processing / Shipped</p>
              <p className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400 tnum">
                {orders.filter((o) => o.status === 'PROCESSING' || o.status === 'SHIPPED').length}
              </p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600">
              <Globe className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Governance Data Table Card */}
      <Card className="border shadow-xs">
        <CardHeader className="p-4 sm:p-6 space-y-4 border-b bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search database order #, buyer name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9 bg-background border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-background px-2.5 text-xs font-bold"
              >
                <option value="all">All Database Statuses</option>
                <option value="pending_payment">PENDING_PAYMENT</option>
                <option value="processing">PROCESSING</option>
                <option value="shipped">SHIPPED</option>
                <option value="delivered">DELIVERED</option>
              </select>
            </div>
          </div>
        </CardHeader>

        {/* Data Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-100/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 min-w-[150px]">Order Number</th>
                  <th className="p-3.5 min-w-[180px]">Recipient &amp; Phone</th>
                  <th className="p-3.5 min-w-[220px]">Order Line Items</th>
                  <th className="p-3.5 min-w-[140px]">Payment Method</th>
                  <th className="p-3.5 min-w-[120px] text-right">Total (TZS)</th>
                  <th className="p-3.5 min-w-[140px] text-center">Status</th>
                  <th className="p-3.5 min-w-[100px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-xs text-muted-foreground">
                      <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Querying PostgreSQL Order table...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      No matching database orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const addr = typeof ord.shippingAddress === 'object' ? ord.shippingAddress : {}
                    const recipient = addr.fullName || addr.name || 'Valued Customer'
                    const phone = addr.phone || 'N/A'

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                        <td className="p-3.5 space-y-1">
                          <span className="font-mono font-black text-brand-600 dark:text-brand-400 text-xs">
                            {ord.orderNumber}
                          </span>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3 shrink-0" />
                            {formatDate(ord.createdAt)}
                          </p>
                        </td>

                        <td className="p-3.5 space-y-0.5">
                          <p className="font-bold text-foreground text-xs">{recipient}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="size-3 shrink-0" />
                            {phone}
                          </p>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-1.5">
                            {ord.items.slice(0, 2).map((item, idx) => {
                              let imgSrc = item.product?.imageUrl || (item as any).image || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=200&q=80'
                              if (imgSrc.startsWith('//')) {
                                imgSrc = `https:${imgSrc}`
                              }
                              return (
                                <div key={idx} className="flex items-center gap-2.5">
                                  <img
                                    src={imgSrc}
                                    alt={item.product?.title || 'Paid Product'}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=200&q=80'
                                    }}
                                    className="size-9 rounded-md border border-slate-200 object-cover shrink-0 bg-slate-100 shadow-xs"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-foreground text-[11px] truncate max-w-[180px]">
                                      {item.product?.title || (item as any).title || 'Lumo Item'}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      Qty: {item.quantity} · {formatTZS(item.unitPriceTZS || (item as any).unitPrice || 0)}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </td>

                        <td className="p-3.5 space-y-1">
                          <Badge variant="outline" className="text-[10px] font-mono font-bold">
                            {ord.paymentMethod}
                          </Badge>
                        </td>

                        <td className="p-3.5 text-right font-mono font-black text-xs text-brand-600 dark:text-brand-400">
                          {formatTZS(ord.totalAmountTZS)}
                        </td>

                        <td className="p-3.5 text-center">
                          <Badge className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {ord.status}
                          </Badge>
                        </td>

                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(ord)}
                            className="h-8 text-xs font-bold border-brand-500/30 text-primary hover:bg-orange-50"
                          >
                            <Eye className="size-3.5 mr-1" /> Audit
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Main Order Audit Modal */}
      {selectedOrder && (
        <Dialog open onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl p-6 border-border shadow-2xl">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-base font-extrabold flex items-center justify-between">
                <span>Database Order Audit: {selectedOrder.orderNumber}</span>
                <Badge className="text-xs">{selectedOrder.status}</Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-2">
              <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                <p className="font-bold text-foreground">Order ID: <span className="font-mono text-muted-foreground">{selectedOrder.id}</span></p>
                <p className="text-muted-foreground">Payment Method: <strong className="text-foreground">{selectedOrder.paymentMethod}</strong></p>
                <p className="text-muted-foreground">Subtotal: <strong className="font-mono text-foreground">{formatTZS(selectedOrder.subtotalTZS)}</strong></p>
                <p className="text-muted-foreground">Shipping Fee: <strong className="font-mono text-foreground">{formatTZS(selectedOrder.shippingFeeTZS)}</strong></p>
                <p className="text-primary font-bold text-sm">Total Amount: <span className="font-mono">{formatTZS(selectedOrder.totalAmountTZS)}</span></p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
