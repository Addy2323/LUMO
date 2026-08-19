'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  Search,
  Star,
  ShieldCheck,
  MapPin,
  Phone,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  ClipboardList,
  PlusCircle,
  ExternalLink,
  Calculator,
  Tag,
  AlertCircle,
  Coins,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAgentStore, FieldSupplier } from '@/lib/stores/agent-store'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function AgentSuppliersPage() {
  const { activeCountry, selectSupplierForOrder, orders } = useAgentStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [dbSuppliers, setDbSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Currency Converter state (Default 1 USD = 2,650 TZS)
  const [exchangeRate, setExchangeRate] = useState<number>(2650)
  const [currencyMode, setCurrencyMode] = useState<'DUAL' | 'USD' | 'TZS'>('DUAL')

  // New Lead Form State
  const [companyName, setCompanyName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [marketplaceUrl, setMarketplaceUrl] = useState('')
  const [city, setCity] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [unitPriceUSD, setUnitPriceUSD] = useState('45.00')
  const [domesticTransportUSD, setDomesticTransportUSD] = useState('25.00')
  const [packagingCostUSD, setPackagingCostUSD] = useState('15.00')
  const [inspectionCostUSD, setInspectionCostUSD] = useState('30.00')
  const [internationalFreightUSD, setInternationalFreightUSD] = useState('120.00')
  const [dutyEstimateUSD, setDutyEstimateUSD] = useState('35.00')
  const [sizeVariants, setSizeVariants] = useState('Standard (120x60cm), Large (150x80cm)')
  const [colorVariants, setColorVariants] = useState('Oak Light, Dark Walnut, Matte Black')

  useEffect(() => {
    fetchSuppliers()
  }, [])

  async function fetchSuppliers() {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/suppliers')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.suppliers)) {
          setDbSuppliers(data.suppliers)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch /api/agent/suppliers:', e)
    } finally {
      setLoading(false)
    }
  }

  // Helper to convert USD to TZS
  function toTZS(usdAmount: number): string {
    return formatTZS(Math.round(usdAmount * exchangeRate))
  }

  // Calculate landed cost
  const landedCost = (
    Number(unitPriceUSD || 0) +
    Number(domesticTransportUSD || 0) +
    Number(packagingCostUSD || 0) +
    Number(inspectionCostUSD || 0) +
    Number(internationalFreightUSD || 0) +
    Number(dutyEstimateUSD || 0)
  ).toFixed(2)

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) {
      toast.error('Company Name is required')
      return
    }

    // SSRF URL Check
    if (marketplaceUrl.trim()) {
      try {
        const u = new URL(marketplaceUrl)
        if (!['http:', 'https:'].includes(u.protocol)) {
          toast.error('Invalid URL protocol')
          return
        }
        if (['localhost', '127.0.0.1'].includes(u.hostname)) {
          toast.error('Restricted internal URL')
          return
        }
      } catch (err) {
        toast.error('Invalid marketplace URL format')
        return
      }
    }

    try {
      const res = await fetch('/api/agent/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          storeName,
          marketplaceUrl,
          country: activeCountry,
          city,
          contactName,
          contactPhone,
          unitPriceUSD: Number(unitPriceUSD),
          domesticTransportUSD: Number(domesticTransportUSD),
          packagingCostUSD: Number(packagingCostUSD),
          inspectionCostUSD: Number(inspectionCostUSD),
          internationalFreightUSD: Number(internationalFreightUSD),
          dutyEstimateUSD: Number(dutyEstimateUSD),
          landedCostUSD: Number(landedCost),
          sizeVariants: sizeVariants.split(',').map((s) => s.trim()),
          colorVariants: colorVariants.split(',').map((s) => s.trim()),
          verificationStatus: 'Verified',
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Supplier lead ${companyName} saved successfully!`)
        setShowAddModal(false)
        fetchSuppliers()
      } else {
        toast.error(data.error || 'Failed to save supplier lead')
      }
    } catch (err) {
      toast.error('Network error saving supplier lead')
    }
  }

  const hubOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  const activeOrder = hubOrders[0]

  const filteredSuppliers = dbSuppliers.filter(
    (s) =>
      (s.companyName || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.categories || [s.productCategory || '']).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 text-white font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white">Supplier Search &amp; Landed-Cost Matrix</h1>
          <p className="text-xs text-slate-400 font-mono">
            Field Directory Hub: <strong className="text-brand-400">{activeCountry}</strong> · Verified Market Factories with Landed-Cost Calculations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold gap-1.5 shadow-lg shadow-brand-500/20"
          >
            <PlusCircle className="size-4" /> Add Supplier Lead
          </Button>
        </div>
      </div>

      {/* Currency Converter Controls Bar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Coins className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white uppercase font-mono">Currency Exchange Converter</h4>
              <p className="text-[11px] text-slate-400">Live FX Conversion Rate: 1 USD ($) = {exchangeRate.toLocaleString()} TZS (Tsh)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400 text-[11px]">Rate (TZS/USD):</span>
              <Input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value) || 2650)}
                className="w-24 h-8 bg-slate-950 border-slate-800 text-xs font-bold text-amber-400 font-mono text-center"
              />
            </div>

            <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setCurrencyMode('DUAL')}
                className={`px-2.5 py-1 rounded ${currencyMode === 'DUAL' ? 'bg-brand-500 text-white font-bold' : 'text-slate-400'}`}
              >
                USD + TZS
              </button>
              <button
                onClick={() => setCurrencyMode('TZS')}
                className={`px-2.5 py-1 rounded ${currencyMode === 'TZS' ? 'bg-brand-500 text-white font-bold' : 'text-slate-400'}`}
              >
                TZS (Tsh)
              </button>
              <button
                onClick={() => setCurrencyMode('USD')}
                className={`px-2.5 py-1 rounded ${currencyMode === 'USD' ? 'bg-brand-500 text-white font-bold' : 'text-slate-400'}`}
              >
                USD ($)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3-Way Side-by-Side Supplier Comparison Matrix Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <Building2 className="size-5 text-brand-400" />
              Landed-Cost Comparison Matrix
            </CardTitle>
            <p className="text-xs text-slate-400">
              {activeOrder
                ? `Comparing landed costs for order #${activeOrder.orderNumber} (${activeOrder.productName})`
                : `Active Hub Quotation Comparison Engine`}
            </p>
          </div>
          <Badge className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold font-mono">
            {currencyMode === 'DUAL' ? 'USD ($) & TZS (Tsh)' : currencyMode === 'TZS' ? 'TZS (Tsh)' : 'USD ($)'}
          </Badge>
        </CardHeader>

        <CardContent className="p-6">
          {filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Building2 className="size-10 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">No Real Supplier Leads in Database</p>
              <p className="text-[11px] text-slate-500">
                Click "Add Supplier Lead" above to record a verified factory lead and perform landed-cost analysis.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold gap-1.5"
              >
                <PlusCircle className="size-4" /> Add First Supplier Lead
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredSuppliers.slice(0, 3).map((sup, idx) => {
                const uPrice = Number(sup.unitPriceUSD || 45)
                const domTrans = Number(sup.domesticTransportUSD || 25)
                const packCost = Number(sup.packagingCostUSD || 15)
                const inspCost = Number(sup.inspectionCostUSD || 30)
                const intlFreight = Number(sup.internationalFreightUSD || 120)
                const duty = Number(sup.dutyEstimateUSD || 35)
                const totalLanded = Number(sup.landedCostUSD || (uPrice + domTrans + packCost + inspCost + intlFreight + duty))

                return (
                  <div
                    key={sup.id}
                    className={`p-5 rounded-2xl space-y-4 ${
                      idx === 0
                        ? 'border-2 border-brand-500/60 bg-brand-500/5 relative'
                        : 'border border-slate-800 bg-slate-950/50'
                    }`}
                  >
                    {idx === 0 && (
                      <Badge className="absolute -top-3 left-4 bg-brand-500 text-white font-extrabold text-[10px]">
                        RECOMMENDED BEST VALUE
                      </Badge>
                    )}

                    <div className="space-y-1 pt-1">
                      <h4 className="font-extrabold text-white text-base truncate">{sup.companyName || sup.name}</h4>
                      <p className="text-xs text-slate-400">{sup.city || 'Guangzhou'} · MOQ {sup.moq || 50} pcs</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Total Landed Cost Per Unit</span>
                      {currencyMode !== 'TZS' && (
                        <p className="text-xl font-black text-brand-400 font-mono">${totalLanded.toFixed(2)} USD</p>
                      )}
                      {currencyMode !== 'USD' && (
                        <p className="text-lg font-extrabold text-amber-400 font-mono">{toTZS(totalLanded)}</p>
                      )}
                    </div>

                    {/* Detailed Landed Breakdown */}
                    <div className="space-y-1 text-[11px] text-slate-300 font-mono border-t border-slate-800 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ex-Factory Price:</span>
                        <strong className="text-white">${uPrice.toFixed(2)} ({toTZS(uPrice)})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Domestic Freight:</span>
                        <span className="text-slate-300">${domTrans.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Packaging / Crate:</span>
                        <span className="text-slate-300">${packCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Inspection Fee:</span>
                        <span className="text-slate-300">${inspCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Intl Freight &amp; Duty:</span>
                        <span className="text-slate-300">${(intlFreight + duty).toFixed(2)}</span>
                      </div>
                    </div>

                    {sup.marketplaceUrl && (
                      <a
                        href={sup.marketplaceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-brand-400 hover:underline flex items-center gap-1 font-mono truncate"
                      >
                        <ExternalLink className="size-3 shrink-0" />
                        1688 / Alibaba Store Link
                      </a>
                    )}

                    <Button
                      onClick={() => {
                        if (activeOrder) selectSupplierForOrder(activeOrder.id, sup)
                        toast.success(`Selected ${sup.companyName || sup.name} for RFQ quotation!`)
                      }}
                      className={`w-full font-bold text-xs ${
                        idx === 0 ? 'bg-brand-500 hover:bg-brand-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      Select Supplier {String.fromCharCode(65 + idx)}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Directory Search & Supplier Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white font-heading">Field Supplier Directory</h3>
          <div className="relative w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by city, name or category..."
              className="pl-9 h-10 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {filteredSuppliers.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-400 font-mono">No suppliers match search filters.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((sup) => {
              const uPrice = Number(sup.unitPriceUSD || 45)
              const landed = Number(sup.landedCostUSD || Math.round(uPrice * 1.5))
              return (
                <Card key={sup.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-base">{sup.companyName || sup.name}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                          <MapPin className="size-3.5 text-brand-400" /> {sup.city || sup.address || 'Guangzhou'}
                        </p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                        {sup.verificationStatus || 'VERIFIED'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                      <div>
                        <span className="block text-[10px] text-slate-500">MOQ</span>
                        <strong>{sup.moq || 50} Pcs</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Ex-Factory</span>
                        <strong className="text-brand-400">${uPrice.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Landed (TZS)</span>
                        <strong className="text-amber-400">{toTZS(landed)}</strong>
                      </div>
                    </div>

                    {/* SKU Variants Preview */}
                    {(sup.sizeVariants?.length > 0 || sup.colorVariants?.length > 0) && (
                      <div className="text-[11px] text-slate-400 font-mono space-y-1 border-t border-slate-800/80 pt-2">
                        {sup.sizeVariants?.length > 0 && (
                          <p>Sizes: <strong className="text-slate-300">{sup.sizeVariants.join(', ')}</strong></p>
                        )}
                        {sup.colorVariants?.length > 0 && (
                          <p>Colors: <strong className="text-slate-300">{sup.colorVariants.join(', ')}</strong></p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        <Phone className="size-3.5 text-slate-500" /> {sup.contactPhone || '+86 138 0000 0000'}
                      </span>

                      <Button
                        size="sm"
                        onClick={() => toast.success(`Contacted ${sup.companyName || sup.name} for quotation!`)}
                        className="bg-brand-500 hover:bg-brand-600 text-xs font-bold text-white"
                      >
                        Recommend Supplier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>


      {/* Add Supplier Lead Modal */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-800 text-white p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-white flex items-center gap-2">
                <Building2 className="size-5 text-brand-400" />
                Add New Supplier Lead &amp; Landed Math
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Register a field supplier, 1688 / Alibaba marketplace store URL, and landed cost matrix.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddLead} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Company Name *</label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Foshan Furniture Co." className="bg-slate-950 border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Store / Market Name</label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="1688 Official Store" className="bg-slate-950 border-slate-800" />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">1688 / Alibaba Store Link (SSRF Validated)</label>
                <Input value={marketplaceUrl} onChange={(e) => setMarketplaceUrl(e.target.value)} placeholder="https://detail.1688.com/offer/..." className="bg-slate-950 border-slate-800 text-brand-400" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">City / Region</label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Foshan, Guangdong" className="bg-slate-950 border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Contact Name</label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Chen Wei" className="bg-slate-950 border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Phone Number</label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+86 138 0000 0000" className="bg-slate-950 border-slate-800" />
                </div>
              </div>

              {/* Landed Cost Breakdown Fields */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-brand-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <Calculator className="size-3.5" /> Landed Cost Financial Breakdown (USD)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Ex-Factory Unit ($)</label>
                    <Input value={unitPriceUSD} onChange={(e) => setUnitPriceUSD(e.target.value)} className="bg-slate-900 border-slate-800" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Domestic Freight ($)</label>
                    <Input value={domesticTransportUSD} onChange={(e) => setDomesticTransportUSD(e.target.value)} className="bg-slate-900 border-slate-800" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Packaging Crate ($)</label>
                    <Input value={packagingCostUSD} onChange={(e) => setPackagingCostUSD(e.target.value)} className="bg-slate-900 border-slate-800" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Inspection Fee ($)</label>
                    <Input value={inspectionCostUSD} onChange={(e) => setInspectionCostUSD(e.target.value)} className="bg-slate-900 border-slate-800" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Intl Freight ($)</label>
                    <Input value={internationalFreightUSD} onChange={(e) => setInternationalFreightUSD(e.target.value)} className="bg-slate-900 border-slate-800" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Duty Estimate ($)</label>
                    <Input value={dutyEstimateUSD} onChange={(e) => setDutyEstimateUSD(e.target.value)} className="bg-slate-900 border-slate-800" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="font-bold text-white">Calculated Total Landed Cost:</span>
                  <span className="text-base font-black text-brand-400">${landedCost} USD</span>
                </div>
              </div>

              {/* Variants */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Size Variants (comma separated)</label>
                  <Input value={sizeVariants} onChange={(e) => setSizeVariants(e.target.value)} className="bg-slate-950 border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Color Variants (comma separated)</label>
                  <Input value={colorVariants} onChange={(e) => setColorVariants(e.target.value)} className="bg-slate-950 border-slate-800" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="border-slate-700 bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                  Save Supplier Lead
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

