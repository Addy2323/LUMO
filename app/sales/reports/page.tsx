'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, Search, RefreshCw, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function SalesReportsPage() {
  const [salesValue, setSalesValue] = useState<number>(0)
  const [ordersCount, setOrdersCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/overview')
      if (res.ok) {
        const data = await res.json()
        setSalesValue(data.kpis?.salesValueTzs || 0)
        setOrdersCount(data.kpis?.myAssignedCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch sales reports:', err)
      toast.error('Failed to load sales reports')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-surface-secondary min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <TrendingUp className="size-6 text-primary" /> Sales Reports &amp; Revenue Analytics
            </h1>
            <Badge className="bg-orange-50 text-primary border-orange-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            B2B GMV revenue, category performance breakdown, and sourcing conversion analytics.
          </p>
        </div>

        <Button
          onClick={fetchReports}
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 bg-slate-900 text-white rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Confirmed GMV Sales</span>
          <div className="text-3xl font-black text-primary font-mono">
            {formatTZS(salesValue)}
          </div>
          <p className="text-xs text-slate-400">Total gross merchandise value from paid customer orders</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Fulfilled Orders</span>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {ordersCount} Orders
          </div>
          <p className="text-xs text-slate-500">Paid and completed customer B2B orders</p>
        </Card>
      </div>
    </div>
  )
}
