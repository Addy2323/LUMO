'use client'

import { useState } from 'react'
import {
  Truck,
  Package,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  QrCode,
  Download,
  KeyRound,
  FileCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

type ShipmentWaybill = {
  id: string
  waybillNumber: string
  orderNumber: string
  logisticsProvider: string
  origin: string
  destination: string
  status: 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Customs Processing'
  estimatedArrival: string
  customsStatus: string
  deliveryOtp: string
  events: { time: string; title: string; location: string }[]
}

const CUSTOMER_SHIPMENTS: ShipmentWaybill[] = [
  {
    id: 'shp-101',
    waybillNumber: 'WB-TZ-99218',
    orderNumber: 'LUMO-TZ-98201',
    logisticsProvider: 'Supercargo Freight TZ',
    origin: 'Guangzhou Port 🇨🇳',
    destination: 'Dar es Salaam Port 🇹🇿',
    status: 'Out for Delivery',
    estimatedArrival: 'Today at 16:30 EAT',
    customsStatus: 'TRA Customs Cleared (Entry #9921)',
    deliveryOtp: '7492',
    events: [
      { time: 'Today 08:30 AM', title: 'Out for Local Courier Delivery', location: 'Dar es Salaam Hub' },
      { time: 'Yesterday 14:00 PM', title: 'Customs Clearance Verified by TRA', location: 'Bandari Port DAR' },
      { time: '3 Days Ago', title: 'Vessel Arrived at Destination Port', location: 'Dar es Salaam' },
      { time: '10 Days Ago', title: 'Departed Export Hub', location: 'Guangzhou Port' },
    ],
  },
  {
    id: 'shp-102',
    waybillNumber: 'WB-TZ-99219',
    orderNumber: 'LUMO-TZ-98203',
    logisticsProvider: 'DHL Express Tanzania',
    origin: 'Yiwu Cargo Center 🇨🇳',
    destination: 'Mwanza Regional Hub 🇹🇿',
    status: 'In Transit',
    estimatedArrival: '18 August 2026',
    customsStatus: 'Documentation Submitted to TRA',
    deliveryOtp: '3391',
    events: [
      { time: 'Yesterday 10:00 AM', title: 'Departed Air Cargo Hub', location: 'Guangzhou International Air Port' },
      { time: '4 Days Ago', title: 'Origin Quality Inspection Passed', location: 'Yiwu Warehouse' },
    ],
  },
]

export default function CustomerShipmentsPage() {
  const [search, setSearch] = useState('')
  const [selectedWaybill, setSelectedWaybill] = useState<ShipmentWaybill | null>(CUSTOMER_SHIPMENTS[0])
  const [otpInput, setOtpInput] = useState('')
  const [otpModalOpen, setOtpModalOpen] = useState(false)

  function handleVerifyOtp() {
    if (!selectedWaybill) return
    if (otpInput.trim() === selectedWaybill.deliveryOtp) {
      toast.success(`Delivery Confirmed for Waybill ${selectedWaybill.waybillNumber}! Escrow released to supplier.`)
      setOtpModalOpen(false)
      setOtpInput('')
    } else {
      toast.error('Invalid Delivery OTP. Please enter the 4-digit code sent to your phone.')
    }
  }

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Live Cargo Shipments &amp; Waybills</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track real-time ocean/air freight events, view TRA customs clearance status, and verify delivery with your Delivery OTP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search waybill # or order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="space-y-3">
            {CUSTOMER_SHIPMENTS.map((shipment) => (
              <Card
                key={shipment.id}
                onClick={() => setSelectedWaybill(shipment)}
                className={`p-4 cursor-pointer transition-all border ${
                  selectedWaybill?.id === shipment.id
                    ? 'border-[#FF6B00] ring-1 ring-[#FF6B00]/30 bg-[#FF6B00]/5'
                    : 'hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-extrabold text-xs text-[#FF6B00]">
                    {shipment.waybillNumber}
                  </span>
                  <Badge
                    className={`text-[10px] uppercase ${
                      shipment.status === 'Out for Delivery'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {shipment.status}
                  </Badge>
                </div>

                <p className="font-bold text-xs text-foreground">{shipment.orderNumber}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Carrier: <strong>{shipment.logisticsProvider}</strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  ETA: <strong className="text-foreground font-mono">{shipment.estimatedArrival}</strong>
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Selected Shipment Detailed Timeline */}
        {selectedWaybill && (
          <Card className="lg:col-span-2 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold font-mono text-[#FF6B00]">{selectedWaybill.waybillNumber}</h2>
                  <Badge variant="outline" className="font-mono text-xs">
                    {selectedWaybill.orderNumber}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Route: <strong>{selectedWaybill.origin}</strong> → <strong>{selectedWaybill.destination}</strong>
                </p>
              </div>

              <Button
                onClick={() => setOtpModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md"
              >
                <KeyRound className="size-4" /> Verify Delivery OTP ({selectedWaybill.deliveryOtp})
              </Button>
            </div>

            {/* Customs Clearance Banner */}
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                <FileCheck className="size-4 text-blue-600 shrink-0" />
                <span>
                  Customs Status: <strong>{selectedWaybill.customsStatus}</strong>
                </span>
              </div>
            </div>

            {/* Tracking Event Timeline */}
            <div className="space-y-4 pt-2">
              <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider">Live Tracking History</h3>

              <div className="relative pl-6 border-l-2 border-[#FF6B00]/40 space-y-6">
                {selectedWaybill.events.map((evt, idx) => (
                  <div key={idx} className="relative space-y-1 text-xs">
                    <div className="absolute -left-[31px] top-0 size-4 rounded-full bg-[#FF6B00] ring-4 ring-background flex items-center justify-center">
                      <div className="size-1.5 rounded-full bg-white" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{evt.time}</span>
                    <p className="font-bold text-foreground">{evt.title}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3 text-[#FF6B00]" /> {evt.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* OTP Delivery Verification Modal */}
      {otpModalOpen && (
        <Dialog open onOpenChange={setOtpModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                <KeyRound className="size-5 text-emerald-600" /> Confirm Delivery with OTP
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                Enter the 4-digit Delivery OTP sent to your phone to confirm recipient receipt of cargo for Waybill{' '}
                <strong className="text-foreground font-mono">{selectedWaybill?.waybillNumber}</strong>.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Delivery OTP Code</label>
                <Input
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="e.g. 7492"
                  className="font-mono text-center text-lg font-black tracking-widest h-11"
                  maxLength={4}
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setOtpModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleVerifyOtp} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Verify &amp; Confirm Delivery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
