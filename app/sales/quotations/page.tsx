'use client'

import { useState } from 'react'
import { Calculator, DollarSign, Send, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function SalesQuotationsPage() {
  const [exchangeRateUSD, setExchangeRateUSD] = useState(2620)
  const [productCostUSD, setProductCostUSD] = useState(4500)
  const [freightCostUSD, setFreightCostUSD] = useState(850)
  const [customsDutyPercent, setCustomsDutyPercent] = useState(15)
  const [platformFeePercent, setPlatformFeePercent] = useState(5)

  // Landed Cost Calculations
  const productCostTZS = productCostUSD * exchangeRateUSD
  const freightCostTZS = freightCostUSD * exchangeRateUSD
  const customsDutyTZS = ((productCostTZS + freightCostTZS) * customsDutyPercent) / 100
  const subtotalTZS = productCostTZS + freightCostTZS + customsDutyTZS
  const platformFeeTZS = (subtotalTZS * platformFeePercent) / 100
  const totalLandedCostTZS = subtotalTZS + platformFeeTZS

  function handleSendQuotation() {
    toast.success(`Formal Landed TZS Quotation of ${formatTZS(totalLandedCostTZS)} dispatched to Buyer!`)
  }

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Landed Cost Quotation Calculator</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build itemized B2B landed quotes including FOB product cost, ocean/air freight, TRA customs duty, and platform fees.
          </p>
        </div>

        <Button onClick={handleSendQuotation} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
          <Send className="size-4" /> Issue Customer-Facing Quotation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calculator Controls */}
        <Card className="p-6 space-y-4 text-xs">
          <h2 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <Calculator className="size-4 text-[#FF6B00]" /> Quotation Input Parameters
          </h2>

          <div className="space-y-1">
            <label className="font-bold text-foreground">Exchange Rate (USD → TZS)</label>
            <Input
              type="number"
              value={exchangeRateUSD}
              onChange={(e) => setExchangeRateUSD(Number(e.target.value))}
              className="font-mono text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-foreground">FOB Product Cost ($ USD)</label>
            <Input
              type="number"
              value={productCostUSD}
              onChange={(e) => setProductCostUSD(Number(e.target.value))}
              className="font-mono text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-foreground">International Freight Cost ($ USD)</label>
            <Input
              type="number"
              value={freightCostUSD}
              onChange={(e) => setFreightCostUSD(Number(e.target.value))}
              className="font-mono text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-foreground">Estimated TRA Customs &amp; Tariff Duty (%)</label>
            <Input
              type="number"
              value={customsDutyPercent}
              onChange={(e) => setCustomsDutyPercent(Number(e.target.value))}
              className="font-mono text-xs h-9"
            />
          </div>
        </Card>

        {/* Landed Cost Itemized Output */}
        <Card className="p-6 space-y-4 text-xs bg-muted/20 border-l-4 border-l-[#FF6B00]">
          <h2 className="font-extrabold text-sm text-foreground flex items-center justify-between">
            <span>Landed Cost Itemized Breakdown</span>
            <Badge className="bg-[#FF6B00] text-white font-mono">TZS Currency</Badge>
          </h2>

          <div className="space-y-2.5 divide-y font-mono">
            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">FOB Factory Product Price:</span>
              <strong className="text-foreground">{formatTZS(productCostTZS)}</strong>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Ocean / Air Freight Shipping:</span>
              <strong className="text-foreground">{formatTZS(freightCostTZS)}</strong>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">TRA Customs Duty &amp; Taxes ({customsDutyPercent}%):</span>
              <strong className="text-foreground">{formatTZS(customsDutyTZS)}</strong>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Lumo Service Fee ({platformFeePercent}%):</span>
              <strong className="text-foreground">{formatTZS(platformFeeTZS)}</strong>
            </div>

            <div className="flex justify-between pt-3 text-sm font-extrabold text-[#FF6B00]">
              <span>TOTAL LANDED COST (TZS):</span>
              <span>{formatTZS(totalLandedCostTZS)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
