'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Anchor,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  HelpCircle,
  Package,
  Plane,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react'
import { PublicShell } from '@/components/shell/public-shell'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type TrackingResult = {
  id: string
  code: string
  orderNumber?: string
  origin: string
  destination: string
  mode: 'Air Freight' | 'Sea Cargo' | string
  carrier: string
  status: string
  etd?: string
  eta?: string
  weight?: string
  items?: string
  steps: {
    title: string
    location: string
    timestamp: string
    done: boolean
    description: string
  }[]
}

export default function TrackFreightPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [trackingData, setTrackingData] = useState<TrackingResult | null>(null)

  // Calculator State
  const [calcWeight, setCalcWeight] = useState(10)
  const [calcCbm, setCalcCbm] = useState(0.5)

  const airPriceTzs = Math.round(calcWeight * 26000) // ~10 USD/kg @ 2600 TZS
  const seaPriceTzs = Math.round(calcCbm * 580000) // ~220 USD/CBM @ 2600 TZS

  async function performTrack(codeToTrack: string) {
    if (!codeToTrack.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/shipments/track?code=${encodeURIComponent(codeToTrack.trim())}`)
      const data = await res.json()

      if (res.ok && data.found && data.waybill) {
        setTrackingData(data.waybill)
      } else {
        setTrackingData(null)
      }
    } catch (err) {
      console.error('Shipment tracking fetch failed:', err)
      setTrackingData(null)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    performTrack(searchQuery)
  }

  return (
    <PublicShell>
      <PageHeader
        title="Track Express Parcels & Freight"
        description="Real-time parcel, container, and air waybill tracking across Dar es Salaam, Arusha, Mwanza, and international trade routes."
      />

      <div className="mt-6 grid gap-8 max-w-6xl mx-auto">
        {/* Real Database Search Bar */}
        <Card className="border-primary/20 bg-card shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Tracking #, Waybill Code, or Order ID (e.g. EWB-..., ORD-..., SRC-...)"
                  className="pl-10 h-11 text-sm font-medium"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full md:w-auto font-bold px-8 bg-[#FF6B00] hover:bg-[#E85F00] text-white shadow-md shadow-orange-500/20"
              >
                {loading ? (
                  <>
                    <RefreshCw className="size-4 animate-spin mr-2" /> Searching Database...
                  </>
                ) : (
                  'Track Parcel / Shipment'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Shipment Database Result Card */}
        {loading ? (
          <Card className="p-12 text-center text-xs text-muted-foreground space-y-3">
            <RefreshCw className="size-8 animate-spin mx-auto text-[#FF6B00]" />
            <p className="font-bold text-sm text-foreground">Querying Database Shipment Records...</p>
            <p>Searching electronic waybills, order fulfillment milestones, and carrier dispatch logs.</p>
          </Card>
        ) : searched && trackingData ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-mono font-bold text-sm shadow">
                      {trackingData.mode?.includes('Air') ? <Plane className="size-5" /> : <Anchor className="size-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-foreground">{trackingData.code}</span>
                        <Badge className="bg-primary/15 text-primary border-primary/30 font-semibold">
                          {trackingData.mode}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Carrier: <span className="font-medium text-foreground">{trackingData.carrier}</span>
                      </p>
                    </div>
                  </div>

                  <Badge className="px-3 py-1 text-xs font-bold bg-[#FF6B00] text-white">
                    {trackingData.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Route Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40 border mb-6 text-center">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Origin Hub</span>
                    <p className="text-xs font-bold text-foreground mt-1">{trackingData.origin}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Destination</span>
                    <p className="text-xs font-bold text-foreground mt-1">{trackingData.destination}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Package / Cargo</span>
                    <p className="text-xs font-bold text-foreground mt-1">{trackingData.weight || 'Standard'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Est. Delivery</span>
                    <p className="text-xs font-bold text-[#FF6B00] mt-1">{trackingData.eta || 'Active Transit'}</p>
                  </div>
                </div>

                {/* Step-by-Step Milestones Timeline */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {trackingData.steps.map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-6 top-0.5 flex size-5 items-center justify-center rounded-full border-2 transition-all ${
                          step.done
                            ? 'border-[#FF6B00] bg-[#FF6B00] text-white shadow-sm'
                            : 'border-muted-foreground/30 bg-background text-muted-foreground'
                        }`}
                      >
                        {step.done ? <CheckCircle2 className="size-3.5" /> : <div className="size-1.5 rounded-full bg-muted-foreground/40" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className={`text-sm font-bold ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.title}
                          </h4>
                          <span className="text-[11px] font-mono text-muted-foreground">{step.timestamp}</span>
                        </div>
                        <p className="text-xs font-medium text-[#FF6B00] mt-0.5">{step.location}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Side Freight Estimator */}
            <div className="flex flex-col gap-6">
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="bg-muted/40 border-b pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Compass className="size-4 text-[#FF6B00]" />
                    Freight Cost Estimator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Compare Air vs Sea freight tariffs to Dar es Salaam in TZS
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-foreground">Cargo Weight (kg)</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(Number(e.target.value))}
                      className="w-full mt-2 accent-[#FF6B00]"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground font-mono mt-1">
                      <span>1 kg</span>
                      <span className="font-bold text-[#FF6B00]">{calcWeight} kg</span>
                      <span>100 kg</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Volume (CBM / m³)</label>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={calcCbm}
                      onChange={(e) => setCalcCbm(Number(e.target.value))}
                      className="w-full mt-2 accent-[#FF6B00]"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground font-mono mt-1">
                      <span>0.1 CBM</span>
                      <span className="font-bold text-[#FF6B00]">{calcCbm} CBM</span>
                      <span>5.0 CBM</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                      <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300 flex items-center justify-center gap-1.5 mb-0.5">
                        <Plane className="size-3.5" />
                        Air Express
                      </span>
                      <span className="text-xs text-muted-foreground">3–7 Days</span>
                      <p className="text-sm font-extrabold text-orange-600 mt-1">TZS {airPriceTzs.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5 mb-0.5">
                        <Anchor className="size-3.5" />
                        Sea Cargo
                      </span>
                      <span className="text-xs text-muted-foreground">22–30 Days</span>
                      <p className="text-sm font-extrabold text-blue-600 mt-1">TZS {seaPriceTzs.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Freight Trust Pillars */}
              <Card className="border-border bg-card">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-[#FF6B00] shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold">100% TRA &amp; TBS Cleared</h5>
                      <p className="text-[11px] text-muted-foreground">All customs duties and taxes included in quote.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileCheck className="size-5 text-[#FF6B00] shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold">Insurance Protection</h5>
                      <p className="text-[11px] text-muted-foreground">Goods protected against damage or transit loss.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : searched && !trackingData ? (
          <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 p-8 text-center space-y-3">
            <XCircle className="size-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-foreground">No Active Shipment Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              We could not locate any active database record or electronic waybill for tracking number{' '}
              <span className="font-mono font-bold text-foreground">"{searchQuery}"</span>.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Button render={<Link href="/account" />} size="sm" className="bg-[#FF6B00] hover:bg-[#E85F00] text-white text-xs">
                View My Account Orders
              </Button>
            </div>
          </Card>
        ) : (
          /* Initial State - Inviting Search Guidance */
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-2 border-primary/20">
              <Package className="size-6 text-[#FF6B00]" />
              <h3 className="font-bold text-sm">Order &amp; Parcel Tracking</h3>
              <p className="text-xs text-muted-foreground">
                Track your Lumo online marketplace orders using your Order ID (e.g. ORD-...).
              </p>
            </Card>

            <Card className="p-6 space-y-2 border-primary/20">
              <Plane className="size-6 text-[#FF6B00]" />
              <h3 className="font-bold text-sm">Electronic Waybills</h3>
              <p className="text-xs text-muted-foreground">
                Monitor international Air Cargo and Sea Freight shipments with official EWB numbers.
              </p>
            </Card>

            <Card className="p-6 space-y-2 border-primary/20">
              <Truck className="size-6 text-[#FF6B00]" />
              <h3 className="font-bold text-sm">Doorstep Dispatch</h3>
              <p className="text-xs text-muted-foreground">
                Get real-time SMS notifications and rider details for last-mile delivery across Tanzania.
              </p>
            </Card>
          </div>
        )}

        {/* Freight FAQ Accordion Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-extrabold flex items-center gap-2">
              <HelpCircle className="size-5 text-[#FF6B00]" />
              Frequently Asked Freight &amp; Customs Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border">
              <h4 className="text-sm font-bold text-foreground">Q: How does Lumo calculate freight costs?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Air freight is charged per kilogram (kg) based on gross weight or volumetric weight (whichever is higher). Sea cargo is calculated per Cubic Meter (CBM). All prices include door-to-door delivery within Tanzania.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border">
              <h4 className="text-sm font-bold text-foreground">Q: Do I need a separate import license or TRA TIN number?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                No. Lumo acts as your official clearing agent. We handle TRA tax assessment, TBS quality inspection certificates, and customs release under our master import permit.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border">
              <h4 className="text-sm font-bold text-foreground">Q: What happens if my shipment is delayed at Dar port?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                If customs clearance takes longer than expected, Lumo covers any port demurrage fees. Your payment remains safely protected under AzamPay buyer protection until goods are delivered.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  )
}
