'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Ship,
  Plane,
  Truck,
  Globe,
  Sparkles,
  CheckCircle2,
  Copy,
  ExternalLink,
  ClipboardList,
  PlusCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAgentStore } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

export default function AgentShipmentsPage() {
  const { orders, createShipment, activeCountry, seedSampleOrder } = useAgentStore()
  const hubOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  const activeOrder = hubOrders[0]

  const [method, setMethod] = useState<'Air Freight' | 'Sea Freight' | 'Express' | 'Courier'>('Air Freight')
  const [carrier, setCarrier] = useState('LUMO Air Express')
  const [trackingNum, setTrackingNum] = useState('')

  function handleCreateShipment() {
    if (!activeOrder) return
    const finalTracking = trackingNum || `LM${activeCountry === 'China' ? 'CN' : activeCountry === 'Dubai' ? 'DXB' : 'TR'}${Math.floor(100000 + Math.random() * 900000)}`
    createShipment(activeOrder.id, method, carrier, finalTracking)
    toast.success(`Shipment created with tracking #${finalTracking}! Customer notified!`)
  }

  function handleGenerateNewTracking() {
    const randomCode = `LM${activeCountry === 'China' ? 'CN' : activeCountry === 'Dubai' ? 'DXB' : 'TR'}${Math.floor(100000 + Math.random() * 900000)}`
    setTrackingNum(randomCode)
    toast.info(`Generated new tracking number: ${randomCode}`)
  }

  if (!activeOrder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white">Shipment Creation &amp; Tracking Generator</h1>
          <p className="text-xs text-slate-400 font-mono">
            Dispatch Origin: <strong className="text-brand-400">{activeCountry} Hub</strong> · Direct International Air &amp; Sea Cargo Dispatch
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center space-y-4">
            <div className="size-14 rounded-2xl bg-slate-800 text-purple-400 mx-auto flex items-center justify-center border border-slate-700">
              <Ship className="size-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">No Shipments Ready for Dispatch in {activeCountry}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                There are currently no packed orders awaiting international dispatch in {activeCountry} Hub. Packed warehouse orders will appear here for carrier assignment.
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
                  toast.success(`Created order in ${activeCountry} Hub for shipment testing.`)
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
        <h1 className="text-2xl font-extrabold font-heading text-white">Shipment Creation &amp; Tracking Generator</h1>
        <p className="text-xs text-slate-400 font-mono">
          Dispatch Origin: <strong className="text-brand-400">{activeCountry} Hub</strong> · Order: <strong className="text-white">#{activeOrder.orderNumber}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Shipment Form */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                <Ship className="size-5 text-purple-400" />
                Dispatch Shipment Wizard
              </CardTitle>
              <p className="text-xs text-slate-400">Assign carrier and issue international tracking reference</p>
            </div>
            <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold font-mono">
              Ready for Dispatch
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold block">Shipping Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'Air Freight', icon: Plane, label: 'Air Freight (5-7 Days)' },
                  { id: 'Sea Freight', icon: Ship, label: 'Sea Freight (24-30 Days)' },
                  { id: 'Express', icon: Sparkles, label: 'LUMO Express' },
                  { id: 'Courier', icon: Truck, label: 'DHL / FedEx' },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setMethod(m.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer text-center space-y-1.5 transition-all ${
                      method === m.id
                        ? 'bg-purple-500/15 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <m.icon className="size-5 mx-auto text-purple-400" />
                    <span className="block text-xs font-bold">{m.id}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold block">Logistics Carrier</label>
              <Select value={carrier} onValueChange={(val) => setCarrier(val || '')}>
                <SelectTrigger className="h-11 bg-slate-950 border-slate-800 text-white text-xs font-bold">
                  <SelectValue placeholder="Select carrier..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="LUMO Air Express">LUMO Air Express ({activeCountry} → Dar es Salaam)</SelectItem>
                  <SelectItem value="LUMO Sea Container Lines">LUMO Sea Freight Lines ({activeCountry} Port → Dar Port)</SelectItem>
                  <SelectItem value="DHL Express International">DHL Express International</SelectItem>
                  <SelectItem value="FedEx Air Cargo">FedEx Air Cargo</SelectItem>
                  <SelectItem value="UPS Worldwide Saver">UPS Worldwide Saver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-bold block">International Tracking Number</label>
                <button
                  onClick={handleGenerateNewTracking}
                  className="text-[10px] text-brand-400 hover:underline font-mono"
                >
                  Auto-Generate New Code
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={trackingNum}
                  onChange={(e) => setTrackingNum(e.target.value)}
                  placeholder="Click auto-generate or enter code..."
                  className="h-11 bg-slate-950 border-slate-800 text-purple-400 font-mono text-base font-black tracking-wider"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!trackingNum) return
                    navigator.clipboard.writeText(trackingNum)
                    toast.success('Tracking number copied!')
                  }}
                  className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleCreateShipment}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs h-11 shadow-lg shadow-purple-600/20"
            >
              <Ship className="size-4 mr-2" />
              Create International Shipment &amp; Notify Customer
            </Button>
          </CardContent>
        </Card>

        {/* Live Shipment Tracking Card */}
        <Card className="bg-slate-900 border-slate-800 flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-slate-800">
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <Globe className="size-5 text-brand-400" />
              Active Tracking Summary
            </CardTitle>
            <p className="text-xs text-slate-400">Real-time status</p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-950 border border-purple-500/40 text-center space-y-2">
              <span className="text-xs text-slate-400 uppercase font-mono">Tracking Reference</span>
              <p className="text-3xl font-black text-purple-400 font-mono tracking-widest">{trackingNum || 'UNASSIGNED'}</p>
              <p className="text-xs text-emerald-400 font-mono">Carrier: {carrier}</p>
            </div>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Departure Hub:</span>
                <strong className="text-white">{activeCountry} Hub</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Destination:</span>
                <strong className="text-white">Dar Es Salaam, Tanzania</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500">Status:</span>
                <strong className="text-brand-400">Ready for Dispatch</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
