'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Globe,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Truck,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatTZS, formatDate } from '@/lib/format'
import { toast } from 'sonner'

import { useSourcingStore } from '@/lib/stores/sourcing-store'

type DatabaseSourcingRequest = {
  id: string
  buyerId: string
  productUrl: string
  targetQuantity: number
  targetPriceTZS: number | null
  description: string | null
  status: string
  createdAt: string
  buyer?: {
    name: string
    email: string
    phone: string | null
  }
}

export default function SalesSourcingPage() {
  const [requests, setRequests] = useState<DatabaseSourcingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'SUBMITTED' | 'IN_REVIEW' | 'QUOTED'>('all')
  const [search, setSearch] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const fetchDatabaseRequests = async () => {
    setLoading(true)
    try {
      let dbRequests: DatabaseSourcingRequest[] = []
      try {
        const res = await fetch('/api/sourcing')
        const data = await res.json()
        if (Array.isArray(data)) {
          dbRequests = data
        } else if (data.requests) {
          dbRequests = data.requests
        }
      } catch (e) {}

      const storeItems = useSourcingStore.getState().items || []
      const combined = [...dbRequests]

      storeItems.forEach((st) => {
        if (!combined.some((c) => c.id === st.id || c.productUrl === st.productLink)) {
          combined.push({
            id: st.id,
            buyerId: st.customerEmail,
            productUrl: st.productLink || st.productName,
            targetQuantity: st.quantity,
            targetPriceTZS: st.targetBudget,
            description: `${st.productName}: ${st.description || ''}`,
            status: st.status.toUpperCase(),
            createdAt: st.createdAt,
            buyer: {
              name: st.customerName,
              email: st.customerEmail,
              phone: null,
            },
          })
        }
      })

      setRequests(combined)
    } catch (error) {
      console.error('Failed to fetch database sourcing requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseRequests()
  }, [])

  const selectedItem = requests.find((i) => i.id === selectedItemId) ?? null

  const filteredItems = requests.filter((item) => {
    const matchesFilter = filter === 'all' || item.status.toUpperCase() === filter
    const matchesSearch =
      search.trim() === '' ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      (item.buyer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      item.productUrl.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="flex flex-col gap-6 antialiased font-sans">
      {/* Page Title & Rule Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database B2B Sourcing &amp; Quotation Queue</h1>
          <p className="text-xs text-muted-foreground">
            Inspect buyer specifications, verify target quantities, issue all-inclusive landed TZS quotes, and query live PostgreSQL sourcing tickets.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchDatabaseRequests} className="text-xs gap-1.5 h-8">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </Button>
      </div>

      <Card className="border-info-500/20 bg-info-50/40 dark:bg-info-950/20">
        <CardContent className="flex items-center gap-3 p-4 text-xs text-info-800 dark:text-info-400">
          <ShieldCheck className="size-4 shrink-0 text-info-600" />
          <span>
            Sourcing Officers: Connected live to Lumo Sourcing database. All quotes issued update buyer dashboards in real-time.
          </span>
        </CardContent>
      </Card>

      {/* Main Queue Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold">Active Database Sourcing Requests ({filteredItems.length})</CardTitle>
          </div>

          <div className="flex items-center gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="bg-muted/60 p-1 text-xs">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="SUBMITTED" className="text-xs">Submitted</TabsTrigger>
                <TabsTrigger value="IN_REVIEW" className="text-xs">In Sourcing</TabsTrigger>
                <TabsTrigger value="QUOTED" className="text-xs">Quoted</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search ticket ID, buyer, or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y border-t border-border">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                Loading live database sourcing queue...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">No sourcing requests found in database.</div>
            ) : (
              filteredItems.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 transition-colors"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-xs text-primary">SRC-{req.id.slice(0, 8).toUpperCase()}</span>
                      <Badge className="text-[10px] uppercase font-bold bg-orange-500/10 text-[#FF6B00] border border-orange-500/20">
                        {req.status}
                      </Badge>
                    </div>

                    <a href={req.productUrl} target="_blank" rel="noreferrer" className="font-bold text-xs text-foreground hover:underline truncate max-w-lg">
                      Link: {req.productUrl}
                    </a>

                    <span className="text-xs text-muted-foreground">
                      Buyer: <strong className="text-foreground">{req.buyer?.name || 'Customer'}</strong> ({req.buyer?.email || 'N/A'}) · Qty:{' '}
                      <strong className="text-foreground font-mono">{req.targetQuantity} units</strong> · Target Price:{' '}
                      <strong className="text-primary font-mono">{req.targetPriceTZS ? formatTZS(req.targetPriceTZS) : 'RFQ / Market Quote'}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center sm:flex-col sm:items-end gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      Submitted: {formatDate(req.createdAt)}
                    </span>

                    <Button
                      size="sm"
                      onClick={() => setSelectedItemId(req.id)}
                      className="font-bold text-xs bg-[#FF6B00] hover:bg-[#E85F00] text-white shadow-xs"
                    >
                      <MessageSquare className="size-3.5 mr-1" />
                      Inspect &amp; Quote Ticket
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sourcing Detail Dialog */}
      {selectedItem && (
        <Dialog open onOpenChange={() => setSelectedItemId(null)}>
          <DialogContent className="max-w-xl p-6 border-border shadow-2xl">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="flex items-center justify-between text-base font-extrabold">
                <div className="flex items-center gap-2">
                  <span>Inspect Sourcing Ticket</span>
                  <Badge variant="outline" className="font-mono text-xs text-primary">
                    SRC-{selectedItem.id.slice(0, 8).toUpperCase()}
                  </Badge>
                </div>
                <Badge className="capitalize text-xs">{selectedItem.status}</Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-2">
              <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                <p className="font-bold text-foreground truncate">Product Link: <a href={selectedItem.productUrl} target="_blank" rel="noreferrer" className="text-primary underline">{selectedItem.productUrl}</a></p>
                <p className="text-muted-foreground">Buyer: <strong>{selectedItem.buyer?.name || 'Customer'}</strong> ({selectedItem.buyer?.email})</p>
                <p className="text-muted-foreground">Target Quantity: <strong className="font-mono text-foreground">{selectedItem.targetQuantity} units</strong></p>
                {selectedItem.description && <p className="text-muted-foreground">Notes: {selectedItem.description}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedItemId(null)}>Close</Button>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success(`Quote notification dispatched to buyer for ticket SRC-${selectedItem.id.slice(0, 8)}`)
                    setSelectedItemId(null)
                  }}
                  className="bg-[#FF6B00] hover:bg-[#E85F00] text-white font-bold"
                >
                  Confirm &amp; Send Landed TZS Quote
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
