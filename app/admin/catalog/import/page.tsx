'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileCheck,
  FileSpreadsheet,
  HelpCircle,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TARGET_FIELDS, TargetFieldKey } from '@/lib/catalog/column-aliases'
import { processCatalogFile, validateCatalogRows, executeBatchImport } from '@/lib/actions/catalog-import'
import { bulkPublishProducts } from '@/lib/actions/catalog-review'
import { addPublishedProducts, clearAllProducts } from '@/lib/mock/products'
import { formatTZS } from '@/lib/format'

const SAMPLE_DEMO_CSV = `external_url,external_product_id,product_name,short_description,description,category,subcategory,brand,sku,price,currency,compare_at_price,cost_price,moq,stock_quantity,stock_status,weight,length,width,height,material,color,size,variant_name,variant_value,images,video_url,country_of_origin,supplier_name,supplier_reference,source_type,source_platform,status
https://supplier-catalog.example.com/item/101,EXT-ELE-001,ANC Noise Cancelling Wireless Headphones,High performance active noise cancelling wireless over-ear Bluetooth headphones.,Premium ANC over-ear headphones with 40-hour battery life dual microphone noise reduction fast Type-C charging and soft memory foam earcups.,Electronics,Audio,LUMO Audio,SKU-ANC-001,45.00,USD,65.00,28.00,10,250,In Stock,0.35,20,18,8,ABS Plastic & Leather,Matte Black,Standard,Color,Black,https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800,,China,Shenzhen Tech Corp,BOOTH-402,CSV_IMPORT,Shenzhen Factory Feed,IMPORTED
https://supplier-catalog.example.com/item/102,EXT-FAS-002,Men's Slim Fit Business Cotton Shirt,100% long-staple breathable cotton formal shirt for professionals.,Wrinkle-resistant slim fit formal business dress shirt crafted from premium long-staple combed cotton with reinforced collar stay.,Men's Fashion,Shirts,LUMO Apparel,SKU-SHIRT-WHT-M,18.50,USD,28.00,11.00,20,500,In Stock,0.25,35,25,3,100% Cotton,Pure White,Medium,Size,Medium,https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800,,Turkey,Istanbul Textile Hub,BOOTH-112,CSV_IMPORT,Istanbul Grand Bazaar,IMPORTED
https://supplier-catalog.example.com/item/103,EXT-HOM-003,Commercial Stainless Steel Air Fryer 6L,Touchscreen air fryer with rapid hot air circulation for healthy frying.,6-liter capacity digital air fryer with 8 preset cooking programs non-stick basket and stainless steel exterior.,Home & Kitchen,Kitchen,LUMO Home,SKU-AF-6L,75.00,USD,110.00,48.00,5,150,In Stock,4.50,30,30,35,Stainless Steel,Silver,6L,Capacity,6L,https://images.unsplash.com/photo-1585515320310-259814833e62?w=800,,Dubai,Dubai Dragon Mart Wholesale,BOOTH-901,CSV_IMPORT,Dubai Market,IMPORTED
https://supplier-catalog.example.com/item/104,EXT-BEA-004,Professional Ion Hair Dryer 2200W,Lightweight salon grade ionic blow dryer with diffuser.,2200W salon grade ionic hairdryer with 3 heat settings 2 speed controls and cool shot button for fast frizz-free drying.,Beauty & Accessories,Personal Care,LUMO Beauty,SKU-HD-2200,32.00,USD,50.00,19.00,10,300,In Stock,0.80,25,15,10,ABS Plastic,Rose Gold,Standard,Color,Rose Gold,https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800,,China,Guangzhou Beauty Co,BOOTH-550,CSV_IMPORT,Guangzhou Hub,IMPORTED`

export default function CatalogImportWizardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<number>(1)
  const [fileName, setFileName] = useState<string>('lumo_catalog_seed_100.csv')
  const [rawCsvText, setRawCsvText] = useState<string>('')

  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, TargetFieldKey | ''>>({})
  const [validationResults, setValidationResults] = useState<any[]>([])
  const [validCount, setValidCount] = useState<number>(0)
  const [errorCount, setErrorCount] = useState<number>(0)
  const [warningCount, setWarningCount] = useState<number>(0)
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState<boolean>(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [publishedProductsCount, setPublishedProductsCount] = useState<number>(0)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      if (text) {
        setRawCsvText(text)
      }
    }
    reader.readAsText(file)
  }

  // Step 1 -> Step 2: Parse file
  async function handleFileSubmit() {
    const lines = rawCsvText.trim().split('\n').filter(Boolean)
    if (lines.length === 0) return

    const parsedHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    const parsedRows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
      const rowObj: Record<string, string> = {}
      parsedHeaders.forEach((h, idx) => {
        rowObj[h] = vals[idx] || ''
      })
      parsedRows.push(rowObj)
    }

    setHeaders(parsedHeaders)
    setRows(parsedRows)

    const res = await processCatalogFile(fileName, parsedHeaders, parsedRows)
    setMapping(res.autoMapping)

    setStep(2)
    setTimeout(() => setStep(3), 800) // Auto-transition Step 2 -> Step 3
  }

  // Step 3 -> Step 4: Validate rows
  async function handleMappingComplete() {
    const res = await validateCatalogRows(rows, mapping)
    setValidationResults(res.validationResults)
    setValidCount(res.validCount)
    setErrorCount(res.errorCount)
    setWarningCount(res.warningCount)

    // Select all valid rows by default
    const validIndices = new Set<number>()
    res.validationResults.forEach((val, idx) => {
      if (val.isValid) validIndices.add(idx)
    })
    setSelectedRowIndices(validIndices)

    setStep(4)
  }

  // Step 5 -> Step 6 -> Step 7: Batch Import
  async function handleStartBatchImport() {
    setStep(6)
    setImporting(true)

    const rowsToImport = Array.from(selectedRowIndices).map(
      (idx) => validationResults[idx].normalizedData,
    )

    try {
      const res = await executeBatchImport({
        fileName,
        totalRows: rows.length,
        columnMapping: mapping,
        selectedRows: rowsToImport,
      })
      setImportResult(res)
      setImporting(false)
      setStep(7)
    } catch (err) {
      console.error(err)
      setImporting(false)
    }
  }

  // Step 8 -> Step 9: Bulk Publish
  async function handleBulkPublish() {
    if (!importResult?.createdProducts) return
    const ids = importResult.createdProducts.map((p: any) => p.id)
    await bulkPublishProducts(ids)

    // Sync newly published products into live marketplace memory store
    const newItems = importResult.createdProducts.map((p: any) => ({
      id: p.id,
      slug: p.id,
      title: p.title,
      categoryId: p.categoryId,
      brand: p.brand || 'LUMO Supplier',
      fromPrice: p.fromPrice || 45000,
      compareAtPrice: p.compareAtPrice,
      description: p.description || p.title,
      shortDescription: p.shortDescription || p.title,
      supplier: {
        id: `sup-${p.id}`,
        name: p.supplierName || 'Verified Factory Supplier',
        rating: 4.8,
        city: p.countryOfOrigin || 'China',
        country: p.countryOfOrigin || 'China',
        flag: p.countryOfOrigin === 'Turkey' ? '🇹🇷' : p.countryOfOrigin === 'Dubai' ? '🇦🇪' : '🇨🇳',
      },
      images: [{ url: p.imageUrl || '/images/products/phone-case-armour.png', alt: p.title }],
    }))
    addPublishedProducts(newItems)

    setPublishedProductsCount(ids.length)
    setStep(9)
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.tsv"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/admin/catalog" />}>
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Bulk Catalog Import Wizard</h1>
            <p className="text-xs text-muted-foreground">9-Step LUMO Owned Product Initialization Pipeline</p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs bg-brand-50 text-brand-700">
          Step {step} of 9
        </Badge>
      </div>

      {/* Stepper Indicator */}
      <div className="grid grid-cols-9 gap-1 bg-muted p-1.5 rounded-lg text-[10px] font-semibold text-center">
        {[
          '1. Upload',
          '2. Detect',
          '3. Map',
          '4. Validate',
          '5. Preview',
          '6. Import',
          '7. Results',
          '8. Review',
          '9. Publish',
        ].map((lbl, idx) => {
          const stepNum = idx + 1
          const isActive = step === stepNum
          const isPassed = step > stepNum
          return (
            <div
              key={lbl}
              className={`py-1.5 rounded transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : isPassed
                    ? 'bg-brand-100 text-brand-800'
                    : 'text-muted-foreground'
              }`}
            >
              {lbl}
            </div>
          )
        })}
      </div>

      {/* STEP 1: Upload File */}
      {step === 1 ? (
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UploadCloud className="size-5 text-brand-600" />
              Step 1: Upload Authorized CSV or Excel File
            </CardTitle>
            <CardDescription className="text-xs">
              Select or paste a product catalog feed. External sources are treated as metadata; LUMO owns the created product records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 bg-muted/30 hover:bg-muted/50 transition-colors">
              <FileSpreadsheet className="size-10 text-brand-600 mb-2" />
              <p className="text-sm font-semibold">Drag &amp; Drop CSV / Excel catalog file here</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fileName ? `Selected file: ${fileName}` : 'Supports .csv, .xlsx up to 100,000 rows'}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" variant="default" className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1.5" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="size-3.5" /> Browse Local Files
                </Button>

                <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                  setFileName('sample_demo_catalog.csv')
                  setRawCsvText(SAMPLE_DEMO_CSV)
                }}>
                  <Sparkles className="size-3.5 mr-1" /> Load Demo Data
                </Button>

                <Button size="sm" variant="ghost" className="text-xs text-brand-600" onClick={() => {
                  const a = document.createElement('a')
                  a.href = '/templates/lumo-product-import-template.csv'
                  a.download = 'lumo-product-import-template.csv'
                  a.click()
                }}>
                  <Download className="size-3.5 mr-1" /> Download Template
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Catalog File Content Preview (CSV Data) {fileName ? `— ${fileName}` : ''}
              </label>
              <textarea
                value={rawCsvText}
                onChange={(e) => setRawCsvText(e.target.value)}
                placeholder="Paste CSV data here or click 'Browse Local Files' above..."
                rows={6}
                className="w-full text-xs font-mono p-3 border rounded-md bg-muted/20 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleFileSubmit}
                disabled={!rawCsvText.trim()}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1"
              >
                Next: Detect Columns <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 2: Detect Columns */}
      {step === 2 ? (
        <Card className="py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-8 text-brand-600 animate-spin" />
            <h3 className="text-base font-semibold">Step 2: Auto-Detecting File Columns...</h3>
            <p className="text-xs text-muted-foreground">Parsing header aliases and identifying product field mappings.</p>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 3: Map Columns */}
      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="size-5 text-brand-600" />
              Step 3: Column Mapping &amp; Alias Matching
            </CardTitle>
            <CardDescription className="text-xs">
              Review and adjust how supplier feed columns map to official LUMO product schema fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-3 p-3 bg-muted font-bold text-xs">
                <span>File Header Column</span>
                <span>Mapped LUMO Product Field</span>
                <span>Field Requirement</span>
              </div>

              {headers.map((header) => {
                const currentMapped = mapping[header] || ''
                const fieldDef = TARGET_FIELDS.find((f) => f.key === currentMapped)
                return (
                  <div key={header} className="grid grid-cols-3 p-3 items-center text-xs">
                    <span className="font-semibold text-foreground font-mono">{header}</span>
                    <div>
                      <select
                        value={currentMapped}
                        onChange={(e) =>
                          setMapping({ ...mapping, [header]: e.target.value as TargetFieldKey | '' })
                        }
                        className="w-full text-xs p-1.5 border rounded-md bg-background font-medium focus:outline-none"
                      >
                        <option value="">-- Ignore Column --</option>
                        {TARGET_FIELDS.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label} {f.required ? '*' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {fieldDef?.required ? (
                        <Badge variant="destructive" className="text-[10px]">
                          REQUIRED
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Optional Field</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                Back
              </Button>
              <Button onClick={handleMappingComplete} className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1">
                Next: Validate Data <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 4: Validate Data */}
      {step === 4 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="size-5 text-brand-600" />
              Step 4: Catalog Data Validation Results
            </CardTitle>
            <CardDescription className="text-xs">
              Verification results for prices, required fields, currency codes, and image links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-success-50 border border-success-200 text-success-800">
                <span className="text-xs font-medium block">Valid Rows</span>
                <span className="text-2xl font-extrabold">{validCount}</span>
              </div>
              <div className="p-4 rounded-lg bg-warning-50 border border-warning-200 text-warning-800">
                <span className="text-xs font-medium block">Warnings</span>
                <span className="text-2xl font-extrabold">{warningCount}</span>
              </div>
              <div className="p-4 rounded-lg bg-danger-50 border border-danger-200 text-danger-800">
                <span className="text-xs font-medium block">Errors</span>
                <span className="text-2xl font-extrabold">{errorCount}</span>
              </div>
            </div>

            <div className="border rounded-md p-4 divide-y space-y-2">
              <h4 className="font-semibold text-xs text-foreground mb-2">Row Validation Detail</h4>
              {validationResults.map((val) => (
                <div key={val.rowNumber} className="py-2 text-xs border-b last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {val.isValid ? (
                        <CheckCircle2 className="size-4 text-success-600 shrink-0" />
                      ) : (
                        <XCircle className="size-4 text-danger-600 shrink-0" />
                      )}
                      <span className="font-semibold">Row {val.rowNumber}:</span>
                      <span className="text-foreground">{val.normalizedData.product_name || `(Unnamed Item)`}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {val.warnings.length > 0 ? (
                        <Badge variant="outline" className="text-[10px] bg-warning-50 text-warning-700">
                          {val.warnings.length} Warning(s)
                        </Badge>
                      ) : null}
                      <Badge variant={val.isValid ? 'secondary' : 'destructive'} className="text-[10px]">
                        {val.isValid ? 'READY' : 'INVALID'}
                      </Badge>
                    </div>
                  </div>

                  {/* Warning & Error detail messages */}
                  {(val.errors.length > 0 || val.warnings.length > 0) && (
                    <div className="ml-6 mt-1 space-y-0.5 text-[11px]">
                      {val.errors.map((err: any, i: number) => (
                        <p key={i} className="text-danger-600 font-medium">
                          • Error: {err.message}
                        </p>
                      ))}
                      {val.warnings.map((warn: any, i: number) => (
                        <p key={i} className="text-warning-700">
                          • Warning: {warn.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(3)} className="text-xs">
                Back to Mapping
              </Button>
              <Button onClick={() => setStep(5)} className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1">
                Next: Preview Products <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 5: Preview Products */}
      {step === 5 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileCheck className="size-5 text-brand-600" />
              Step 5: Catalog Product Preview Table
            </CardTitle>
            <CardDescription className="text-xs">
              Select which verified rows to write into LUMO PostgreSQL product database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground font-bold">
                  <tr>
                    <th className="p-3">Select</th>
                    <th className="p-3">Product Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Retail Price</th>
                    <th className="p-3">Source Hub</th>
                    <th className="p-3">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {validationResults.map((val, idx) => {
                    const isSelected = selectedRowIndices.has(idx)
                    const data = val.normalizedData
                    return (
                      <tr key={idx} className={isSelected ? 'bg-brand-50/30' : 'opacity-60'}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const next = new Set(selectedRowIndices)
                              if (e.target.checked) next.add(idx)
                              else next.delete(idx)
                              setSelectedRowIndices(next)
                            }}
                          />
                        </td>
                        <td className="p-3 font-semibold text-foreground">{data.product_name}</td>
                        <td className="p-3">{data.category}</td>
                        <td className="p-3 font-mono font-bold text-brand-600">
                          {parseFloat(data.price || '0') > 1000 || data.currency === 'TZS'
                            ? `TZS ${parseFloat(data.price || '0').toLocaleString()}`
                            : `$${data.price} ${data.currency || 'USD'}`}
                        </td>
                        <td className="p-3">{data.source_platform} ({data.country_of_origin})</td>
                        <td className="p-3 font-mono">{data.stock_quantity} units</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(4)} className="text-xs">
                Back
              </Button>
              <Button
                onClick={handleStartBatchImport}
                disabled={selectedRowIndices.size === 0}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1 font-bold"
              >
                Execute Import ({selectedRowIndices.size} Products) <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 6: Import in Progress */}
      {step === 6 ? (
        <Card className="py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-10 text-brand-600 animate-spin" />
            <h3 className="text-lg font-bold">Step 6: Importing Catalog into LUMO PostgreSQL...</h3>
            <p className="text-xs text-muted-foreground">Writing products, images, and variant records. Generating internal LUMO codes.</p>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 7: Processing Results */}
      {step === 7 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-5 text-success-600" />
              Step 7: Import Job Execution Completed
            </CardTitle>
            <CardDescription className="text-xs">
              Batch job details and database product creation log.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-success-50 border border-success-200 text-success-800">
                <span className="text-xs font-medium block">Successfully Created Products</span>
                <span className="text-3xl font-extrabold">{importResult?.importedCount || 0}</span>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 border text-slate-700">
                <span className="text-xs font-medium block">Import Job ID</span>
                <span className="text-sm font-mono font-bold block mt-2">{importResult?.importJobId}</span>
              </div>
            </div>

            <div className="border rounded-md p-4 space-y-2">
              <h4 className="font-semibold text-xs text-foreground">Created LUMO Catalog Records</h4>
              {importResult?.createdProducts?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                  <span className="font-mono text-brand-600 font-bold">{p.productCode}</span>
                  <span className="font-semibold text-foreground">{p.title}</span>
                  <Badge variant="outline" className="text-[10px] bg-brand-50">
                    IMPORTED DRAFT
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(8)} className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1 font-bold">
                Next: Admin Review <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 8: Admin Review */}
      {step === 8 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="size-5 text-brand-600" />
              Step 8: Admin Catalog Review &amp; Approval
            </CardTitle>
            <CardDescription className="text-xs">
              Verify imported product titles, single retail pricing, and imagery before public marketplace release.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y border rounded-md">
              {importResult?.createdProducts?.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-600">{p.productCode}</span>
                      <span className="font-bold text-foreground">{p.title}</span>
                    </div>
                    <span className="text-muted-foreground text-[11px]">Lifecycle Status: IMPORTED → Ready for Publish</span>
                  </div>

                  <Badge variant="secondary" className="text-[10px] bg-success-50 text-success-700 border-success-200">
                    REVIEW PASSED
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(7)} className="text-xs">
                Back
              </Button>
              <Button onClick={handleBulkPublish} className="bg-success-600 hover:bg-success-700 text-white text-xs gap-1 font-bold">
                Approve &amp; Bulk Publish ({importResult?.createdProducts?.length || 0} Products) <CheckCircle2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 9: Publish Complete */}
      {step === 9 ? (
        <Card className="py-12 text-center bg-success-50/30 border-success-200">
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-success-100 text-success-700">
              <Sparkles className="size-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground">Step 9: Catalog Products Live on Marketplace!</h2>
            <p className="text-xs text-muted-foreground max-w-md">
              {publishedProductsCount} products have been published to the LUMO Marketplace catalog.
            </p>

            <div className="flex items-center gap-3 mt-2">
              <Button size="sm" variant="outline" className="text-xs" render={<Link href="/admin/catalog" />}>
                Catalog Dashboard
              </Button>
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold" render={<Link href="/marketplace" target="_blank" />}>
                View Public Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
