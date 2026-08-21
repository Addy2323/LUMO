'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Clock, AlertTriangle, CheckCircle2, Search, RefreshCw, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/format'

type DatabaseTicket = {
  id: string
  ticketNumber: string
  subject: string
  category: string
  priority: string
  status: string
  userEmail?: string
  createdAt: string
  updatedAt: string
}

export default function SalesTicketsPage() {
  const [tickets, setTickets] = useState<DatabaseTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchDatabaseTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support/tickets')
      const data = await res.json()
      if (Array.isArray(data.tickets)) {
        setTickets(data.tickets)
      } else if (Array.isArray(data)) {
        setTickets(data)
      }
    } catch (error) {
      console.error('Failed to fetch database support tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseTickets()
  }, [])

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase()
    return (
      q === '' ||
      t.subject.toLowerCase().includes(q) ||
      t.ticketNumber?.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Sales Support Tickets &amp; Queries</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Supervise customer support inquiries, dispute tickets, and buyer RFQ questions directly from PostgreSQL database.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDatabaseTickets} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" /> Support Queue ({filtered.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search ticket #, subject..."
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
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                Loading live support tickets from database...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No active support tickets found in database.</p>
                <p>New customer tickets will appear here dynamically.</p>
              </div>
            ) : (
              filtered.map((t) => (
                <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-foreground">{t.ticketNumber || `TCK-${t.id.slice(0, 8)}`}</span>
                      <Badge className={t.status === 'CLOSED' || t.status === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}>
                        {t.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {t.priority} Priority
                      </Badge>
                    </div>
                    <p className="font-bold text-foreground text-sm">{t.subject}</p>
                    <p className="text-muted-foreground text-[11px]">Submitted: {formatDate(t.createdAt)}</p>
                  </div>

                  <Button variant="outline" size="sm" render={<Link href={`/sales/tickets/${t.id}`} />} className="font-bold text-xs">
                    Inspect Ticket <ChevronRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
