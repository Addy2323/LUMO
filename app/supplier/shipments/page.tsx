'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Building2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/format'
import { useSupplierStore, SupplierShipment } from '@/lib/stores/supplier-store'
import { toast } from 'sonner'

export default function SupplierShipmentsPage() {
  const { shipments, updateShipmentStatus, addShipment } = useSupplierStore()
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // New Shipment Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [orderNumber, setOrderNumber] = useState('LUMO-SUP-905')
  const [destination, setDestination] = useState('Mwanza Distribution Hub')
  const [carrier, setCarrier] = useState('Supercargo Freight TZ')
  const [trackingCode, setTrackingCode] = useState('TZ-EXP-77291')
  const [packagesCount, setPackagesCount] = useState(2)

  const filteredShipments = shipments.filter((s) => {
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus
    const query = search.toLowerCase()
    const matchesSearch =
      query === '' ||
      s.shipmentRef.toLowerCase().includes(query) ||
      s.orderNumber.toLowerCase().includes(query) ||
      s.carrier.toLowerCase().includes(query) ||
      s.trackingCode.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })

  function handleCreateShipment() {
    if (!orderNumber || !trackingCode) {
      toast.error('Order number and tracking code required')
      return
    }

    addShipment({
      shipmentRef: `SHP-TZ-${Math.floor(4000 + Math.random() * 5000)}`,
      orderNumber,
      destination,
      carrier,
      trackingCode,
      packagesCount,
      status: 'in_transit',
      dispatchedAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    })

    toast.success('Outbound shipment manifest created!')
    setIsModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Outbound Cargo &amp; Shipments</h1>
          <p className="text-sm text-muted-foreground">
            Track carrier handoffs, airway bills, estimated arrival dates, and logistics partner metrics.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
          <Plus className="size-4 mr-1" />
          Create Shipment Manifest
        </Button>
      </div>

      {/* Shipment Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border/80">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">In-Transit Freight</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-extrabold text-info">
              {shipments.filter((s) => s.status === 'in_transit').length}
            </div>
            <Truck className="size-6 text-info/40" />
          </CardContent>
        </Card>

        <Card className="bg-card border-border/80">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivered to Hub</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-extrabold text-emerald-600">
              {shipments.filter((s) => s.status === 'delivered').length}
            </div>
            <CheckCircle2 className="size-6 text-emerald-600/40" />
          </CardContent>
        </Card>

        <Card className="bg-card border-border/80">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Carriers</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-extrabold text-foreground">
              {new Set(shipments.map((s) => s.carrier)).size}
            </div>
            <Building2 className="size-6 text-muted-foreground/40" />
          </CardContent>
        </Card>
      </div>

      {/* Shipment Manifest List */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'in_transit', 'delivered'].map((st) => (
              <Button
                key={st}
                variant={selectedStatus === st ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(st)}
                className="text-xs capitalize font-bold"
              >
                {st.replace('_', ' ')}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search reference or tracking code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y border-t border-border">
            {filteredShipments.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No active shipments matching your filter.</div>
            ) : (
              filteredShipments.map((s) => (
                <div key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-brand-500 text-sm">{s.shipmentRef}</span>
                      <Badge
                        className={`text-[10px] uppercase font-bold ${
                          s.status === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-info text-white'
                        }`}
                      >
                        {s.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">Order: {s.orderNumber}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1 text-foreground font-semibold">
                        <Truck className="size-3.5 text-brand-500" />
                        {s.carrier}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono font-bold text-foreground">
                        Waybill: {s.trackingCode}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        {s.destination}
                      </span>
                    </div>

                    <span className="text-[11px] text-muted-foreground">
                      Dispatched: {formatDate(s.dispatchedAt)} · Packages: <strong>{s.packagesCount} carton(s)</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {s.status !== 'delivered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          updateShipmentStatus(s.id, 'delivered')
                          toast.success(`Shipment ${s.shipmentRef} marked as DELIVERED!`)
                        }}
                        className="text-xs font-bold text-emerald-600 border-emerald-500/30"
                      >
                        <CheckCircle2 className="size-3.5 mr-1" />
                        Mark Hub Arrival
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.info(`Carrier live portal tracking: ${s.trackingCode}`)}
                      className="text-xs text-brand-500 font-semibold"
                    >
                      <ExternalLink className="size-3.5 mr-1" />
                      Carrier Live GPS
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Shipment Modal */}
      {isModalOpen && (
        <Dialog open onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">Generate Dispatch Manifest</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground">Order Reference #</label>
                <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="font-mono text-xs h-9" />
              </div>

              <div>
                <label className="font-bold text-foreground">Destination Logistics Hub</label>
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} className="text-xs h-9" />
              </div>

              <div>
                <label className="font-bold text-foreground">Logistics Carrier Partner</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none"
                >
                  <option value="Supercargo Freight TZ">Supercargo Freight TZ</option>
                  <option value="Lumo Express Cargo">Lumo Express Cargo</option>
                  <option value="DHL Express Tanzania">DHL Express Tanzania</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground">Waybill Tracking Code</label>
                  <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} className="font-mono text-xs h-9" />
                </div>
                <div>
                  <label className="font-bold text-foreground">Package Cartons</label>
                  <Input
                    type="number"
                    value={packagesCount}
                    onChange={(e) => setPackagesCount(Number(e.target.value))}
                    className="font-mono text-xs h-9"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateShipment} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                Create Manifest
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
