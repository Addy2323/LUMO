'use client'

import React, { useState, useEffect } from 'react'
import { ScrollText, Search, RefreshCw, Download, FileText, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function CustomerDocumentsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocs()
  }, [])

  async function fetchDocs() {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        const raw = Array.isArray(data) ? data : data.orders || []
        setOrders(raw)
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      toast.error('Failed to load documents')
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
              <ScrollText className="size-6 text-blue-600" /> Documents &amp; Commercial Invoices Centre
            </h1>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Download pro-forma invoices, waybills, quality inspection reports, and customs tax receipts in PDF.
          </p>
        </div>

        <Button
          onClick={fetchDocs}
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-blue-600" /> Loading document records...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No generated documents yet</p>
            <p>Invoices, waybills, and inspection certificates will be stored here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <FileText className="size-4 text-blue-600 shrink-0" />
                    <span>Commercial Invoice — Order #{item.orderNumber}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Issued: {new Date(item.createdAt).toLocaleDateString()} · Format: Official Tax PDF
                  </p>
                </div>

                <Button size="xs" variant="outline" className="text-[10px] font-bold h-7 gap-1">
                  <Download className="size-3" /> Download Invoice
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
