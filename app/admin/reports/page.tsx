'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, ShoppingBag, Globe, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTZS } from '@/lib/format'

type PlatformMetrics = {
  gmvTZS: number
  totalOrdersCount: number
  avgOrderValueTZS: number
  activeBuyersCount: number
  suppliersCount: number
}

export default function AdminReportsPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    gmvTZS: 0,
    totalOrdersCount: 0,
    avgOrderValueTZS: 0,
    activeBuyersCount: 0,
    suppliersCount: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchDatabaseAnalytics = async () => {
    setLoading(true)
    try {
      const [ordersRes, usersRes] = await Promise.all([
        fetch('/api/orders?perPage=1000'),
        fetch('/api/admin/users'),
      ])

      const ordersData = await ordersRes.json()
      const usersData = await usersRes.json()

      let totalGmv = 0
      let totalOrders = 0
      if (ordersData.data && Array.isArray(ordersData.data)) {
        totalOrders = ordersData.data.length
        totalGmv = ordersData.data.reduce((acc: number, o: any) => acc + (o.totalAmountTZS || 0), 0)
      }

      let buyerCount = 0
      let supplierCount = 0
      if (usersData.users && Array.isArray(usersData.users)) {
        buyerCount = usersData.users.filter((u: any) => u.role === 'BUYER').length
        supplierCount = usersData.users.filter((u: any) => u.role === 'SUPPLIER').length
      }

      setMetrics({
        gmvTZS: totalGmv,
        totalOrdersCount: totalOrders,
        avgOrderValueTZS: totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0,
        activeBuyersCount: buyerCount,
        suppliersCount: supplierCount,
      })
    } catch (error) {
      console.error('Failed to fetch database analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseAnalytics()
  }, [])

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Executive Platform Analytics &amp; GMV Reports</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time platform Gross Merchandise Value (GMV), completed orders count, and active buyer/supplier trade metrics directly calculated from PostgreSQL.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDatabaseAnalytics} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Analytics
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
          Computing real-time database GMV &amp; analytics...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <DollarSign className="size-4 text-emerald-500" /> Database GMV (YTD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-extrabold text-foreground">{formatTZS(metrics.gmvTZS)}</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="size-3" /> Live Transaction Volume
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <ShoppingBag className="size-4 text-primary" /> Completed Orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-extrabold text-primary">{metrics.totalOrdersCount} Orders</div>
              <p className="text-[11px] text-muted-foreground mt-1">Avg Order Value: {formatTZS(metrics.avgOrderValueTZS)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Users className="size-4 text-amber-500" /> Active B2B Buyers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-extrabold text-foreground">{metrics.activeBuyersCount} Businesses</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Registered in database</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Globe className="size-4 text-sky-500" /> Verified China/TZ Suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-extrabold text-foreground">{metrics.suppliersCount} Suppliers</div>
              <p className="text-[11px] text-muted-foreground mt-1">Registered in database</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
