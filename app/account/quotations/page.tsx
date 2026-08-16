'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Search, RefreshCw, CheckCircle2, Download, DollarSign, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSourcingStore } from '@/lib/stores/sourcing-store'

export default function CustomerQuotationsPage() {
  const [sourcing, setSourcing] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchQuotations()
  }, [])

  async function fetchQuotations() {
    setLoading(true)
    try {
      let dbItems: any[] = []
      try {
        const res = await fetch('/api/sourcing')
        if (res.ok) {
          const data = await res.json()
          dbItems = Array.isArray(data) ? data : data.requests || []
        }
      } catch (e) {}

      const storeItems = useSourcingStore.getState().items || []
      const combined = [...dbItems]

      storeItems.forEach((st) => {
        if (!combined.some((c) => c.id === st.id || c.reference === st.reference)) {
          combined.push({
            id: st.id,
            productName: st.productName,
            status: st.status === 'quoted' ? 'Quote Ready' : st.status,
            quantity: st.quantity,
            targetPriceTZS: st.targetBudget,
            quotation: st.quotation,
          })
        }
      })

      setSourcing(combined)
    } catch (err) {
      console.error('Failed to fetch customer quotations:', err)
      toast.error('Failed to load quotations')
    } finally {
      setLoading(false)
    }
  }

  const filtered = sourcing.filter(
    (s) =>
      (s.productName || s.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.status || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="size-6 text-[#FF6B00]" /> My Sourcing Quotations &amp; Landed Cost
            </h1>
            <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review detailed landed cost breakdowns (Product cost + Inspection + Shipping + Customs + Lumo Service Fee).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search quotation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>
          <Button
            onClick={fetchQuotations}
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
            <RefreshCw className="size-4 animate-spin text-[#FF6B00]" /> Loading supplier quotations from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3">
            <p className="font-semibold text-slate-600">No active quotations awaiting customer action</p>
            <p>Request factory sourcing for custom products to receive landed quotes from sales officers.</p>
            <Button
              className="bg-[#FF6B00] hover:bg-[#E05E00] text-white text-xs font-bold"
              render={<Link href="/sourcing/request" />}
            >
              Request Product Sourcing
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Package className="size-4 text-[#FF6B00] shrink-0" />
                    <span>{item.productName || item.title || 'Sourcing Request'}</span>
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] font-bold">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Qty: {item.quantity || 1} units · Target Budget: {item.targetPriceTZS ? formatTZS(Number(item.targetPriceTZS)) : 'Market Quote'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="xs" variant="outline" className="text-[10px] font-bold h-8">
                    View Landed Cost PDF
                  </Button>
                  <Button size="xs" className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold h-8">
                    Approve &amp; Pay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
