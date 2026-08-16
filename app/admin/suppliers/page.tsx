'use client'

import React, { useState, useEffect } from 'react'
import { Store, Search, RefreshCw, Building2, CheckCircle2, ShieldCheck, Mail, Phone, MapPin, Award, Star, ExternalLink, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVerified, setFilterVerified] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL')
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  async function fetchSuppliers() {
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        const raw = Array.isArray(data) ? data : data.suppliers || []
        setSuppliers(raw)
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
      toast.error('Failed to load supplier profiles')
    } finally {
      setLoading(false)
    }
  }

  const filtered = suppliers.filter((s) => {
    const matchesSearch =
      (s.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.country || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.user?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.user?.name || '').toLowerCase().includes(search.toLowerCase())

    if (filterVerified === 'VERIFIED') return matchesSearch && s.verified
    if (filterVerified === 'PENDING') return matchesSearch && !s.verified
    return matchesSearch
  })

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground bg-background min-h-screen p-4 md:p-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Store className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Supplier Management Console
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit verified global factory partners, review compliance status, and manage factory liaisons.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchSuppliers}
            variant="outline"
            className="border-border bg-card text-foreground hover:bg-muted font-bold text-xs h-10 px-4 gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Directory
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">Total Suppliers</span>
            <Building2 className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground mt-1 font-mono">{suppliers.length}</p>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase">Verified Factories</span>
            <ShieldCheck className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {suppliers.filter((s) => s.verified).length}
          </p>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase">Pending Audits</span>
            <Award className="size-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1 font-mono">
            {suppliers.filter((s) => !s.verified).length}
          </p>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="bg-card border-border p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search supplier, country, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-10 bg-background"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant={filterVerified === 'ALL' ? 'default' : 'outline'}
              onClick={() => setFilterVerified('ALL')}
              className="text-xs font-bold h-9 flex-1 sm:flex-none"
            >
              All ({suppliers.length})
            </Button>
            <Button
              size="sm"
              variant={filterVerified === 'VERIFIED' ? 'default' : 'outline'}
              onClick={() => setFilterVerified('VERIFIED')}
              className="text-xs font-bold h-9 flex-1 sm:flex-none"
            >
              Verified ({suppliers.filter((s) => s.verified).length})
            </Button>
            <Button
              size="sm"
              variant={filterVerified === 'PENDING' ? 'default' : 'outline'}
              onClick={() => setFilterVerified('PENDING')}
              className="text-xs font-bold h-9 flex-1 sm:flex-none"
            >
              Pending ({suppliers.filter((s) => !s.verified).length})
            </Button>
          </div>
        </div>

        {/* Suppliers Grid / List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw className="size-5 animate-spin text-primary" /> Fetching supplier database records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
            <Store className="size-8 text-muted-foreground mx-auto opacity-50" />
            <p className="font-bold text-foreground text-sm">No suppliers found</p>
            <p>Try adjusting your search filter or refresh the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-muted shrink-0">
                        <Building2 className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-foreground truncate">{item.companyName}</h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          {item.country || 'China'} · {item.hubLocation || 'Guangzhou Hub'}
                        </p>
                      </div>
                    </div>
                    {item.verified ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] font-bold shrink-0">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px] font-bold shrink-0">
                        Pending Audit
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/50">
                    <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
                      <span className="text-muted-foreground text-[10px] block">Rating Score</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Star className="size-3 text-amber-500 fill-amber-500" />
                        {item.rating || 4.8} / 5.0
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
                      <span className="text-muted-foreground text-[10px] block">Catalog Products</span>
                      <span className="font-bold text-foreground font-mono flex items-center gap-1">
                        <Package className="size-3 text-primary" />
                        {item._count?.products || 0} items
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{item.user?.email || 'No email registered'}</span>
                    </div>
                    {item.user?.phone && (
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <Phone className="size-3 text-muted-foreground shrink-0" />
                        <span>{item.user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => setSelectedSupplier(item)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 shadow-xs"
                >
                  Inspect Supplier Profile
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Supplier Profile Detail Dialog */}
      {selectedSupplier && (
        <Dialog open onOpenChange={() => setSelectedSupplier(null)}>
          <DialogContent className="max-w-xl p-6 border-border shadow-2xl rounded-2xl">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="flex items-center justify-between text-base font-extrabold">
                <div className="flex items-center gap-2.5">
                  <Building2 className="size-5 text-primary" />
                  <span>{selectedSupplier.companyName}</span>
                </div>
                {selectedSupplier.verified ? (
                  <Badge className="bg-emerald-600 text-white text-xs font-bold">Verified</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-xs font-bold">Pending Audit</Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-3">
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                <div className="grid grid-cols-2 gap-3 text-muted-foreground">
                  <div>Company Name: <strong className="text-foreground block font-bold">{selectedSupplier.companyName}</strong></div>
                  <div>Country: <strong className="text-foreground block font-bold">{selectedSupplier.country || 'China'}</strong></div>
                  <div>Hub Location: <strong className="text-foreground block font-bold">{selectedSupplier.hubLocation || 'Guangzhou Hub'}</strong></div>
                  <div>Quality Rating: <strong className="text-amber-600 block font-bold">⭐ {selectedSupplier.rating || 4.8} / 5.0</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">Contact &amp; Account Details</h4>
                <div className="space-y-1.5 text-muted-foreground">
                  <p>Contact Person: <strong className="text-foreground">{selectedSupplier.user?.name || 'Factory Liaison'}</strong></p>
                  <p>Account Email: <strong className="text-foreground">{selectedSupplier.user?.email || 'N/A'}</strong></p>
                  <p>Phone Number: <strong className="text-foreground font-mono">{selectedSupplier.user?.phone || 'N/A'}</strong></p>
                  <p>KYC Verification: <strong className="text-emerald-600 capitalize">{selectedSupplier.user?.kycStatus || 'VERIFIED'}</strong></p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button variant="outline" onClick={() => setSelectedSupplier(null)} className="font-bold text-xs h-9">
                  Close Profile
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
