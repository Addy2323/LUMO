'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Barcode,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTZS, formatDate } from '@/lib/format'
import { toast } from 'sonner'

export default function LogisticsShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchDatabaseOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order || data)
      } else {
        // Fallback search across all orders
        const allRes = await fetch('/api/orders')
        const allData = await allRes.json()
        if (allData.data) {
          const match = allData.data.find((o: any) => o.id === id || o.orderNumber === id)
          if (match) setOrder(match)
        }
      }
    } catch (error) {
      console.error('Failed to fetch database shipment detail:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseOrder()
  }, [id])

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground font-sans">
        <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
        Loading live database shipment manifest...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground font-sans space-y-3">
        <p className="font-extrabold text-foreground text-sm">Shipment Manifest #{id} Not Found</p>
        <p>This order or electronic waybill does not exist in the PostgreSQL database.</p>
        <Button variant="outline" size="sm" render={<Link href="/logistics/shipments" />} className="font-bold text-xs">
          <ArrowLeft className="size-3.5 mr-1" /> Back to Shipments Queue
        </Button>
      </div>
    )
  }

  const addr = typeof order.shippingAddress === 'object' ? order.shippingAddress : {}

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 font-sans antialiased text-foreground">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" render={<Link href="/logistics/shipments" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">Electronic Waybill &amp; Manifest</h1>
              <Badge className="bg-emerald-600 text-white font-mono text-xs">ORDER #{order.orderNumber}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Database Manifest ID: {order.id}</p>
          </div>
        </div>

        <Button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9">
          <Printer className="size-3.5 mr-1.5" /> Print Official Waybill
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-extrabold flex items-center justify-between">
              <span>Cargo Line Items ({order.items?.length || 1})</span>
              <Badge className="bg-[#FF6B00] text-white font-mono">{formatTZS(order.totalAmountTZS)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
                  <div>
                    <p className="font-bold text-foreground">{item.productTitle || item.title || 'Cargo Item'}</p>
                    <p className="text-muted-foreground">Qty: {item.quantity} · Price: {formatTZS(item.unitPriceTZS || item.price || 0)}</p>
                  </div>
                  <span className="font-mono font-bold text-foreground">{formatTZS((item.unitPriceTZS || item.price || 0) * item.quantity)}</span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-lg border bg-muted/20 text-xs font-bold text-foreground">
                Consolidated Cargo Manifest Shipment Package
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2">
              <MapPin className="size-4 text-[#FF6B00]" /> Delivery Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <p className="font-bold text-foreground">{addr.fullName || addr.name || 'Consignee'}</p>
            <p className="text-muted-foreground">{addr.street || addr.addressLine1 || 'Main Cargo Terminal'}</p>
            <p className="text-muted-foreground">{addr.city || 'Dar es Salaam'}, {addr.country || 'Tanzania'}</p>
            <p className="text-muted-foreground font-mono">Phone: {addr.phone || '+255 700 000 000'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
