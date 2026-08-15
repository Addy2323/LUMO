'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Search, RefreshCw, User, CheckCircle2, Phone, Calendar, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function CustomerFollowupsPage() {
  const [followups, setFollowups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchFollowups()
  }, [])

  async function fetchFollowups() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/overview')
      if (res.ok) {
        const data = await res.json()
        setFollowups(data.followups || [])
      }
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err)
      toast.error('Failed to load follow-ups')
    } finally {
      setLoading(false)
    }
  }

  const filtered = followups.filter(
    (f) =>
      (f.customer || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.task || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Clock className="size-6 text-[#FF6B00]" /> Customer Follow-ups Console
            </h1>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage scheduled buyer touchpoints, quote reviews, and RFQ confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search follow-ups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>
          <Button
            onClick={fetchFollowups}
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
            <RefreshCw className="size-4 animate-spin text-[#FF6B00]" /> Loading customer follow-ups from PostgreSQL...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No scheduled follow-ups</p>
            <p>Customer follow-ups will populate here automatically as sourcing requests and quotes progress.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <User className="size-3.5 text-[#FF6B00]" />
                    <span>{item.customer}</span>
                  </div>
                  <p className="text-slate-600 font-medium">{item.task}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <Calendar className="size-3 inline mr-1 text-slate-400" />
                    {item.time}
                  </span>
                  <Badge className={item.statusBg}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
