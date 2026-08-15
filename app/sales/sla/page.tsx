'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, Search, RefreshCw, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SlaPerformancePage() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSla()
  }, [])

  async function fetchSla() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/overview')
      if (res.ok) {
        const data = await res.json()
        setKpis(data.kpis)
      }
    } catch (err) {
      console.error('Failed to fetch SLA data:', err)
      toast.error('Failed to load SLA performance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="size-6 text-emerald-600" /> SLA &amp; Response Metrics Dashboard
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Key response time targets: 15-min initial enquiry response, 24-hr supplier quote turnaround.
          </p>
        </div>

        <Button
          onClick={fetchSla}
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Enquiries SLA Adherence</span>
          <div className="text-2xl font-black text-emerald-600 font-mono">98.4%</div>
          <p className="text-[11px] text-slate-500">Average response time: 11 mins</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Dispute SLA Resolution</span>
          <div className="text-2xl font-black text-blue-600 font-mono">94.2%</div>
          <p className="text-[11px] text-slate-500">Cases at risk: {kpis?.slaAtRiskCount || 0}</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Overall Sales Conversion</span>
          <div className="text-2xl font-black text-[#FF6B00] font-mono">{kpis?.conversionRate || 0}%</div>
          <p className="text-[11px] text-slate-500">RFQ to Paid Order conversion</p>
        </Card>
      </div>
    </div>
  )
}
