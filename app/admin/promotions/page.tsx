'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Copy,
  Pause,
  Play,
  Archive,
  Trash2,
  Calendar,
  MousePointer,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  ExternalLink,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/brand/logo'
import { toast } from 'sonner'

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>({
    total: 0,
    active: 0,
    totalImpressions: 0,
    totalClicks: 0,
    overallCtr: '0.00%',
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [placementFilter, setPlacementFilter] = useState('ALL')

  // Preview Modal
  const [previewPromo, setPreviewPromo] = useState<any | null>(null)

  async function loadPromotions() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (placementFilter !== 'ALL') params.set('placement', placementFilter)

      const res = await fetch(`/api/admin/promotions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPromotions(data.promotions || [])
        setMetrics(data.metrics || {})
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load promotions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromotions()
  }, [statusFilter, placementFilter])

  // Actions
  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/admin/promotions/${id}/duplicate`, { method: 'POST' })
      if (res.ok) {
        toast.success('Campaign duplicated as draft!')
        loadPromotions()
      } else {
        toast.error('Failed to duplicate campaign')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handlePublishImmediately(id: string) {
    try {
      const res = await fetch(`/api/admin/promotions/${id}/publish`, { method: 'POST' })
      if (res.ok) {
        toast.success('Campaign published and active immediately!')
        loadPromotions()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handlePause(id: string) {
    try {
      const res = await fetch(`/api/admin/promotions/${id}/pause`, { method: 'POST' })
      if (res.ok) {
        toast.success('Campaign paused')
        loadPromotions()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleResume(id: string) {
    try {
      const res = await fetch(`/api/admin/promotions/${id}/resume`, { method: 'POST' })
      if (res.ok) {
        toast.success('Campaign resumed')
        loadPromotions()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleArchive(id: string) {
    if (!confirm('Are you sure you want to archive this promotion?')) return
    try {
      const res = await fetch(`/api/admin/promotions/${id}/archive`, { method: 'POST' })
      if (res.ok) {
        toast.success('Campaign archived')
        loadPromotions()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this draft?')) return
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Promotion deleted')
        loadPromotions()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
      case 'SCHEDULED':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30'
      case 'DRAFT':
        return 'bg-slate-500/10 text-slate-600 border-slate-500/30'
      case 'PAUSED':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30'
      case 'EXPIRED':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/30'
      case 'ARCHIVED':
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            Promotions &amp; Popups Manager
            <Badge className="bg-brand-500/10 text-brand-500 border border-brand-500/20 text-xs font-bold gap-1">
              <Sparkles className="size-3" /> Live Engine
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground">
            Create, schedule, pause, and monitor targeted promotional popups and banners.
          </p>
        </div>

        <Button
          render={<Link href="/admin/promotions/new" />}
          className="bg-brand-500 hover:bg-brand-600 text-white font-black text-xs shadow-md"
        >
          <Plus className="size-4 mr-1" /> Create New Promotion
        </Button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-card">
          <span className="text-[11px] font-bold text-muted-foreground">Total Campaigns</span>
          <p className="text-xl font-black text-foreground mt-0.5">{metrics.total}</p>
        </Card>
        <Card className="p-3 bg-card border-emerald-500/30">
          <span className="text-[11px] font-bold text-emerald-600">Active Now</span>
          <p className="text-xl font-black text-emerald-600 mt-0.5">{metrics.active}</p>
        </Card>
        <Card className="p-3 bg-card">
          <span className="text-[11px] font-bold text-muted-foreground">Total Impressions</span>
          <p className="text-xl font-black text-foreground mt-0.5 font-mono">
            {Number(metrics.totalImpressions).toLocaleString()}
          </p>
        </Card>
        <Card className="p-3 bg-card">
          <span className="text-[11px] font-bold text-muted-foreground">Total Clicks</span>
          <p className="text-xl font-black text-brand-500 mt-0.5 font-mono">
            {Number(metrics.totalClicks).toLocaleString()}
          </p>
        </Card>
        <Card className="p-3 bg-card">
          <span className="text-[11px] font-bold text-muted-foreground">Platform CTR</span>
          <p className="text-xl font-black text-foreground mt-0.5 font-mono">{metrics.overallCtr}</p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="size-4 text-muted-foreground ml-2" />
          <Input
            placeholder="Search campaigns by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPromotions()}
            className="h-8 text-xs border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs">
            {['ALL', 'ACTIVE', 'SCHEDULED', 'DRAFT', 'PAUSED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  statusFilter === s ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-semibold"
          >
            <option value="ALL">All Placements</option>
            <option value="ENTRY_POPUP">Entry Popup</option>
            <option value="HOMEPAGE_BANNER">Homepage Banner</option>
            <option value="MARKETPLACE_BANNER">Marketplace Banner</option>
          </select>
        </div>
      </div>

      {/* Promotions Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground font-bold">
                <th className="p-3 pl-4">Preview</th>
                <th className="p-3">Campaign Title &amp; Copy</th>
                <th className="p-3">Status</th>
                <th className="p-3">Placement</th>
                <th className="p-3">Schedule (EAT)</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Performance</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading promotional campaigns...
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center space-y-2">
                    <Sparkles className="size-8 text-brand-500 mx-auto opacity-50" />
                    <p className="font-bold text-foreground">No promotional campaigns found</p>
                    <p className="text-xs text-muted-foreground">Create your first popup promotion to engage visitors.</p>
                    <Button size="sm" render={<Link href="/admin/promotions/new" />} className="bg-brand-500 text-white font-bold text-xs mt-2">
                      <Plus className="size-3.5 mr-1" /> Create Promotion
                    </Button>
                  </td>
                </tr>
              ) : (
                promotions.map((p) => {
                  const ctr = p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(1) : '0.0'
                  const start = new Date(p.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  const end = new Date(p.endAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      {/* Thumbnail */}
                      <td className="p-3 pl-4">
                        <div
                          className="size-12 rounded-lg overflow-hidden border bg-slate-100 cursor-pointer shrink-0"
                          onClick={() => setPreviewPromo(p)}
                        >
                          <img src={p.desktopImageUrl} alt={p.title} className="size-full object-cover" />
                        </div>
                      </td>

                      {/* Title & Copy */}
                      <td className="p-3 max-w-xs space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-foreground text-sm line-clamp-1">{p.title}</span>
                          {p.openInNewTab && <ExternalLink className="size-3 text-muted-foreground" />}
                        </div>
                        {p.subtitle && (
                          <p className="text-[11px] font-bold text-brand-500 truncate">{p.subtitle}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] font-bold ${statusBadgeColor(p.status)}`}>
                          {p.status}
                        </Badge>
                      </td>

                      {/* Placement & Audience */}
                      <td className="p-3 space-y-0.5">
                        <Badge variant="secondary" className="text-[9px] font-semibold">
                          {p.placement.replace('_', ' ')}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground">{p.audience.replace('_', ' ')}</p>
                      </td>

                      {/* Schedule */}
                      <td className="p-3 space-y-0.5 font-mono text-[11px]">
                        <div>{start} → {end}</div>
                        <span className="text-[9px] text-muted-foreground">{p.displayFrequency}</span>
                      </td>

                      {/* Priority */}
                      <td className="p-3 font-mono font-bold text-xs">{p.priority}</td>

                      {/* Performance */}
                      <td className="p-3 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground font-mono">{p.clicks} clicks</span>
                          <span className="text-muted-foreground font-mono">({p.impressions} views)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-brand-500 font-extrabold font-mono">CTR: {ctr}%</span>
                          <span className="text-[10px] text-muted-foreground">· {p.dismissals} dismissed</span>
                        </div>
                      </td>

                      {/* Actions Menu */}
                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            title="Preview Modal"
                            onClick={() => setPreviewPromo(p)}
                          >
                            <Eye className="size-3.5" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            title="Edit Campaign"
                            render={<Link href={`/admin/promotions/${p.id}/edit`} />}
                          >
                            <Edit className="size-3.5" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            title="Duplicate"
                            onClick={() => handleDuplicate(p.id)}
                          >
                            <Copy className="size-3.5" />
                          </Button>

                          {p.status === 'ACTIVE' ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-amber-600 hover:text-amber-700"
                              title="Pause"
                              onClick={() => handlePause(p.id)}
                            >
                              <Pause className="size-3.5" />
                            </Button>
                          ) : p.status === 'PAUSED' ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-emerald-600 hover:text-emerald-700"
                              title="Resume"
                              onClick={() => handleResume(p.id)}
                            >
                              <Play className="size-3.5" />
                            </Button>
                          ) : p.status === 'DRAFT' || p.status === 'SCHEDULED' ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-emerald-600 hover:text-emerald-700"
                              title="Publish Immediately"
                              onClick={() => handlePublishImmediately(p.id)}
                            >
                              <Play className="size-3.5" />
                            </Button>
                          ) : null}

                          {p.status === 'DRAFT' ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-rose-600 hover:text-rose-700"
                              title="Delete Draft"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              title="Archive"
                              onClick={() => handleArchive(p.id)}
                            >
                              <Archive className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Admin Quick Preview Modal */}
      {previewPromo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewPromo(null)}
        >
          <div
            className="relative w-full max-w-[680px] rounded-3xl shadow-2xl overflow-hidden border border-white/20 grid grid-cols-12"
            style={{
              backgroundColor: previewPromo.backgroundColor || '#FFF8F2',
              color: previewPromo.textColor || '#0B1F3A',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPromo(null)}
              className="absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md hover:bg-white"
            >
              <X className="size-4" />
            </button>

            <div className="col-span-5 relative min-h-[300px] bg-slate-200">
              <img src={previewPromo.desktopImageUrl} alt={previewPromo.title} className="size-full object-cover" />
            </div>

            <div className="col-span-7 flex flex-col justify-center items-center text-center p-6 space-y-3">
              <div className="flex items-center gap-1.5">
                <Logo markOnly className="size-6" />
                <span className="font-extrabold text-base tracking-tight uppercase" style={{ color: previewPromo.buttonColor || '#FF6B00' }}>
                  LUMO
                </span>
              </div>

              <h3 className="text-lg font-black leading-tight tracking-tight">{previewPromo.title}</h3>
              {previewPromo.subtitle && (
                <p className="text-xs font-extrabold" style={{ color: previewPromo.buttonColor || '#FF6B00' }}>
                  {previewPromo.subtitle}
                </p>
              )}

              <Sparkles className="size-4 opacity-70" style={{ color: previewPromo.buttonColor || '#FF6B00' }} />

              <p className="text-xs opacity-90 font-medium">{previewPromo.description}</p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-900">
                <Clock className="size-3 text-amber-600" />
                <span>Offer ends in <strong>02:14:36</strong></span>
              </div>

              <div className="w-full space-y-1 pt-1 max-w-xs">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase text-white shadow-md"
                  style={{ backgroundColor: previewPromo.buttonColor || '#FF6B00' }}
                >
                  {previewPromo.buttonText || 'Explore the Offer'}
                </button>
                {previewPromo.secondaryButtonText && (
                  <p className="text-[11px] text-slate-500 underline">{previewPromo.secondaryButtonText}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
