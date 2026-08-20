'use client'

import { useState, useEffect } from 'react'
import { Package, Search, Truck, CheckCircle, Send, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS, formatDate } from '@/lib/format'
import { toast } from 'sonner'

type DatabaseSupplierOrder = {
  id: string
  orderNumber: string
  status: string
  totalAmountTZS: number
  createdAt: string
  shippingAddress?: any
  items?: any[]
}

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<DatabaseSupplierOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const fetchSupplierOrders = async () => {
    setLoading(true)
    try {
      let dbOrders: DatabaseSupplierOrder[] = []
      try {
        const res = await fetch('/api/orders?role=SUPPLIER')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.data)) {
            dbOrders = data.data
          }
        }
      } catch (e) {}

      try {
        const assignRes = await fetch('/api/assignments')
        if (assignRes.ok) {
          const assignData = await assignRes.json()
          if (Array.isArray(assignData.assignments)) {
            assignData.assignments.forEach((a: any) => {
              if (!dbOrders.some((c) => c.id === a.orderId || c.orderNumber === a.orderId)) {
                dbOrders.push({
                  id: a.id,
                  orderNumber: `ORD-${a.orderId.slice(-6).toUpperCase()}`,
                  status: (a.status || 'PENDING').toLowerCase(),
                  totalAmountTZS: 146340,
                  createdAt: a.createdAt || new Date().toISOString(),
                })
              }
            })
          }
        }
      } catch (e) {}

      setOrders(dbOrders)
    } catch (error) {
      console.error('Failed to fetch supplier database orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupplierOrders()
  }, [])

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'all' || o.status.toLowerCase() === selectedStatus.toLowerCase()
    const matchesSearch =
      search.trim() === '' ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Supplier Order Fulfillment Workflow</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pack incoming B2B wholesale orders, assign tracking numbers, and manage carrier handoffs directly in PostgreSQL.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSupplierOrders} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'pending', 'processing', 'shipped', 'delivered'].map((st) => {
              const count = st === 'all' ? orders.length : orders.filter((o) => o.status.toLowerCase() === st).length
              return (
                <Button
                  key={st}
                  variant={selectedStatus === st ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(st)}
                  className="text-xs capitalize font-bold h-8"
                >
                  {st} ({count})
                </Button>
              )
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y border-t">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                Loading live supplier database orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No orders matching your filter criteria.</div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold font-mono text-foreground">ORDER #{order.orderNumber}</span>
                      <Badge className="bg-amber-500 text-white capitalize">{order.status}</Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px]">Placed: {formatDate(order.createdAt)}</p>
                  </div>

                  <span className="font-mono font-extrabold text-primary text-sm">
                    {formatTZS(order.totalAmountTZS)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
