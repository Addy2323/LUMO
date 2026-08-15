'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Search, RefreshCw, MessageSquare, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function CustomerComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchComplaints()
  }, [])

  async function fetchComplaints() {
    setLoading(true)
    try {
      const res = await fetch('/api/support/tickets')
      if (res.ok) {
        const data = await res.json()
        const raw = Array.isArray(data) ? data : data.tickets || []
        const filteredComplaints = raw.filter(
          (t: any) =>
            (t.category || '').toLowerCase() === 'complaint' ||
            (t.category || '').toLowerCase() === 'quality' ||
            (t.reason || '').toLowerCase().includes('complaint')
        )
        setComplaints(filteredComplaints)
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err)
      toast.error('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const filtered = complaints.filter(
    (c) =>
      (c.subject || c.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.buyerName || c.buyer?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <AlertTriangle className="size-6 text-rose-600" /> Customer Complaints &amp; Quality Resolution
            </h1>
            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Investigate product defects, shipping discrepancies, and service quality claims directly from buyers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>
          <Button
            onClick={fetchComplaints}
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
            <RefreshCw className="size-4 animate-spin text-rose-600" /> Loading customer complaints from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No active customer complaints</p>
            <p>Buyer complaints and quality escalation logs will appear here when submitted.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <ShieldAlert className="size-4 text-rose-600 shrink-0" />
                    <span>{item.subject || item.reason}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Buyer: {item.buyerName || item.buyer?.name || 'Customer'} · Ref: {item.ticketNumber || item.id.slice(0, 8)}
                  </p>
                </div>

                <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold uppercase text-[9px]">
                  {item.status || 'OPEN'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
