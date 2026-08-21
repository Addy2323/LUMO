'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Globe,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatTZS, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { SourcingChatThread } from '@/components/sourcing/sourcing-chat-thread'

import { useSourcingStore } from '@/lib/stores/sourcing-store'

type DatabaseSourcingItem = {
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

export default function AdminSourcingPage() {
  const [items, setItems] = useState<DatabaseSourcingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'SUBMITTED' | 'IN_REVIEW' | 'QUOTED'>('all')
  const [search, setSearch] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const fetchDatabaseSourcing = async () => {
    setLoading(true)
    try {
      let dbRequests: DatabaseSourcingItem[] = []
      try {
        const res = await fetch('/api/sourcing')
        const data = await res.json()
        if (Array.isArray(data)) {
          dbRequests = data
        } else if (data.requests) {
          dbRequests = data.requests
        }
      } catch (e) {}

      setItems(dbRequests)
    } catch (error) {
      console.error('Failed to fetch database sourcing requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseSourcing()
  }, [])

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === 'all' || item.status.toUpperCase() === filter
    const matchesSearch =
      search.trim() === '' ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      (item.buyer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      item.productUrl.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Metrics
  const totalVolume = items.reduce((acc, i) => acc + (i.targetPriceTZS ? Number(i.targetPriceTZS) * i.targetQuantity : 0), 0)
  const quotedCount = items.filter((i) => i.status.toUpperCase() === 'QUOTED').length

  return (
    <div className="flex flex-col gap-6 antialiased font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Admin Sourcing Governance &amp; Audit</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Platform-wide audit console for B2B sourcing requests directly connected to PostgreSQL database tables.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDatabaseSourcing} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-slate-800 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Platform Requests</span>
              <span className="text-2xl font-extrabold tnum">{items.length}</span>
            </div>
            <div className="rounded-lg bg-slate-800/10 p-2.5 text-slate-800 dark:text-white">
              <Package className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Quotes Generated</span>
              <span className="text-2xl font-extrabold text-emerald-600 tnum">{quotedCount}</span>
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 p-2.5">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#FF6B00] bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Total Sourcing Volume</span>
              <span className="text-lg font-extrabold text-primary font-mono tnum">
                {formatTZS(totalVolume)}
              </span>
            </div>
            <div className="rounded-lg bg-orange-500/10 text-primary p-2.5">
              <Globe className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Audit Status</span>
              <span className="text-2xl font-extrabold text-amber-600 tnum">Compliant</span>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 p-2.5">
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Governance Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">Sourcing Audit Register ({filteredItems.length})</CardTitle>

          <div className="flex items-center gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="bg-muted/60 p-1 text-xs">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="SUBMITTED" className="text-xs">Submitted</TabsTrigger>
                <TabsTrigger value="IN_REVIEW" className="text-xs">In Review</TabsTrigger>
                <TabsTrigger value="QUOTED" className="text-xs">Quoted</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Audit search ticket ID, buyer..."
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
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                Loading live sourcing tickets from PostgreSQL...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No sourcing requests found in database.</p>
                <p>New B2B sourcing tickets will populate here dynamically.</p>
              </div>
            ) : (
              filteredItems.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 transition-colors text-xs"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-xs text-primary">SRC-{req.id.slice(0, 8).toUpperCase()}</span>
                      <Badge className="text-[10px] uppercase font-bold bg-orange-500/10 text-primary border border-orange-500/20">
                        {req.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Placed: {formatDate(req.createdAt)}</span>
                    </div>

                    <a href={req.productUrl} target="_blank" rel="noreferrer" className="font-bold text-xs text-foreground hover:underline truncate max-w-lg">
                      {req.productUrl}
                    </a>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Buyer: <strong className="text-foreground">{req.buyer?.name || 'Customer'}</strong> ({req.buyer?.email || 'N/A'})</span>
                      <span>·</span>
                      <span>Target Qty: <strong className="text-foreground font-mono">{req.targetQuantity} units</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => setSelectedItemId(req.id)}
                      className="font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                    >
                      <ShieldCheck className="size-3.5 mr-1 text-primary" />
                      Audit Ticket Detail
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Audit Dialog */}
      {selectedItem && (
        <Dialog open onOpenChange={() => setSelectedItemId(null)}>
          <DialogContent className="max-w-3xl p-6 border-border shadow-2xl rounded-2xl">
            <DialogHeader className="border-b pb-3.5">
              <DialogTitle className="flex items-center justify-between text-base font-extrabold">
                <div className="flex items-center gap-2.5">
                  <Package className="size-5 text-primary" />
                  <span>Sourcing Ticket Audit</span>
                  <Badge variant="outline" className="font-mono text-xs text-primary bg-primary/5">
                    SRC-{selectedItem.id.slice(0, 8).toUpperCase()}
                  </Badge>
                </div>
                <Badge className="capitalize text-xs px-3 py-0.5">{selectedItem.status}</Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 text-xs mt-3">
              <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="size-4 text-primary shrink-0" />
                    <span className="font-bold text-foreground shrink-0">Product URL:</span>
                    <a
                      href={selectedItem.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-mono text-xs truncate max-w-md bg-card px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5"
                    >
                      <span className="truncate">{selectedItem.productUrl}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-card border space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Buyer Details</span>
                    <p className="font-bold text-foreground truncate">{selectedItem.buyer?.name || 'Customer'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{selectedItem.buyer?.email || 'N/A'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Quantity</span>
                    <p className="font-extrabold text-foreground font-mono text-sm">{selectedItem.targetQuantity} <span className="text-xs font-normal text-muted-foreground">units</span></p>
                    <p className="text-[11px] text-muted-foreground">Required for order fulfillment</p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Price / Budget</span>
                    <p className="font-extrabold text-primary font-mono text-sm">
                      {selectedItem.targetPriceTZS ? formatTZS(selectedItem.targetPriceTZS) : 'RFQ / Market Quote'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Est. Landed TZS Budget</p>
                  </div>
                </div>

                {selectedItem.description && (
                  <div className="p-3 rounded-xl bg-card border text-muted-foreground text-xs space-y-1">
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block">Buyer Notes &amp; Specifications</span>
                    <p className="leading-relaxed text-foreground whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>
                )}
              </div>

              {/* Database-Backed Sourcing Communication Thread */}
              <SourcingChatThread sourcingRequestId={selectedItem.id} currentRole="ADMIN" />

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedItemId(null)} className="h-9 px-4 font-bold text-xs">
                  Close Audit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
