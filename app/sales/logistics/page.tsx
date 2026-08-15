'use client'

import React, { useState, useEffect } from 'react'
import { Truck, Search, RefreshCw, MapPin, Package, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LogisticsCoordinationPage() {
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogistics()
  }, [])

  async function fetchLogistics() {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        const orders = Array.isArray(data) ? data : data.orders || []
        const inTransit = orders.filter(
          (o: any) =>
            o.status === 'PROCESSING' ||
            o.status === 'SHIPPED' ||
            o.status === 'IN_TRANSIT'
        )
        setShipments(inTransit)
      }
    } catch (err) {
      console.error('Failed to fetch shipments:', err)
      toast.error('Failed to load logistics coordination data')
    } finally {
      setLoading(false)
    }
  }

  const filtered = shipments.filter(
    (s) =>
      (s.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.buyer?.name || s.buyer?.companyName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Truck className="size-6 text-cyan-600" /> Logistics &amp; Cargo Freight Coordination
            </h1>
            <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track maritime containers, air cargo waybills, and Dar Port customs clearance for active customer orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search shipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>
          <Button
            onClick={fetchLogistics}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-cyan-600" /> Loading cargo logistics from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No active cargo in transit</p>
            <p>Order shipments in transit from China to Tanzania will be tracked here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Package className="size-4 text-cyan-600 shrink-0" />
                    <span>Order #{item.orderNumber}</span>
                    <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[9px] font-bold">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Buyer: {item.buyer?.companyName || item.buyer?.name || 'Customer'} · Destination: Dar es Salaam Port
                  </p>
                </div>

                <Badge className="bg-slate-100 text-slate-700 font-mono text-[10px]">
                  Ref: ORD-{item.orderNumber}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
