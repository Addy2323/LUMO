'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  PackageCheck,
  Save,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateLandedCost, CurrencyCode } from '@/lib/catalog/currency'
import { formatTZS } from '@/lib/format'

type PageParams = {
  id: string
}

export default function ProductDetailEditorPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params)
  const productId = resolvedParams.id

  // Form State
  const [title, setTitle] = useState('Pro ANC Wireless Headphones 40h Battery')
  const [productCode, setProductCode] = useState('LUMO-EL-000001')
  const [shortDesc, setShortDesc] = useState('Noise cancelling over-ear Bluetooth headphones with 40h battery.')
  const [fullDesc, setFullDesc] = useState(
    'Active noise cancelling Bluetooth over-ear headphones with 40-hour battery life, dual microphone for crystal clear calls, and Type-C fast charging.',
  )
  const [category, setCategory] = useState('Electronics')
  const [subcategory, setSubcategory] = useState('Audio & Headphones')
  const [brand, setBrand] = useState('LUMO Audio')
  const [sku, setSku] = useState('SKU-ELE-001')

  // Pricing State
  const [supplierCost, setSupplierCost] = useState(25.0)
  const [supplierCurrency, setSupplierCurrency] = useState<CurrencyCode>('USD')
  const [weightKg, setWeightKg] = useState(0.35)
  const [marginPercent, setMarginPercent] = useState(25)
  const [moq, setMoq] = useState(10)
  const [stock, setStock] = useState(200)

  // Landed Cost Computed
  const landed = calculateLandedCost({
    supplierCost,
    currency: supplierCurrency,
    weightKg,
    marginPercent,
  })

  // Specs
  const [material, setMaterial] = useState('ABS Plastic & Memory Foam')
  const [color, setColor] = useState('Matte Black')
  const [size, setSize] = useState('Standard Over-Ear')
  const [lengthCm, setLengthCm] = useState(20)
  const [widthCm, setWidthCm] = useState(18)
  const [heightCm, setHeightCm] = useState(8)

  // Media
  const [primaryImage, setPrimaryImage] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800')

  // Source & Lifecycle
  const [status, setStatus] = useState<'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED'>('APPROVED')
  const [country, setCountry] = useState('China')
  const [sourcePlatform, setSourcePlatform] = useState('Yiwu Market')
  const [savedSuccess, setSavedSuccess] = useState(false)

  function handleSave() {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/admin/catalog/products" />}>
            <ArrowLeft className="size-4 mr-1" /> Back to Products
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              <Badge variant="outline" className="font-mono text-xs text-brand-600">
                {productCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Product Detail Editor & Landed Cost Estimator</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs text-success-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="size-4" /> Saved!
            </span>
          )}

          <Button variant="outline" size="sm" className="text-xs" onClick={() => setStatus('DRAFT')}>
            Unpublish
          </Button>

          <Button
            size="sm"
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1.5"
            onClick={handleSave}
          >
            <Save className="size-3.5" /> Save Changes
          </Button>

          {status !== 'PUBLISHED' && (
            <Button
              size="sm"
              className="bg-success-600 hover:bg-success-700 text-white text-xs gap-1.5"
              onClick={() => {
                setStatus('PUBLISHED')
                handleSave()
              }}
            >
              <CheckCircle2 className="size-3.5" /> Publish to Marketplace
            </Button>
          )}
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid grid-cols-5 w-full bg-muted/60 text-xs">
          <TabsTrigger value="basic" className="gap-1.5">
            <FileText className="size-3.5" /> Basic Info
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5">
            <Calculator className="size-3.5" /> Landed Cost & Price
          </TabsTrigger>
          <TabsTrigger value="specs" className="gap-1.5">
            <Tag className="size-3.5" /> Specs & Dimensions
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5">
            <ImageIcon className="size-3.5" /> Media & Gallery
          </TabsTrigger>
          <TabsTrigger value="source" className="gap-1.5">
            <Globe className="size-3.5" /> Sourcing Metadata
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Info */}
        <TabsContent value="basic" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Product Classification & Descriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Product Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">LUMO Product Code</label>
                  <Input value={productCode} onChange={(e) => setProductCode(e.target.value)} className="font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Men's Fashion">Men's Fashion</option>
                    <option value="Women's Fashion">Women's Fashion</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Beauty & Accessories">Beauty & Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Subcategory</label>
                  <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Brand Name</label>
                  <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Short Excerpt (Catalog Card)</label>
                <Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
              </div>

              <div>
                <label className="font-semibold block mb-1">Full Detailed Description</label>
                <textarea
                  rows={4}
                  value={fullDesc}
                  onChange={(e) => setFullDesc(e.target.value)}
                  className="w-full p-2.5 border rounded-md bg-background text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Pricing & Landed Cost Breakdown */}
        <TabsContent value="pricing" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calculator className="size-4 text-brand-600" />
                  Supplier Cost & FX Inputs
                </CardTitle>
                <CardDescription className="text-xs">
                  Separates supplier factory price from final LUMO marketplace price.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Supplier Factory Cost</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={supplierCost}
                      onChange={(e) => setSupplierCost(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Factory Currency</label>
                    <select
                      value={supplierCurrency}
                      onChange={(e) => setSupplierCurrency(e.target.value as CurrencyCode)}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="CNY">CNY (¥)</option>
                      <option value="AED">AED (AED)</option>
                      <option value="TRY">TRY (₺)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Item Weight (kg)</label>
                    <Input
                      type="number"
                      step="0.05"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.1)}
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">LUMO Target Margin (%)</label>
                    <Input
                      type="number"
                      value={marginPercent}
                      onChange={(e) => setMarginPercent(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-semibold block mb-1">Minimum Order Qty (MOQ)</label>
                    <Input type="number" value={moq} onChange={(e) => setMoq(parseInt(e.target.value) || 1)} />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Available Stock</label>
                    <Input type="number" value={stock} onChange={(e) => setStock(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Landed Cost Card */}
            <Card className="bg-brand-50/40 border-brand-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-brand-900 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-brand-600" />
                  Calculated Landed Cost Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated cost, freight, customs, and retail price calculation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-brand-200/60">
                  <span className="text-muted-foreground">Original Supplier Cost:</span>
                  <span className="font-mono font-bold">
                    {supplierCurrency} {supplierCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-200/60">
                  <span className="text-muted-foreground">Applied FX Rate ({supplierCurrency} → TZS):</span>
                  <span className="font-mono font-semibold">{landed.fxRateUsed} TZS</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-200/60">
                  <span className="text-muted-foreground">Supplier Cost in TZS:</span>
                  <span className="font-mono font-bold">{formatTZS(landed.supplierCostTZS)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-200/60">
                  <span className="text-muted-foreground">Air Freight (Dar es Salaam):</span>
                  <span className="font-mono text-muted-foreground">{formatTZS(landed.estimatedFreightTZS)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-200/60">
                  <span className="text-muted-foreground">Customs Duty & Tariffs (15%):</span>
                  <span className="font-mono text-muted-foreground">{formatTZS(landed.estimatedCustomsTZS)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-200/60">
                  <span className="text-muted-foreground">LUMO Platform Margin ({marginPercent}%):</span>
                  <span className="font-mono text-success-700 font-bold">{formatTZS(landed.lumoMarginTZS)}</span>
                </div>
                <div className="flex justify-between py-2 pt-3 border-t-2 border-brand-300">
                  <span className="font-bold text-foreground text-sm">Final Selling Price (TZS):</span>
                  <span className="font-mono font-extrabold text-brand-700 text-base">
                    {formatTZS(landed.finalSellingPriceTZS)}
                  </span>
                </div>
                <div className="text-right font-mono text-[11px] text-muted-foreground">
                  (Approx. ${landed.finalSellingPriceUSD} USD)
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Specs */}
        <TabsContent value="specs" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Physical Specifications & Packaging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Material</label>
                  <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Color Options</label>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Size / Dimension Label</label>
                  <Input value={size} onChange={(e) => setSize(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Length (cm)</label>
                  <Input type="number" value={lengthCm} onChange={(e) => setLengthCm(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Width (cm)</label>
                  <Input type="number" value={widthCm} onChange={(e) => setWidthCm(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Height (cm)</label>
                  <Input type="number" value={heightCm} onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Media */}
        <TabsContent value="media" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Product Images & Media Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Primary Display Image URL</label>
                <Input value={primaryImage} onChange={(e) => setPrimaryImage(e.target.value)} />
              </div>

              {primaryImage && (
                <div className="mt-2">
                  <span className="font-semibold block mb-2">Image Preview</span>
                  <img src={primaryImage} alt="Product Preview" className="size-48 object-cover rounded-md border" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Sourcing Metadata */}
        <TabsContent value="source" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Seed Origin & Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Country of Origin</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="China">China</option>
                    <option value="Turkey">Turkey</option>
                    <option value="Dubai">Dubai</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Source Platform / Hub</label>
                  <Input value={sourcePlatform} onChange={(e) => setSourcePlatform(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Catalog Classification</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING_REVIEW">PENDING REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
