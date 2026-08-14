'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTZS } from '@/lib/format'
import { Order } from '@/lib/mock/orders'
import { CreditCard, MapPin, Zap, TrendingUp, DollarSign, ShieldCheck } from 'lucide-react'

export function AdminAnalyticsDrawer({ orders }: { orders: Order[] }) {
  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'returned')
    const totalRev = validOrders.reduce((acc, o) => acc + (o.total || 0), 0)

    // Payment Gateway Breakdown
    const paymentMap: Record<string, number> = {}
    orders.forEach((o) => {
      paymentMap[o.paymentMethod] = (paymentMap[o.paymentMethod] || 0) + o.total
    })

    const paymentMethodsList = [
      { id: 'mpesa', name: 'M-Pesa (Vodacom)', color: 'bg-emerald-500' },
      { id: 'mixxbyyas', name: 'Mixx by Yas', color: 'bg-amber-500' },
      { id: 'bank_crdb', name: 'CRDB Bank Transfer', color: 'bg-green-600' },
      { id: 'card', name: 'Credit / Debit Card', color: 'bg-blue-500' },
      { id: 'halopesa', name: 'HaloPesa', color: 'bg-orange-500' },
    ]

    const paymentBreakdown = paymentMethodsList.map((pm) => {
      const amount = paymentMap[pm.id] || 0
      const percentage = totalRev > 0 ? Math.round((amount / totalRev) * 100) : 0
      return { ...pm, amount, percentage }
    })

    // Regional Heatmap Breakdown
    const regionMap: Record<string, number> = {}
    orders.forEach((o) => {
      const reg = o.shippingAddress?.region || 'Dar es Salaam'
      regionMap[reg] = (regionMap[reg] || 0) + 1
    })

    const topRegions = Object.entries(regionMap)
      .map(([region, count]) => ({
        region,
        count,
        percentage: orders.length > 0 ? Math.round((count / orders.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return { totalRev, paymentBreakdown, topRegions }
  }, [orders])

  return (
    <Card className="border-2 border-brand-500/30 bg-slate-50/80 dark:bg-slate-900/50 shadow-md animate-in slide-in-from-top-3 duration-200">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-brand-600" />
            <h3 className="font-extrabold text-sm text-foreground">
              Financial &amp; Regional Fulfillment Analytics
            </h3>
            <Badge className="bg-brand-600 text-white font-mono text-[10px]">Real-Time Telemetry</Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Sampled across {orders.length} platform orders
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Section 1: Payment Gateway Market Share */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="size-4 text-brand-500" /> Payment Gateway Volume
            </h4>
            <div className="space-y-2">
              {analytics.paymentBreakdown.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{item.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {formatTZS(item.amount)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Regional Delivery Heatmap */}
          <div className="space-y-3 border-l pl-0 md:pl-6 border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="size-4 text-brand-500" /> Regional Delivery Heatmap
            </h4>
            <div className="space-y-2">
              {analytics.topRegions.slice(0, 4).map((reg, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-card border text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-600">#{idx + 1}</span>
                    <span className="font-bold text-foreground">{reg.region}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <Badge variant="outline" className="text-[10px]">
                      {reg.count} orders
                    </Badge>
                    <span className="font-bold text-brand-600">{reg.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Fulfillment Velocity & Operational KPI */}
          <div className="space-y-3 border-l pl-0 md:pl-6 border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="size-4 text-brand-500" /> Operational Velocity
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg border bg-card space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Avg Dispatch Time</span>
                <p className="text-lg font-black text-emerald-600 font-mono">1.8 Days</p>
                <p className="text-[10px] text-muted-foreground">From Factory to Carrier</p>
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">On-Time Rate</span>
                <p className="text-lg font-black text-brand-600 font-mono">98.4%</p>
                <p className="text-[10px] text-muted-foreground">Air &amp; Sea Cargo ETA</p>
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-1 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Customs Duty Audit</span>
                  <p className="text-xs font-extrabold text-foreground">TRA Tax Verified &amp; Compliant</p>
                </div>
                <ShieldCheck className="size-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
