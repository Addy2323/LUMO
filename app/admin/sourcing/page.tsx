'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  Download,
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
      const res = await fetch('/api/sourcing')
      const data = await res.json()
      if (Array.isArray(data)) {
        setItems(data)
      } else if (data.requests) {
        setItems(data.requests)
      }
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
              <span className="text-lg font-extrabold text-[#FF6B00] font-mono tnum">
                {formatTZS(totalVolume)}
              </span>
            </div>
            <div className="rounded-lg bg-orange-500/10 text-[#FF6B00] p-2.5">
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
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
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
                      <Badge className="text-[10px] uppercase font-bold bg-orange-500/10 text-[#FF6B00] border border-orange-500/20">
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
                      <ShieldCheck className="size-3.5 mr-1 text-[#FF6B00]" />
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
          <DialogContent className="max-w-2xl p-6 border-border shadow-2xl">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="flex items-center justify-between text-base font-extrabold">
                <div className="flex items-center gap-2">
                  <span>Sourcing Ticket Audit</span>
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
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
