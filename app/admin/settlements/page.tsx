'use client'

import { useState, useEffect } from 'react'
import { Banknote, CheckCircle2, Clock, Download, FileText, Search, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS, formatDate } from '@/lib/format'
import { toast } from 'sonner'

type SettlementRecord = {
  id: string
  orderNumber: string
  supplierName: string
  grossAmountTZS: number
  platformFeeTZS: number
  netPayoutTZS: number
  status: 'SETTLED' | 'PENDING_PAYOUT' | 'HELD_IN_PROTECTION'
  settledAt?: string
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchDatabaseSettlements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders?perPage=100')
      const data = await res.json()
      if (data.data) {
        const records: SettlementRecord[] = data.data.map((order: any) => {
          const gross = order.totalAmountTZS || 0
          const fee = Math.round(gross * 0.05) // 5% platform commission
          const net = gross - fee
          const isSettled = order.status === 'DELIVERED'

          return {
            id: order.id,
            orderNumber: order.orderNumber,
            supplierName: 'Lumo Certified Merchant',
            grossAmountTZS: gross,
            platformFeeTZS: fee,
            netPayoutTZS: net,
            status: isSettled ? 'SETTLED' : order.status === 'SHIPPED' ? 'PENDING_PAYOUT' : 'HELD_IN_PROTECTION',
            settledAt: isSettled ? formatDate(order.updatedAt || order.createdAt) : undefined,
          }
        })
        setSettlements(records)
      }
    } catch (error) {
      console.error('Failed to fetch database settlements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseSettlements()
  }, [])

  const filtered = settlements.filter((s) => {
    const q = search.toLowerCase()
    return (
      q === '' ||
      s.orderNumber.toLowerCase().includes(q) ||
      s.supplierName.toLowerCase().includes(q)
    )
  })

  const totalGross = settlements.reduce((acc, s) => acc + s.grossAmountTZS, 0)
  const totalFees = settlements.reduce((acc, s) => acc + s.platformFeeTZS, 0)
  const totalNet = settlements.reduce((acc, s) => acc + s.netPayoutTZS, 0)

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Admin Supplier Settlements &amp; Payouts</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Supervise gross transaction volumes, platform 5% commissions, and net supplier payouts calculated directly from PostgreSQL orders.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDatabaseSettlements} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium">Gross Platform Volume</span>
          <h3 className="text-2xl font-mono font-extrabold text-foreground mt-1">{formatTZS(totalGross)}</h3>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium">Platform Commissions (5%)</span>
          <h3 className="text-2xl font-mono font-extrabold text-emerald-600 mt-1">{formatTZS(totalFees)}</h3>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium">Net Payable to Merchants</span>
          <h3 className="text-2xl font-mono font-extrabold text-[#FF6B00] mt-1">{formatTZS(totalNet)}</h3>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold">Settlement Register ({filtered.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search order #, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-t">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                Loading live settlement ledgers from database...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No order settlement ledgers found in database.
              </div>
            ) : (
              filtered.map((s) => (
                <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-foreground">ORDER #{s.orderNumber}</span>
                      <Badge className={s.status === 'SETTLED' ? 'bg-emerald-600 text-white' : s.status === 'PENDING_PAYOUT' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'}>
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">Supplier: <strong className="text-foreground">{s.supplierName}</strong></p>
                  </div>

                  <div className="flex items-center gap-6 font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Gross</span>
                      <strong className="text-foreground">{formatTZS(s.grossAmountTZS)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Platform Fee</span>
                      <strong className="text-emerald-600">{formatTZS(s.platformFeeTZS)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Net Payout</span>
                      <strong className="text-[#FF6B00] text-sm font-extrabold">{formatTZS(s.netPayoutTZS)}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
