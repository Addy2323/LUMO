'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAgentStore } from '@/lib/stores/agent-store'

type DatabaseAgentOrder = {
  id: string
  orderNumber: string
  status: string
  totalAmountTZS: number
  createdAt: string
  productName?: string
  customerName?: string
}

export default function AgentOrdersPage() {
  const [orders, setOrders] = useState<DatabaseAgentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAgentOrders = async () => {
    setLoading(true)
    try {
      let dbOrders: DatabaseAgentOrder[] = []
      try {
        const res = await fetch('/api/orders')
        const data = await res.json()
        if (Array.isArray(data.data)) {
          dbOrders = data.data
        }
      } catch (e) {}

      const storeOrders = useAgentStore.getState().orders || []
      const combined = [...dbOrders]

      storeOrders.forEach((so) => {
        if (!combined.some((c) => c.id === so.id || c.orderNumber === so.orderNumber)) {
          combined.push({
            id: so.id,
            orderNumber: so.orderNumber,
            status: so.status.replace(/_/g, ' '),
            totalAmountTZS: Math.round(so.targetBudgetUSD * 2600),
            createdAt: so.createdAt,
            productName: so.productName,
            customerName: so.customerName,
          })
        }
      })

      setOrders(combined)
    } catch (error) {
      console.error('Failed to fetch agent database orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentOrders()
  }, [])

  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 font-sans antialiased">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Database Assigned Field Orders</h1>
          <p className="text-xs text-slate-400 font-mono">
            Sourcing Hub · Live orders fetched directly from PostgreSQL HQ database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAgentOrders} className="text-xs font-bold gap-1.5 h-9 bg-slate-900 border-slate-800 text-slate-200">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <div className="relative w-full sm:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order #..."
              className="pl-9 h-9 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                Loading field orders from database...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No field orders found in database.</div>
            ) : (
              filteredOrders.map((ord) => (
                <div key={ord.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors text-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-orange-400">ORDER #{ord.orderNumber}</span>
                        <Badge className="bg-slate-800 text-slate-200 capitalize text-[10px]">{ord.status}</Badge>
                      </div>
                      <p className="text-slate-400 text-[11px]">Database Record ID: {ord.id}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        render={
                          <Link href="/agent/suppliers">
                            <Building2 className="size-3.5 mr-1.5" />
                            Find Supplier
                          </Link>
                        }
                        className="bg-[#FF6B00] hover:bg-[#E05E00] text-white text-xs font-bold"
                      />

                      <Button
                        render={
                          <Link href="/agent/inspection">
                            <ShieldCheck className="size-3.5 mr-1.5 text-orange-400" />
                            Inspect Cargo
                          </Link>
                        }
                        variant="outline"
                        className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold"
                      />
                    </div>
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
