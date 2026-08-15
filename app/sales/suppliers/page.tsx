'use client'

import React, { useState, useEffect } from 'react'
import { Store, Search, RefreshCw, Building2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SupplierLiaisonPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSuppliers()
  }, [])

  async function fetchSuppliers() {
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        const raw = Array.isArray(data) ? data : data.suppliers || []
        setSuppliers(raw)
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
      toast.error('Failed to load supplier directory')
    } finally {
      setLoading(false)
    }
  }

  const filtered = suppliers.filter(
    (s) =>
      (s.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.country || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Store className="size-6 text-purple-600" /> Supplier Liaison Workspace
            </h1>
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified B2B factory catalog suppliers, direct liaison contacts, and rating audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>
          <Button
            onClick={fetchSuppliers}
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
            <RefreshCw className="size-4 animate-spin text-purple-600" /> Loading supplier profiles from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No active supplier partners</p>
            <p>Verified supplier accounts will be listed here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Building2 className="size-4 text-purple-600 shrink-0" />
                    <span>{item.companyName}</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">
                      {item.verified ? 'Verified Supplier' : 'Pending Verification'}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Country: {item.country || 'China'} · Hub: {item.hubLocation || 'Guangzhou Hub'} · Rating: ⭐ {item.rating || 4.8}
                  </p>
                </div>

                <Button size="xs" variant="outline" className="text-[10px] font-bold h-7">
                  Contact Supplier
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
