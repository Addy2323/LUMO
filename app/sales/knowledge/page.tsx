'use client'

import React, { useState } from 'react'
import { ScrollText, Search, BookOpen, FileText, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState('')

  const SOPs = [
    { title: 'Standard Operating Procedure: B2B RFQ Verification', category: 'Sourcing' },
    { title: 'TRA Customs Duty & Import Tax Tariff Reference Guide', category: 'Customs' },
    { title: 'AzamPay Escrow Release & Refund Standard', category: 'Payments' },
    { title: 'Field Agent Physical Inspection Checklist (Guangzhou & Yiwu)', category: 'Inspections' },
    { title: 'Dispute Handling & Freight Damage Resolution Protocol', category: 'Disputes' },
  ]

  const filtered = SOPs.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <ScrollText className="size-6 text-teal-600" /> B2B Sourcing Knowledge Base &amp; SOPs
            </h1>
            <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-bold">
              Official SOP Manual
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal procedures, TRA tax guides, and sourcing agent field checklists for sales desk officers.
          </p>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search SOP manual..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-slate-50 border-slate-200 text-xs h-9"
          />
        </div>
      </div>

      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
        <div className="divide-y divide-slate-100">
          {filtered.map((item, i) => (
            <div key={i} className="py-3 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 p-2 rounded transition">
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <BookOpen className="size-4 text-teal-600 shrink-0" />
                <span>{item.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px]">
                  {item.category}
                </Badge>
                <ChevronRight className="size-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
