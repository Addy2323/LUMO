'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, Search, RefreshCw, AlertTriangle, ShieldCheck, Banknote } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function PaymentIssuesPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        const orders = Array.isArray(data) ? data : data.orders || []
        const pendingPayments = orders.filter(
          (o: any) => o.status === 'PENDING_PAYMENT' || o.status === 'FAILED'
        )
        setPayments(pendingPayments)
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err)
      toast.error('Failed to load payment issues')
    } finally {
      setLoading(false)
    }
  }

  const filtered = payments.filter(
    (p) =>
      (p.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.buyer?.name || p.buyer?.companyName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <CreditCard className="size-6 text-emerald-600" /> Payment &amp; Escrow Reconciliation Desk
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit pending AzamPay escrow deposits, failed M-Pesa push transactions, and bank wire verifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>
          <Button
            onClick={fetchPayments}
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
            <RefreshCw className="size-4 animate-spin text-emerald-600" /> Loading payment reconciliation data...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No unverified or failed payments</p>
            <p>Pending escrow transactions requiring manual reconciliation will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Banknote className="size-4 text-emerald-600 shrink-0" />
                    <span>Order #{item.orderNumber}</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      {formatTZS(Number(item.totalAmountTZS))}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Buyer: {item.buyer?.companyName || item.buyer?.name || 'Customer'} · Provider: {item.paymentMethod || 'AzamPay'}
                  </p>
                </div>

                <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200 font-bold uppercase text-[9px]">
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
