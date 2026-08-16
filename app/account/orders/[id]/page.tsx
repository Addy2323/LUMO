'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle2, Truck, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTZS, formatDate, cleanProductTitle } from '@/lib/format'
import { OrderProductThumbnail } from '@/components/account/order-product-thumbnail'

export default function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order || data)
      } else {
        const allRes = await fetch('/api/orders')
        const allData = await allRes.json()
        if (allData.data) {
          const match = allData.data.find((o: any) => o.id === id || o.orderNumber === id)
          if (match) setOrder(match)
        }
      }
    } catch (error) {
      console.error('Failed to fetch customer order detail:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground font-sans">
        <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
        Loading your database order detail...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground font-sans space-y-3">
        <p className="font-extrabold text-foreground text-sm">Order #{id} Not Found</p>
        <Button variant="outline" size="sm" render={<Link href="/account/orders" />} className="font-bold text-xs">
          <ArrowLeft className="size-3.5 mr-1" /> Back to My Orders
        </Button>
      </div>
    )
  }

  const addr = typeof order.shippingAddress === 'object' ? order.shippingAddress : {}

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12 font-sans antialiased text-foreground">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" render={<Link href="/account/orders" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">Order #{order.orderNumber}</h1>
              <Badge className="bg-emerald-600 text-white font-mono text-xs">{order.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-extrabold flex items-center justify-between">
              <span>Ordered Items</span>
              <Badge className="bg-[#FF6B00] text-white font-mono">{formatTZS(order.totalAmountTZS)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any, idx: number) => {
                const title = cleanProductTitle(item.product?.title || item.title || item.productTitle)
                let img = item.product?.imageUrl || item.image || ''
                if (img.startsWith('//')) img = `https:${img}`
                const unitPrice = item.unitPriceTZS || item.price || 0
                const totalPrice = (item.totalPriceTZS !== undefined ? item.totalPriceTZS : unitPrice * item.quantity)

                return (
                  <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20 text-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <OrderProductThumbnail src={img} alt={title} className="size-12 rounded-lg shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground line-clamp-1">{title}</p>
                        <p className="text-muted-foreground text-[11px]">
                          {item.selectedVariant ? `Variant: ${item.selectedVariant} · ` : ''}Qty: <strong className="text-foreground">{item.quantity}</strong> · Unit Price: {formatTZS(unitPrice)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-foreground shrink-0">{formatTZS(totalPrice)}</span>
                  </div>
                )
              })
            ) : (
              <div className="p-4 rounded-lg border bg-muted/20 text-xs font-bold text-foreground">
                Standard Wholesale Order Package
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2">
              <MapPin className="size-4 text-[#FF6B00]" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <p className="font-bold text-foreground">{addr.fullName || addr.name || 'Buyer'}</p>
            <p className="text-muted-foreground">{addr.street || addr.addressLine1 || 'Main Street'}</p>
            <p className="text-muted-foreground">{addr.city || 'Dar es Salaam'}, {addr.country || 'Tanzania'}</p>
            <p className="text-muted-foreground font-mono">Phone: {addr.phone || '+255 700 000 000'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
