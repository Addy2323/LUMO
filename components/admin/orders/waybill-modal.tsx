'use client'

import { useState } from 'react'
import { Printer, Download, Globe, ShieldCheck, Truck, Package, FileText, CheckCircle2, QrCode } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTZS, formatDate } from '@/lib/format'
import { Order } from '@/lib/mock/orders'
import { toast } from 'sonner'

export function BillOfLadingModal({
  order,
  onClose,
}: {
  order: Order
  onClose: () => void
}) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 200)
  }

  const metrics = order.cargoMetrics || {
    weightKg: 45.0,
    volumeCbm: 0.35,
    portOfLoading: 'Shenzhen Yantian Port (CN)',
    portOfDischarge: 'Dar es Salaam Port (DAR-TZ)',
    customsCode: 'HS-8504.40.00',
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl p-6 border-slate-300 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[92vh]">
        <DialogHeader className="border-b pb-4 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                <Globe className="size-5 text-brand-600" />
                Official Bill of Lading &amp; Air Waybill
              </DialogTitle>
              <Badge variant="outline" className="font-mono text-xs text-brand-600 border-brand-500/30">
                {order.reference}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              International Cargo Clearance &amp; Freight Documentation — Verified Entry
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="h-8 text-xs font-bold">
              <Printer className="size-3.5 mr-1" />
              Print Waybill
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success(`Downloading Waybill PDF for ${order.reference}`)}
              className="h-8 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Download className="size-3.5 mr-1" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Official Printable Bill of Lading Layout */}
        <div className="space-y-5 text-xs text-foreground bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 font-sans">
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b pb-4">
            <div className="space-y-1">
              <span className="font-black text-xl tracking-tight text-brand-600">LUMO B2B CARGO LOGISTICS</span>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Global Sourcing &amp; Customs Freight Clearance Engine
              </p>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Carrier: {order.logistics?.name || 'LUMO Direct Sea & Air Lines'}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="border-2 border-brand-600 p-1.5 rounded-md bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <QrCode className="size-10 text-brand-600" />
              </div>
              <span className="text-[9px] font-mono font-bold text-muted-foreground">VERIFIED-WAYBILL-QR</span>
            </div>
          </div>

          {/* Shipper & Consignee Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="space-y-1 border-r pr-3">
              <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500">1. SHIPPER / EXPORTER</h5>
              <p className="font-bold text-foreground">{order.supplier.name}</p>
              <p className="text-muted-foreground text-[11px]">Industrial Cargo Zone, Overseas Port Hub</p>
              <p className="text-muted-foreground text-[11px]">Port of Loading: <strong className="text-foreground">{metrics.portOfLoading}</strong></p>
            </div>

            <div className="space-y-1 pl-1">
              <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500">2. CONSIGNEE / IMPORTER</h5>
              <p className="font-bold text-foreground">{order.customer.name}</p>
              <p className="text-muted-foreground text-[11px]">{order.shippingAddress.street}, {order.shippingAddress.district}</p>
              <p className="text-muted-foreground text-[11px]">{order.shippingAddress.region}, Tanzania ({order.customer.phone})</p>
              <p className="text-muted-foreground text-[11px]">Port of Discharge: <strong className="text-foreground">{metrics.portOfDischarge}</strong></p>
            </div>
          </div>

          {/* Shipment Metrics Table */}
          <div className="space-y-2">
            <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500">3. CARGO SPECIFICATIONS &amp; HS CODES</h5>
            <table className="w-full text-left text-xs border-collapse border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <th className="p-2 border-b">Waybill Ref</th>
                  <th className="p-2 border-b">Tracking #</th>
                  <th className="p-2 border-b">Customs Code</th>
                  <th className="p-2 border-b text-right">Gross Wt (Kg)</th>
                  <th className="p-2 border-b text-right">Volume (CBM)</th>
                  <th className="p-2 border-b text-center">Shipping Mode</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-mono text-xs">
                  <td className="p-2 font-bold text-brand-600">{order.reference}-WB</td>
                  <td className="p-2">{order.trackingNumber || 'LUMO-TZ-PENDING'}</td>
                  <td className="p-2">{metrics.customsCode}</td>
                  <td className="p-2 text-right font-bold">{metrics.weightKg} kg</td>
                  <td className="p-2 text-right font-bold">{metrics.volumeCbm} m³</td>
                  <td className="p-2 text-center uppercase font-sans font-bold text-[10px]">
                    <Badge variant="secondary">{order.shippingMethod}</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Itemized Manifest Preview */}
          <div className="space-y-2">
            <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500">4. MANIFESTED ITEMS LIST</h5>
            <div className="border rounded-lg p-3 divide-y space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">SKU: {item.sku} · Variant: {item.variantLabel}</p>
                  </div>
                  <div className="text-right font-mono font-bold">
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Authorization Seal */}
          <div className="border-t pt-4 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600" />
              <div>
                <p className="font-bold text-foreground">Customs &amp; Duty Compliant</p>
                <p className="text-[10px]">Pre-inspected by LUMO Global Freight Inspection Authority</p>
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <p className="font-mono font-bold text-foreground">Auth Code: LUMO-CUSTOMS-2026-TZ</p>
              <p className="text-[10px]">Issued Date: {formatDate(order.placedAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
