'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Search, Clock, CheckCircle2, Truck, AlertCircle, ArrowRight, RefreshCw, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS, formatDate, cleanProductTitle } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'
import { OrderProductThumbnail } from '@/components/account/order-product-thumbnail'
import { CustomerPaymentReceipt } from '@/components/receipt/customer-payment-receipt'

type DatabaseOrder = {
  id: string
  orderNumber: string
  status: string
  totalAmountTZS: number
  createdAt: string
  items?: any[]
}

export default function CustomerOrdersPage() {
  const user = useSessionStore((s) => s.user)
  const [orders, setOrders] = useState<DatabaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null)

  const fetchCustomerOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.data)) {
          setOrders(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch PostgreSQL customer orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomerOrders()

    if (typeof window !== 'undefined') {
      window.addEventListener('lumo_orders_updated', fetchCustomerOrders)
      return () => {
        window.removeEventListener('lumo_orders_updated', fetchCustomerOrders)
      }
    }
  }, [user])

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    return q === '' || o.orderNumber.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Database Orders</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track your live B2B wholesale orders, status updates, and digital invoices.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCustomerOrders} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Orders
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Package className="size-5 text-primary" /> Order History ({filtered.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search order #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y border-t">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                Loading your database orders...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">No orders found in database.</p>
                <p>Your B2B purchases will appear here upon checkout.</p>
                <Button size="sm" render={<Link href="/marketplace" />} className="bg-primary text-white font-bold text-xs mt-2">
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              filtered.map((o) => {
                const itemsList = o.items || []
                const totalItemsCount = itemsList.length
                const totalUnitsCount = itemsList.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
                
                // Sort items so the primary (highest value) item is displayed as main title & thumbnail
                const sortedItems = [...itemsList].sort((a: any, b: any) => {
                  const valA = (a.unitPriceTZS || a.price || 0) * (a.quantity || 1)
                  const valB = (b.unitPriceTZS || b.price || 0) * (b.quantity || 1)
                  return valB - valA
                })

                const primaryItem = sortedItems[0]
                const rawTitle = primaryItem?.product?.title || primaryItem?.title || primaryItem?.productTitle || 'Wholesale B2B Goods'
                const itemTitle = cleanProductTitle(rawTitle)
                
                let primaryImg = primaryItem?.product?.imageUrl || primaryItem?.image || ''
                if (primaryImg.startsWith('//')) primaryImg = `https:${primaryImg}`

                return (
                  <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 text-xs">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Multi-Thumbnail Preview for Multi-Item Orders */}
                      <div className="flex items-center shrink-0">
                        {sortedItems.length > 1 ? (
                          <div className="flex -space-x-4 items-center">
                            {sortedItems.slice(0, 2).map((it: any, idx: number) => {
                              let img = it.product?.imageUrl || it.image || ''
                              if (img.startsWith('//')) img = `https:${img}`
                              return (
                                <OrderProductThumbnail
                                  key={it.id || idx}
                                  src={img}
                                  alt={cleanProductTitle(it.product?.title || it.title)}
                                  className={`size-11 rounded-lg border-2 border-white shadow-xs ${idx > 0 ? 'z-10' : 'z-20'}`}
                                />
                              )
                            })}
                          </div>
                        ) : (
                          <OrderProductThumbnail src={primaryImg} alt={itemTitle} className="size-11 rounded-lg" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-foreground">ORDER #{o.orderNumber}</span>
                          <Badge className={['DELIVERED', 'PAID'].includes(o.status) ? 'bg-emerald-600 text-white text-[10px]' : 'bg-amber-500 text-white text-[10px]'}>
                            {o.status}
                          </Badge>
                          {totalItemsCount > 1 && (
                            <Badge variant="outline" className="bg-orange-50 text-primary border-orange-200 text-[10px] font-bold">
                              + {totalItemsCount - 1} more item{totalItemsCount - 1 > 1 ? 's' : ''} ({totalUnitsCount} units total)
                            </Badge>
                          )}
                        </div>

                        <p className="text-foreground font-semibold text-xs line-clamp-1">{itemTitle}</p>
                        
                        {totalItemsCount > 1 && sortedItems[1] && (
                          <p className="text-muted-foreground text-[11px] line-clamp-1 italic">
                            Also includes: {cleanProductTitle(sortedItems[1].product?.title || sortedItems[1].title)} (x{sortedItems[1].quantity || 1})
                          </p>
                        )}

                        <p className="text-muted-foreground text-[11px]">Placed on {formatDate(o.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-extrabold text-primary text-sm">{formatTZS(o.totalAmountTZS)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReceiptOrder(o)}
                        className="font-extrabold text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8"
                      >
                        <FileText className="size-3.5 mr-1 text-emerald-600" /> Receipt
                      </Button>
                      <Button variant="outline" size="sm" render={<Link href={`/account/orders/${o.id}`} />} className="font-bold text-xs h-8">
                        View Detail <ArrowRight className="size-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* RECEIPT MODAL */}
      {selectedReceiptOrder && (
        <CustomerPaymentReceipt
          open={!!selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          receipt={{
            id: selectedReceiptOrder.id,
            orderNumber: selectedReceiptOrder.orderNumber,
            createdAt: selectedReceiptOrder.createdAt,
            status: selectedReceiptOrder.status,
            totalAmountTZS: selectedReceiptOrder.totalAmountTZS,
            paymentMethod: selectedReceiptOrder.paymentMethod || 'LUMO Pay Gateway',
            transactionRef: `AZM-${selectedReceiptOrder.orderNumber}`,
            items: selectedReceiptOrder.items || [],
            shippingAddress: typeof selectedReceiptOrder.shippingAddress === 'object' ? selectedReceiptOrder.shippingAddress : {},
          }}
        />
      )}
    </div>
  )
}
