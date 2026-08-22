'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  BarChart3,
  Edit,
  Eye,
  MousePointer,
  Smartphone,
  Monitor,
  Users,
  Clock,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PromotionForm } from '@/components/admin/promotions/promotion-form'
import { toast } from 'sonner'

export default function EditPromotionPage() {
  const params = useParams()
  const id = params?.id as string

  const [promotion, setPromotion] = useState<any | null>(null)
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'editor' | 'analytics'>('editor')

  useEffect(() => {
    if (!id) return

    async function loadData() {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/promotions/${id}`)
        if (res.ok) {
          const data = await res.json()
          setPromotion(data.promotion)
          setAnalytics(data.analytics)
        } else {
          toast.error('Failed to load promotion')
        }
      } catch (err) {
        console.error(err)
        toast.error('Error loading promotion')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="size-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Loading promotion details...</span>
        </div>
      </div>
    )
  }

  if (!promotion) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="font-bold text-foreground">Promotion not found</p>
        <Button render={<Link href="/admin/promotions" />} size="sm" variant="outline">
          <ArrowLeft className="size-3.5 mr-1" /> Back to Promotions
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" render={<Link href="/admin/promotions" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              {promotion.title}
              <Badge className="bg-brand-500/10 text-brand-500 border-brand-500/20 text-xs font-bold">
                {promotion.status}
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Placement: <strong className="text-foreground">{promotion.placement}</strong> · Priority: {promotion.priority}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'editor'
                ? 'bg-background shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit className="size-3.5" /> Campaign Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-background shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="size-3.5 text-brand-500" /> Analytics &amp; Telemetry
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <PromotionForm initialData={promotion} isEdit={true} />
      ) : (
        /* Analytics Tab View */
        <div className="space-y-6">
          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Eye className="size-3.5" /> Total Impressions
              </span>
              <p className="text-2xl font-black text-foreground mt-1 font-mono">{analytics?.impressions || 0}</p>
              <span className="text-[10px] text-muted-foreground">Customer views loaded</span>
            </Card>

            <Card className="p-4 border-brand-500/30">
              <span className="text-xs font-bold text-brand-500 flex items-center gap-1.5">
                <MousePointer className="size-3.5" /> Total Clicks
              </span>
              <p className="text-2xl font-black text-brand-500 mt-1 font-mono">{analytics?.clicks || 0}</p>
              <span className="text-[10px] text-muted-foreground">Primary button clicks</span>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="size-3.5" /> Click-Through Rate
              </span>
              <p className="text-2xl font-black text-foreground mt-1 font-mono">{analytics?.ctr || '0.00%'}</p>
              <span className="text-[10px] text-muted-foreground">Clicks / Impressions</span>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3.5" /> Dismissals
              </span>
              <p className="text-2xl font-black text-foreground mt-1 font-mono">{analytics?.dismissals || 0}</p>
              <span className="text-[10px] text-muted-foreground">Closed via 'X' or 'Maybe Later'</span>
            </Card>
          </div>

          {/* Interaction Details & Device Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Monitor className="size-4 text-brand-500" /> Device Telemetry Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Impressions and clicks categorized by customer device type.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics?.deviceBreakdown && analytics.deviceBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.deviceBreakdown.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {item.deviceType === 'MOBILE' ? (
                            <Smartphone className="size-4 text-brand-500" />
                          ) : (
                            <Monitor className="size-4 text-blue-500" />
                          )}
                          <span className="font-bold">{item.deviceType || 'DESKTOP'}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {item.event}
                          </Badge>
                        </div>
                        <strong className="font-mono text-sm">{item._count?._all || 0}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No device interactions recorded yet. Once shoppers view the promotion, live telemetry will appear here.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Clock className="size-4 text-brand-500" /> Recent Interaction Feed
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest 100 customer telemetry events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {promotion.interactions && promotion.interactions.length > 0 ? (
                  <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                    {promotion.interactions.map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-2 rounded-lg border text-[11px] bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              event.event === 'CLICK'
                                ? 'bg-brand-500/10 text-brand-500 border-brand-500/30'
                                : event.event === 'IMPRESSION'
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                            }`}
                          >
                            {event.event}
                          </Badge>
                          <span className="font-mono text-muted-foreground">{event.deviceType}</span>
                        </div>
                        <span className="text-muted-foreground font-mono">
                          {new Date(event.occurredAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No interactions logged yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
