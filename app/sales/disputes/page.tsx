'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/format'

type DatabaseDispute = {
  id: string
  ticketNumber: string
  subject: string
  category: string
  status: string
  createdAt: string
}

export default function SalesDisputesPage() {
  const [disputes, setDisputes] = useState<DatabaseDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support/tickets')
      const data = await res.json()
      if (Array.isArray(data.tickets)) {
        setDisputes(data.tickets.filter((t: any) => t.category?.toUpperCase() === 'DISPUTE' || t.subject?.toLowerCase().includes('dispute')))
      }
    } catch (error) {
      console.error('Failed to fetch database disputes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisputes()
  }, [])

  const filtered = disputes.filter((d) => {
    const q = search.toLowerCase()
    return q === '' || d.subject.toLowerCase().includes(q) || d.ticketNumber.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Sales Dispute Resolution Console</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Audit and mediate order disputes, refund claims, and damaged freight cases directly connected to PostgreSQL.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDisputes} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" /> Active Dispute Register ({filtered.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search dispute ref, subject..."
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
                Loading live disputes from database...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No active order disputes found in database.</p>
                <p>Order claims and dispute inquiries will log here automatically.</p>
              </div>
            ) : (
              filtered.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 text-xs">
                  <div>
                    <span className="font-mono font-extrabold text-foreground">{d.ticketNumber || `DSP-${d.id.slice(0, 8)}`}</span>
                    <p className="font-bold text-foreground">{d.subject}</p>
                    <p className="text-muted-foreground text-[11px]">Logged: {formatDate(d.createdAt)}</p>
                  </div>
                  <Badge className="bg-amber-500 text-white capitalize">{d.status}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
