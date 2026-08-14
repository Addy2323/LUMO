'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, Download, TrendingUp, DollarSign, Package, Calendar, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTZS } from '@/lib/format'
import { useSupplierStore } from '@/lib/stores/supplier-store'
import { toast } from 'sonner'

export default function SupplierReportsPage() {
  const { products, orders } = useSupplierStore()

  const totalGrossTZS = orders.reduce((sum, o) => sum + o.totalAmountTZS, 0)
  const totalUnitsSold = orders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0,
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sales &amp; Financial Performance Reports</h1>
          <p className="text-sm text-muted-foreground">
            Analyze gross sales revenue in TZS, unit sales velocity, and inventory turnover metrics.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => toast.success('Generated Executive PDF Performance Statement!')}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
        >
          <Download className="size-4 mr-1" />
          Export PDF Statement
        </Button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border/80">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gross Sales Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-brand-500">{formatTZS(totalGrossTZS)}</div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3 text-emerald-600" />
              +18.4% growth vs previous 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/80">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Units Fulfilled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">{totalUnitsSold} units</div>
            <p className="text-[11px] text-muted-foreground">Across {orders.length} order shipments</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/80">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Catalog Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">{products.length} products</div>
            <p className="text-[11px] text-muted-foreground">
              {products.flatMap((p) => p.variants).length} total SKU variants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold flex items-center gap-2">
            <BarChart3 className="size-5 text-brand-500" />
            Top Selling Product Breakdown
          </CardTitle>
          <CardDescription className="text-xs">Product revenue contribution and current stock position</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-y text-muted-foreground uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3.5">Product Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price Range (TZS)</th>
                <th className="p-3.5">Units In Stock</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const stock = p.variants.reduce((sum, v) => sum + v.stock, 0)
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-bold text-foreground">{p.title}</td>
                    <td className="p-3.5 text-muted-foreground">{p.category}</td>
                    <td className="p-3.5 font-mono font-bold">{formatTZS(p.fromPriceTZS)}</td>
                    <td className="p-3.5 font-mono">{stock} units</td>
                    <td className="p-3.5 text-right">
                      <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
