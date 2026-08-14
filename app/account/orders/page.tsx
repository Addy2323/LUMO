'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Search, Clock, CheckCircle2, Truck, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS, formatDate } from '@/lib/format'

type DatabaseOrder = {
  id: string
  orderNumber: string
  status: string
  totalAmountTZS: number
  createdAt: string
  items?: any[]
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<DatabaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchCustomerOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      if (Array.isArray(data.data)) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch customer orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomerOrders()
  }, [])

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    return q === '' || o.orderNumber.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Database Orders</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track your live B2B wholesale orders, status updates, and digital invoices.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCustomerOrders} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Orders
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Package className="size-5 text-[#FF6B00]" /> Order History ({filtered.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search order #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y border-t">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                Loading your database orders...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">No orders found in database.</p>
                <p>Your B2B purchases will appear here upon checkout.</p>
                <Button size="sm" render={<Link href="/marketplace" />} className="bg-[#FF6B00] text-white font-bold text-xs mt-2">
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              filtered.map((o) => (
                <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-foreground">ORDER #{o.orderNumber}</span>
                      <Badge className={o.status === 'DELIVERED' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}>
                        {o.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px]">Placed on {formatDate(o.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-extrabold text-[#FF6B00] text-sm">{formatTZS(o.totalAmountTZS)}</span>
                    <Button variant="outline" size="sm" render={<Link href={`/account/orders/${o.id}`} />} className="font-bold text-xs">
                      View Detail <ArrowRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
