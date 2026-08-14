'use client'

import { useState } from 'react'
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
    cartonCount: 1,
    weightKg: 0,
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
    packagingType: 'Standard Carton Box',
    fragile: false,
    shelfLocation: 'Unassigned Shelf',
  })

  function handleSavePackaging() {
    if (!activeOrder) return
    updatePackaging(activeOrder.id, specs)
    toast.success(`Package specs saved for order #${activeOrder.orderNumber}!`)
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
                Carton Dimensions &amp; Weight Specification
              </CardTitle>
              <p className="text-xs text-slate-400">Record accurate volumetric weight for air &amp; sea freight calculation</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
              Ready for Packing
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-bold">Gross Weight (KG)</Label>
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
                <Label className="text-xs text-slate-300 font-bold">Total Cartons</Label>
                <Input
                  type="number"
                  value={specs.cartonCount}
                  onChange={(e) => setSpecs({ ...specs, cartonCount: Number(e.target.value) })}
                  className="h-11 bg-slate-950 border-slate-800 text-white font-mono text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-300 font-bold">Carton Dimensions (L × W × H CM)</Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-bold">Packaging Type</Label>
                <Input
                  value={specs.packagingType}
                  onChange={(e) => setSpecs({ ...specs, packagingType: e.target.value })}
                  className="h-11 bg-slate-950 border-slate-800 text-white text-xs font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-bold">Warehouse Shelf Location</Label>
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
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs h-11 shadow-lg shadow-brand-500/20"
            >
              <Save className="size-4 mr-2" />
              Save Package Details &amp; Assign Shelf Location
            </Button>
          </CardContent>
        </Card>

        {/* Shelf Summary Card */}
        <Card className="bg-slate-900 border-slate-800 flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-slate-800">
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <Warehouse className="size-5 text-brand-400" />
              Warehouse Storage Location
            </CardTitle>
            <p className="text-xs text-slate-400">Current shelf tracking</p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-950 border border-brand-500/40 text-center space-y-2">
              <span className="text-xs text-slate-400 uppercase font-mono">Assigned Shelf</span>
              <p className="text-4xl font-black text-brand-400 font-mono tracking-wider">{specs.shelfLocation}</p>
              <p className="text-xs text-emerald-400 font-mono">Verified in {activeCountry} Hub</p>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Gross Weight:</span>
                <strong className="text-white">{specs.weightKg} KG</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Volumetric Size:</span>
                <strong className="text-white">{specs.lengthCm} × {specs.widthCm} × {specs.heightCm} CM</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Packaging Type:</span>
                <strong className="text-white">{specs.packagingType}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Fragile Status:</span>
                <strong className={specs.fragile ? 'text-amber-400' : 'text-slate-400'}>
                  {specs.fragile ? 'YES (FRAGILE)' : 'NO'}
                </strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
