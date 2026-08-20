'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Banknote, ShieldCheck, Lock, Unlock, Download, RefreshCw, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS, formatDate } from '@/lib/format'
import { toast } from 'sonner'

type ProtectedTransaction = {
  id: string
  reference: string
  payer: string
  payee: string
  amountTZS: number
  gateway: string
  protectionState: string
  date: string
}

export default function AdminPaymentsPage() {
  const [txns, setTxns] = useState<ProtectedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchDatabasePayments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders?perPage=100')
      const result = await res.json()

      if (result.data) {
        const parsedTxns: ProtectedTransaction[] = []

        result.data.forEach((order: any) => {
          const addr = typeof order.shippingAddress === 'object' ? order.shippingAddress : {}
          const payerName = addr.fullName || addr.name || 'Lumo Buyer'
          const ref = order.payments?.[0]?.transactionRef || `AZM-${order.orderNumber}`
          const gateway = order.payments?.[0]?.provider || order.paymentMethod || 'LUMO Pay'

          parsedTxns.push({
            id: order.id,
            reference: ref,
            payer: payerName,
            payee: 'Lumo Certified Merchant Hub',
            amountTZS: order.totalAmountTZS,
            gateway: gateway,
            protectionState: order.status === 'DELIVERED' ? 'Released to Supplier' : 'Held in Trade Protection',
            date: formatDate(order.createdAt),
          })
        })

        setTxns(parsedTxns)
      }
    } catch (error) {
      console.error('Failed to fetch database payments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabasePayments()
  }, [])

  const filtered = txns.filter((t) => {
    const q = search.toLowerCase()
    return (
      q === '' ||
      t.reference.toLowerCase().includes(q) ||
      t.payer.toLowerCase().includes(q) ||
      t.payee.toLowerCase().includes(q)
    )
  })

  function handleReleasePayment(id: string) {
    setTxns(
      txns.map((t) => (t.id === id ? { ...t, protectionState: 'Released to Supplier' } : t)),
    )
    toast.success('Admin Manual Trade Protection Release Executed!')
  }

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Master Secure Payments &amp; Audits</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Supervise platform mobile money &amp; card transactions, payment protection holds, and payout releases directly connected to PostgreSQL.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDatabasePayments} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              Protected Transaction Ledger ({filtered.length})
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search ref #, payer, or payee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="divide-y border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                Loading live payment protection ledgers from database...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No payment protection payment records found in database.</p>
                <p>Checkout payments will record in this payment vault ledger automatically.</p>
              </div>
            ) : (
              filtered.map((t) => (
                <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card hover:bg-muted/20 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-foreground">{t.reference}</span>
                      <Badge className={t.protectionState === 'Released to Supplier' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}>
                        {t.protectionState}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">Payer: <strong className="text-foreground">{t.payer}</strong> → Payee: <strong className="text-foreground">{t.payee}</strong></p>
                    <p className="text-muted-foreground">Gateway: <strong className="text-foreground">{t.gateway}</strong> · {t.date}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="font-mono font-extrabold text-primary text-sm">{formatTZS(t.amountTZS)}</span>

                    {t.protectionState !== 'Released to Supplier' && (
                      <Button size="sm" onClick={() => handleReleasePayment(t.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs">
                        <Unlock className="size-3.5 mr-1" />
                        Force Release
                      </Button>
                    )}
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
