'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Warehouse,
  Package,
  Scale,
  Ruler,
  AlertTriangle,
  Save,
  CheckCircle2,
  ClipboardList,
  PlusCircle,
  QrCode,
  Printer,
  Box,
  RefreshCw,
  Tag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAgentStore, PackageSpecs } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

export default function AgentWarehousePage() {
  const { orders, updatePackaging, activeCountry, seedSampleOrder } = useAgentStore()
  const hubOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  const activeOrder = hubOrders[0]

  const [specs, setSpecs] = useState<PackageSpecs>({
    cartonCount: 12,
    weightKg: 340,
    lengthCm: 120,
    widthCm: 80,
    heightCm: 90,
    packagingType: 'Wooden Crate + Reinforced Straps',
    fragile: true,
    shelfLocation: `${activeCountry.toUpperCase().slice(0, 2)}-BAY-A4`,
  })

  const [shippingMark, setShippingMark] = useState(`LUMO-${activeCountry.toUpperCase().slice(0, 3)}-${activeOrder?.orderNumber || '84920'}-001/012`)
  const [barcodeValue, setBarcodeValue] = useState(`PKG-${activeOrder?.id?.slice(0, 8) || 'W849201'}`)
  const [isSaving, setIsSaving] = useState(false)

  // Calculate Volumetric Weight (CBM & Air Freight Vol. Weight)
  const cbm = ((specs.lengthCm * specs.widthCm * specs.heightCm * specs.cartonCount) / 1000000).toFixed(3)
  const volWeightKg = ((specs.lengthCm * specs.widthCm * specs.heightCm * specs.cartonCount) / 5000).toFixed(1)

  async function handleSavePackaging() {
    if (!activeOrder) return
    setIsSaving(true)

    try {
      // Connect to API
      const res = await fetch('/api/agent/warehouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          orderNumber: activeOrder.orderNumber,
          cartonCount: specs.cartonCount,
          grossWeightKg: specs.weightKg,
          volumetricWeightKg: Number(volWeightKg),
          cbmVolume: Number(cbm),
          dimensionsCm: `${specs.lengthCm}x${specs.widthCm}x${specs.heightCm}`,
          packagingType: specs.packagingType,
          isFragile: specs.fragile,
          shelfLocation: specs.shelfLocation,
          shippingMark,
          barcodeNumber: barcodeValue,
          status: 'Repacked',
        }),
      })

      updatePackaging(activeOrder.id, specs)
      toast.success(`Package specs & Shipping Mark saved for #${activeOrder.orderNumber}!`)
    } catch (e) {
      updatePackaging(activeOrder.id, specs)
      toast.success(`Package specs saved locally for #${activeOrder.orderNumber}!`)
    } finally {
      setIsSaving(false)
    }
  }

  if (!activeOrder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white">Packaging &amp; Warehouse Inventory</h1>
          <p className="text-xs text-slate-400 font-mono">
            Warehouse Location: <strong className="text-brand-400">{activeCountry} Hub Warehouse</strong> · Carton Dimensions &amp; Shelf Tracking
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center space-y-4">
            <div className="size-14 rounded-2xl bg-slate-800 text-emerald-400 mx-auto flex items-center justify-center border border-slate-700">
              <Warehouse className="size-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">No Packages in {activeCountry} Warehouse</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                There are currently no received goods stored in the {activeCountry} Hub Warehouse. Packages will appear here once received from supplier pickup.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                render={
                  <Link href="/agent/orders">
                    <ClipboardList className="size-4 mr-1.5" />
                    View Orders Queue
                  </Link>
                }
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold"
              />
              <Button
                onClick={() => {
                  seedSampleOrder()
                  toast.success(`Created order in ${activeCountry} Hub for warehouse testing.`)
                }}
                variant="outline"
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
              >
                <PlusCircle className="size-4 mr-1.5" />
                Add Test Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading text-white">Packaging &amp; Warehouse Inventory</h1>
        <p className="text-xs text-slate-400 font-mono">
          Warehouse Location: <strong className="text-brand-400">{activeCountry} Warehouse</strong> · Order: <strong className="text-white">#{activeOrder.orderNumber}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Package Dimensions & Weight Recorder */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                <Package className="size-5 text-emerald-400" />
                Carton Specs &amp; Volumetric Math
              </CardTitle>
              <p className="text-xs text-slate-400">Record accurate volumetric weight &amp; CBM for air &amp; sea freight calculation</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
              Ready for Packing
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-bold">Gross Actual Weight (KG)</Label>
                <div className="relative">
                  <Scale className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    value={specs.weightKg || ''}
                    onChange={(e) => setSpecs({ ...specs, weightKg: Number(e.target.value) })}
                    className="pl-9 h-11 bg-slate-950 border-slate-800 text-white font-mono text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-bold">Total Cartons / Crates</Label>
                <Input
                  type="number"
                  value={specs.cartonCount}
                  onChange={(e) => setSpecs({ ...specs, cartonCount: Number(e.target.value) })}
                  className="h-11 bg-slate-950 border-slate-800 text-white font-mono text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-300 font-bold">Carton Dimensions (L × W × H CM per carton)</Label>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  placeholder="Length CM"
                  value={specs.lengthCm || ''}
                  onChange={(e) => setSpecs({ ...specs, lengthCm: Number(e.target.value) })}
                  className="h-11 bg-slate-950 border-slate-800 text-white font-mono text-sm"
                />
                <Input
                  type="number"
                  placeholder="Width CM"
                  value={specs.widthCm || ''}
                  onChange={(e) => setSpecs({ ...specs, widthCm: Number(e.target.value) })}
                  className="h-11 bg-slate-950 border-slate-800 text-white font-mono text-sm"
                />
                <Input
                  type="number"
                  placeholder="Height CM"
                  value={specs.heightCm || ''}
                  onChange={(e) => setSpecs({ ...specs, heightCm: Number(e.target.value) })}
                  className="h-11 bg-slate-950 border-slate-800 text-white font-mono text-sm"
                />
              </div>
            </div>

            {/* Calculated Volumetric Bar */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">Total CBM Volume</span>
                <strong className="text-brand-400 text-base font-black">{cbm} CBM</strong>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">Air Volumetric Weight</span>
                <strong className="text-emerald-400 text-base font-black">{volWeightKg} KG</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-bold">Packaging Type &amp; Reinforcement</Label>
                <Input
                  value={specs.packagingType}
                  onChange={(e) => setSpecs({ ...specs, packagingType: e.target.value })}
                  className="h-11 bg-slate-950 border-slate-800 text-white text-xs font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-bold">Warehouse Bay / Shelf Location</Label>
                <Input
                  value={specs.shelfLocation}
                  onChange={(e) => setSpecs({ ...specs, shelfLocation: e.target.value })}
                  className="h-11 bg-slate-950 border-slate-800 text-brand-400 font-mono text-sm font-bold"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Fragile / Handle With Care</span>
                <span className="text-[10px] text-slate-400">Applies extra bubble wrap &amp; fragile warning labels</span>
              </div>
              <Switch
                checked={specs.fragile}
                onCheckedChange={(checked) => setSpecs({ ...specs, fragile: checked })}
              />
            </div>

            <Button
              onClick={handleSavePackaging}
              disabled={isSaving}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs h-11 shadow-lg shadow-brand-500/20"
            >
              {isSaving ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
              Save Package Details &amp; Generate Shipping Marks
            </Button>
          </CardContent>
        </Card>

        {/* Crate Label & Shipping Mark Generator */}
        <Card className="bg-slate-900 border-slate-800 flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-slate-800">
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <QrCode className="size-5 text-brand-400" />
              Crate Label &amp; Shipping Mark
            </CardTitle>
            <p className="text-xs text-slate-400">Barcodes for port &amp; warehouse scan</p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-950 border border-brand-500/40 space-y-4 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block">OFFICIAL SHIPPING MARK</span>
              <p className="text-lg font-black text-brand-400 font-mono tracking-wider bg-slate-900 p-3 rounded-xl border border-slate-800">
                {shippingMark}
              </p>

              <div className="pt-2 flex flex-col items-center space-y-2">
                <div className="p-4 bg-white rounded-xl shadow-inner inline-block">
                  <QrCode className="size-20 text-slate-950" />
                </div>
                <span className="text-xs font-mono font-bold text-white tracking-widest">{barcodeValue}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Shelf Location:</span>
                <strong className="text-brand-400">{specs.shelfLocation}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Total Weight:</span>
                <strong className="text-white">{specs.weightKg} KG</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Total Volume:</span>
                <strong className="text-white">{cbm} CBM</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Packaging:</span>
                <strong className="text-white">{specs.packagingType}</strong>
              </div>
            </div>

            <Button
              onClick={() => toast.success(`Printing crate barcode label ${barcodeValue}...`)}
              variant="outline"
              className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              <Printer className="size-4 mr-2 text-brand-400" />
              Print Crate Label &amp; Shipping Mark
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

