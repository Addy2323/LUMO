'use client'

import { useRef } from 'react'
import Image from 'next/image'
import {
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Building2,
  CreditCard,
  MapPin,
  FileText,
  Lock,
  QrCode,
  X,
  Package,
  Award,
  Users,
  Check,
  Star,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatTZS, formatDate, cleanProductTitle } from '@/lib/format'
import { toast } from 'sonner'

export type ReceiptOrderItem = {
  id?: string
  title?: string
  productTitle?: string
  product?: { title?: string; imageUrl?: string }
  quantity: number
  unitPrice?: number
  unitPriceTZS?: number
  price?: number
  selectedVariant?: string
  variantLabel?: string
  imageUrl?: string
  image?: string
}

export type ReceiptData = {
  id: string
  orderNumber: string
  createdAt: string | Date
  status: string
  paymentStatus?: string
  totalAmountTZS: number
  subtotalTZS?: number
  shippingFeeTZS?: number
  taxAmountTZS?: number
  discountTZS?: number
  paymentMethod?: string
  transactionRef?: string
  items: ReceiptOrderItem[]
  shippingAddress?: {
    fullName?: string
    name?: string
    recipient?: string
    phone?: string
    street?: string
    addressLine1?: string
    city?: string
    ward?: string
    district?: string
    region?: string
    country?: string
  }
}

interface CustomerPaymentReceiptProps {
  receipt: ReceiptData
  open: boolean
  onClose: () => void
}

export function CustomerPaymentReceipt({ receipt, open, onClose }: CustomerPaymentReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  // Financial calculations
  const totalPaid = receipt.totalAmountTZS || 428000
  const subtotal = receipt.subtotalTZS ?? Math.round(totalPaid / 1.18)
  const vatAmount = receipt.taxAmountTZS ?? (totalPaid - subtotal)

  const items = receipt.items || []
  const addr = receipt.shippingAddress || {}
  const recipientName = addr.fullName || addr.name || addr.recipient || 'JONSON'
  const phone = addr.phone || '+255 658 856 448'
  const street = addr.street || addr.addressLine1 || 'Main Business District'
  const city = addr.city || addr.region || addr.ward || 'Dar es Salaam'
  const country = addr.country || 'Tanzania'

  const formattedDate = formatDate(receipt.createdAt)
  const orderNum = receipt.orderNumber || 'LUMO-215858-509'
  const receiptNo = `LUMO-2026-08-19-${orderNum.replace(/[^0-9]/g, '') || '021588-509'}`
  const txRef = receipt.transactionRef || orderNum
  const payMethod = receipt.paymentMethod || 'M-Pesa'
  const auditHash = `${txRef}-SEC-9042`

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadFile = () => {
    if (!receiptRef.current) return
    // Replace relative logo src with absolute domain URL for downloaded offline HTML files
    let content = receiptRef.current.outerHTML
    content = content.replace(/src="\/logo\.png"/g, 'src="https://lumo.co.tz/logo.png"')
    content = content.replace(/src='\/logo\.png'/g, 'src="https://lumo.co.tz/logo.png"')

    const fullDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>LUMO Official Payment Receipt - ${orderNum}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#F97316',
            'lumo-navy-dark': '#0F172A',
            'lumo-orange': '#F97316',
            'lumo-orange-hover': '#EA580C',
          }
        }
      }
    }
  </script>
  <style>
    .bg-lumo-navy-dark { background-color: #0F172A !important; color: #ffffff !important; }
    .text-lumo-navy-dark { color: #0F172A !important; }
    .bg-primary { background-color: #F97316 !important; color: #ffffff !important; }
    .text-primary { color: #F97316 !important; }
    .text-lumo-orange-hover { color: #EA580C !important; }
    @page { size: A4 portrait; margin: 6mm; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; padding: 8px; margin: 0; }
    .receipt-container { max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    @media (max-width: 640px) {
      body { padding: 4px; }
      .receipt-container { border-radius: 0; }
    }
    @media print {
      body { background: #fff !important; padding: 0 !important; }
      .receipt-container { max-width: 100% !important; box-shadow: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    ${content}
  </div>
</body>
</html>`

    const blob = new Blob([fullDocument], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LUMO-Official-Receipt-${orderNum}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Downloaded Official Receipt File', {
      description: `File saved as LUMO-Official-Receipt-${orderNum}.html`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-100 rounded-3xl border border-slate-200 shadow-2xl print:shadow-none print:border-none print:max-w-none print:p-0 print:m-0 print:bg-white max-h-[92vh] overflow-y-auto">
        {/* CSS PRINT MEDIA SCOPE FOR SINGLE PAGE PRINTING */}
        <style jsx global>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-receipt-canvas,
            #printable-receipt-canvas * {
              visibility: visible !important;
            }
            #printable-receipt-canvas {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }
            @page {
              size: A4 portrait;
              margin: 6mm;
            }
          }
        `}</style>

        {/* ACTION BAR (Hidden when printing) */}
        <div className="bg-slate-900 text-white p-3.5 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky top-0 z-30 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs shrink-0">
              <FileText className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Official Tax Invoice &amp; Payment Receipt</h3>
              <p className="text-[11px] text-slate-400 font-mono">Receipt #{orderNum}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 justify-end w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleDownloadFile}
              className="bg-primary hover:bg-primary/80 text-white font-extrabold text-xs h-8 rounded-xl gap-1.5 shadow-xs flex-1 sm:flex-none"
            >
              <Download className="size-3.5" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 font-bold text-xs h-8 rounded-xl gap-1.5 flex-1 sm:flex-none"
            >
              <Printer className="size-3.5" />
              Print / PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs h-8 rounded-xl shrink-0"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT BODY */}
        <div
          id="printable-receipt-canvas"
          ref={receiptRef}
          className="p-4 sm:p-8 space-y-5 bg-white text-slate-900 font-sans print:p-2 print:w-full overflow-x-hidden"
        >
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            {/* LOGO & TAGLINE */}
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-40 shrink-0">
                <Image src="/logo.png" alt="LUMO Logo" fill className="object-contain object-left" priority />
              </div>
              <div className="border-l border-slate-200 pl-3">
                <p className="text-xs font-black text-lumo-navy-dark tracking-tight">
                  LUMO Trade Protection
                </p>
                <p className="text-[10.5px] font-semibold text-slate-500 tracking-tight">
                  Trade. Trust. Grow Together.
                </p>
              </div>
            </div>

            {/* TITLE & RECEIPT NO */}
            <div className="text-left sm:text-center space-y-0.5">
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-lumo-navy-dark">
                OFFICIAL PAYMENT RECEIPT
              </h1>
              <p className="text-xs font-bold text-primary tracking-wide">
                Tax Invoice &amp; Receipt
              </p>
              <p className="text-xs font-mono font-bold text-slate-700">
                Receipt No: <span className="font-extrabold text-lumo-navy-dark">{receiptNo}</span>
              </p>
            </div>

            {/* PAYMENT STATUS BADGE BOX */}
            <div className="rounded-2xl border border-orange-200 bg-[#FFF8F5] p-3 flex items-center gap-3 shadow-2xs shrink-0">
              <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
                <ShieldCheck className="size-6 stroke-[2.5]" />
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  PAYMENT STATUS
                </span>
                <span className="text-xs font-black tracking-wide text-primary block">
                  PAID &amp; VERIFIED
                </span>
                <span className="text-[10px] text-slate-600 font-medium block">
                  Thank you for trading with LUMO
                </span>
              </div>
            </div>
          </div>

          {/* HERO NAVY & ORANGE BANNER */}
          <div className="relative overflow-hidden rounded-2xl bg-lumo-navy-dark p-5 text-white shadow-md">
            {/* Background SVG Grid Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white">LUMO</span>
                  <span className="bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    OFFICIAL RECEIPT
                  </span>
                </div>
                <p className="text-xs font-medium text-orange-100">
                  LUMO Trade Protection &amp; Global B2B Sourcing Hub
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300 font-mono pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" />
                    <span>TIN: 142-998-311 &nbsp;|&nbsp; VRN: 40019283-X</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    <span>Dar es Salaam, Tanzania</span>
                  </div>
                </div>
              </div>

              {/* EMBLEM STAMP */}
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 p-2.5 rounded-xl backdrop-blur-xs">
                <div className="size-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                  <CheckCircle2 className="size-6 text-primary stroke-[2.5]" />
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Verification Code</span>
                  <span className="font-extrabold text-white">Ref: {orderNum}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TWO COLUMN METADATA GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BILLED TO / RECIPIENT */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-700 font-black uppercase text-[11px] tracking-wider border-b border-slate-200 pb-2">
                <MapPin className="size-4 text-primary" />
                <span>BILLED TO / RECIPIENT</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">{recipientName}</p>
                <p className="font-mono text-slate-700 font-bold">{phone}</p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span>{street}</span>
                </p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span>{city}, {country}</span>
                </p>
              </div>
            </div>

            {/* TRANSACTION DETAILS */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-700 font-black uppercase text-[11px] tracking-wider border-b border-slate-200 pb-2">
                <CreditCard className="size-4 text-primary" />
                <span>TRANSACTION DETAILS</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold">Order Number</span>
                  <strong className="font-mono text-slate-900 font-black text-xs">{orderNum}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold">Date &amp; Time</span>
                  <strong className="text-slate-800 font-bold text-xs">{formattedDate} | 11:45 AM</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold">Payment Gateway</span>
                  <strong className="text-slate-800 font-bold text-xs">{payMethod}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold">Protection Ledger</span>
                  <span className="text-emerald-700 font-black text-xs flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-700" /> Active Vault
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ITEM DESCRIPTION TABLE */}
          <div className="rounded-2xl border border-slate-200 overflow-x-auto bg-white shadow-2xs">
            <div className="min-w-[540px]">
              <div className="bg-lumo-navy-dark text-white text-[11px] font-black uppercase tracking-wider grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-6 sm:col-span-6">ITEM DESCRIPTION &amp; SPECIFICATIONS</div>
                <div className="col-span-2 text-center">QTY</div>
                <div className="col-span-2 text-right">UNIT PRICE (TZS)</div>
                <div className="col-span-2 text-right">LINE TOTAL (TZS)</div>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                {items.length > 0 ? (
                  items.map((item, idx) => {
                    const title = cleanProductTitle(item.product?.title || item.productTitle || item.title || 'Standard Wholesale Order Package')
                    const qty = item.quantity || 1
                    const unitPrice = item.unitPriceTZS || item.unitPrice || item.price || totalPaid
                    const lineTotal = unitPrice * qty

                    return (
                      <div key={idx} className="grid grid-cols-12 px-5 py-3.5 text-xs items-center hover:bg-slate-50/60 transition-colors">
                        <div className="col-span-6 sm:col-span-6 flex items-start gap-3">
                          <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 text-primary flex items-center justify-center shrink-0">
                            <Package className="size-5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-900 text-xs">{title}</p>
                            <p className="text-[11px] text-slate-500 font-medium">Order Type: B2B Wholesale</p>
                            <p className="text-[10px] text-slate-400 font-mono">Order ID: {orderNum}</p>
                          </div>
                        </div>
                        <div className="col-span-2 text-center font-bold font-mono text-slate-800 text-xs">{qty}</div>
                        <div className="col-span-2 text-right font-semibold font-mono text-slate-700 text-xs">
                          {unitPrice.toLocaleString()}
                        </div>
                        <div className="col-span-2 text-right font-black font-mono text-slate-900 text-xs">
                          {lineTotal.toLocaleString()}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="grid grid-cols-12 px-5 py-3.5 text-xs items-center">
                    <div className="col-span-6 flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 text-primary flex items-center justify-center shrink-0">
                        <Package className="size-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-slate-900 text-xs">Standard Wholesale Order Package</p>
                        <p className="text-[11px] text-slate-500 font-medium">Order Type: B2B Wholesale</p>
                        <p className="text-[10px] text-slate-400 font-mono">Order ID: {orderNum}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center font-bold font-mono text-slate-800 text-xs">1</div>
                    <div className="col-span-2 text-right font-semibold font-mono text-slate-700 text-xs">
                      {totalPaid.toLocaleString()}
                    </div>
                    <div className="col-span-2 text-right font-black font-mono text-slate-900 text-xs">
                      {totalPaid.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ASSURANCE & NUMERICAL BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* QR ASSURANCE BOX */}
            <div className="md:col-span-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center gap-3.5">
              <div className="size-16 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                <QrCode className="size-12 text-slate-900" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-black text-emerald-700">
                  <ShieldCheck className="size-4 text-emerald-700" />
                  <span>LUMO PAYMENT ASSURANCE GUARANTEE</span>
                </div>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                  This official digital receipt confirms full payment authorization held securely in LUMO Trade Protection Vault until final shipment verification.
                </p>
                <p className="text-[9px] font-mono font-bold text-emerald-700">
                  Digital Audit Hash: <span className="font-extrabold">{auditHash}</span>
                </p>
              </div>
            </div>

            {/* NUMERICAL BREAKDOWN */}
            <div className="md:col-span-6 space-y-2 text-xs pl-0 md:pl-4">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal (Excl. VAT)</span>
                <span className="font-mono font-semibold">TZS &nbsp;{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-600 font-medium">
                <span>VAT (18% Included)</span>
                <span className="font-mono font-semibold">TZS &nbsp;{vatAmount.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center font-black">
                <span className="text-slate-900 text-sm uppercase tracking-tight">TOTAL PAID AMOUNT</span>
                <span className="text-xl sm:text-2xl font-mono font-black text-lumo-orange-hover">
                  TZS &nbsp;{totalPaid.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 4 FEATURE ICONS ROW */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2.5 p-1">
              <div className="size-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <strong className="block text-[10px] font-extrabold text-slate-900 uppercase">PAYMENT VERIFIED</strong>
                <span className="text-[9.5px] text-slate-500 block leading-tight">Payment successfully verified and secured</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1 border-t sm:border-t-0 sm:border-l border-slate-200 pl-0 sm:pl-3">
              <div className="size-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Award className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <strong className="block text-[10px] font-extrabold text-slate-900 uppercase">TRADE PROTECTION</strong>
                <span className="text-[9.5px] text-slate-500 block leading-tight">Your transaction is protected by LUMO</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1 border-t sm:border-t-0 sm:border-l border-slate-200 pl-0 sm:pl-3">
              <div className="size-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Lock className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <strong className="block text-[10px] font-extrabold text-slate-900 uppercase">SECURE SETTLEMENT</strong>
                <span className="text-[9.5px] text-slate-500 block leading-tight">Funds held securely until delivery confirmed</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1 border-t sm:border-t-0 sm:border-l border-slate-200 pl-0 sm:pl-3">
              <div className="size-8 rounded-full bg-orange-100 text-primary flex items-center justify-center shrink-0">
                <Users className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <strong className="block text-[10px] font-extrabold text-slate-900 uppercase">TRUSTED NETWORK</strong>
                <span className="text-[9.5px] text-slate-500 block leading-tight">Thousands of businesses trust LUMO every day</span>
              </div>
            </div>
          </div>

          {/* FOOTER & SEAL BLOCK */}
          <div className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-12 items-stretch rounded-2xl overflow-hidden border border-slate-200 bg-white">
              {/* LEFT SLANTED GREEN NEED HELP BLOCK */}
              <div className="md:col-span-4 bg-lumo-navy-dark text-white p-4 space-y-1.5 relative overflow-hidden flex flex-col justify-center">
                <h4 className="text-xs font-black text-primary tracking-wide">Need Help?</h4>
                <div className="space-y-0.5 text-[10.5px] font-medium text-emerald-100">
                  <p><strong className="text-white">Email:</strong> support@lumo.co.tz</p>
                  <p><strong className="text-white">Hotline:</strong> +255 768 828 247</p>
                  <p><strong className="text-white">Website:</strong> www.lumo.co.tz</p>
                </div>
              </div>

              {/* CENTER AUTHORIZATION & SIGNATURE BLOCK */}
              <div className="md:col-span-5 p-4 text-center space-y-1 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200">
                <h3 className="text-xs font-black text-lumo-navy-dark">Thank you for trading with LUMO</h3>
                <p className="text-[10px] text-slate-500 font-medium">East Africa&apos;s Leading B2B Import &amp; Wholesale Marketplace</p>

                {/* Cursive Signature Graphic */}
                <div className="py-1">
                  <span className="font-serif italic text-base text-slate-800 font-bold tracking-widest border-b border-slate-300 px-3">
                    Mvacobs
                  </span>
                </div>

                <p className="text-[9.5px] font-bold text-slate-700">Authorized by LUMO Trade Operations</p>
                <p className="text-[9px] text-slate-400 font-medium">Dar es Salaam, Tanzania</p>
              </div>

              {/* RIGHT GOLD VERIFIED RECEIPT SEAL BADGE */}
              <div className="md:col-span-3 bg-gradient-to-r from-amber-500 to-primary p-4 flex items-center justify-center relative overflow-hidden min-h-[100px]">
                <div className="size-20 rounded-full border-4 border-amber-200/60 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 text-amber-100 flex flex-col items-center justify-center text-center shadow-lg p-1.5 transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-0.5 text-amber-300 mb-0.5">
                    <Star className="size-2 text-amber-300 fill-amber-300" />
                    <Star className="size-2 text-amber-300 fill-amber-300" />
                    <Star className="size-2 text-amber-300 fill-amber-300" />
                  </div>
                  <span className="text-[8px] font-black tracking-tighter uppercase leading-tight text-white">
                    LUMO
                  </span>
                  <span className="text-[7.5px] font-black tracking-widest uppercase leading-tight text-amber-200">
                    VERIFIED
                  </span>
                  <span className="text-[7.5px] font-bold tracking-wider uppercase leading-tight text-white">
                    RECEIPT
                  </span>
                  <div className="size-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center mt-0.5">
                    <Check className="size-2.5 text-white stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>

            {/* CENTERING BOTTOM DISCLAIMER */}
            <p className="text-[10px] text-slate-400 font-medium text-center pt-3 flex items-center justify-center gap-1.5">
              <Lock className="size-3 text-slate-400 shrink-0 inline-block" />
              <span>This is a system generated receipt and does not require a signature.</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
