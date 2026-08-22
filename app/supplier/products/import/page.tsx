'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Eye,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SafeProductImage } from '@/components/ui/product-image'
import { useSupplierStore } from '@/lib/stores/supplier-store'
import { resolveImage } from '@/lib/mock/products'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function BulkImportProductsPage() {
  const importProducts = useSupplierStore((s) => s.importProducts)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)

  // Preview & Mapping State
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [imageCol, setImageCol] = useState<string>('')
  const [titleCol, setTitleCol] = useState<string>('')
  const [priceCol, setPriceCol] = useState<string>('')
  const [categoryCol, setCategoryCol] = useState<string>('')
  const [skuCol, setSkuCol] = useState<string>('')

  function handleDownloadTemplate() {
    const csvContent =
      'Title,Brand,Category,SKU,OptionName,PriceTZS,Stock,Description,MainImageURL,ImageURL2,ImageURL3,ImageURLs\n' +
      'Solar Panel Monocrystalline 350W,Kilimanjaro Solar,Renewable Energy,KIL-SOL-350W,Standard,420000,50,"High efficiency 350W monocrystalline solar module.","https://images.unsplash.com/photo-1509391365360-2e959784a276","https://images.unsplash.com/photo-1508514177221-188b1cf16e9d","https://images.unsplash.com/photo-1548611716-3006a8f192b1","https://images.unsplash.com/photo-1509391365360-2e959784a276;https://images.unsplash.com/photo-1508514177221-188b1cf16e9d"\n' +
      'Commercial Air Fryer 12L,KiliKitchen Pro,Commercial Appliances,KIT-AF-12L,12L Digital,380000,30,"Industrial grade 12-liter digital air fryer.","https://images.unsplash.com/photo-1585515320310-259814833e62","https://images.unsplash.com/photo-1556911220-e15b29be8c8f","","https://images.unsplash.com/photo-1585515320310-259814833e62;https://images.unsplash.com/photo-1556911220-e15b29be8c8f"\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Lumo_Alibaba_Style_Bulk_Product_Template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Downloaded Alibaba-style CSV Template with Multi-Image columns!')
  }

  function parseCSVLine(text: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  function extractImageUrlsFromCell(val: any): string[] {
    if (!val) return []
    const str = String(val).trim()
    if (!str) return []

    // Try parsing as JSON array if formatted as ["url1", "url2"]
    if ((str.startsWith('[') && str.endsWith(']')) || (str.startsWith('{') && str.endsWith('}'))) {
      try {
        const parsed = JSON.parse(str)
        if (Array.isArray(parsed)) {
          return parsed.flatMap((item) => extractImageUrlsFromCell(item))
        }
        if (typeof parsed === 'object') {
          return Object.values(parsed).flatMap((item) => extractImageUrlsFromCell(item))
        }
      } catch {
        // Continue
      }
    }

    // Split by delimiters
    const parts = str.split(/[\r\n;,|]+|\s{2,}/).map((s) => s.trim()).filter(Boolean)
    const found: string[] = []

    for (let part of parts) {
      part = part.replace(/^['"\(<\[]+|['"\)>\]]+$/g, '').trim()
      if (!part) continue

      if (part.startsWith('//')) {
        part = `https:${part}`
      } else if (part.startsWith('http://')) {
        part = part.replace('http://', 'https://')
      } else if (part.includes('drive.google.com/file/d/')) {
        const match = part.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (match?.[1]) {
          part = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
        }
      } else if (part.includes('dropbox.com')) {
        part = part.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      } else if (
        !part.startsWith('https://') &&
        !part.startsWith('data:') &&
        !part.startsWith('/') &&
        (part.includes('.') || part.includes('/')) &&
        (part.includes('alicdn') ||
          part.includes('alibaba') ||
          part.includes('aliexpress') ||
          part.includes('taobao') ||
          part.includes('1688') ||
          part.includes('cloudinary') ||
          part.includes('unsplash') ||
          part.includes('cloudfront') ||
          part.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i))
      ) {
        part = `https://${part}`
      }

      if (
        part.length > 8 &&
        !part.includes('example.com') &&
        !part.includes('placeholder') &&
        (part.startsWith('https://') || part.startsWith('/') || part.startsWith('data:image/'))
      ) {
        found.push(part)
      }
    }

    return Array.from(new Set(found))
  }

  async function handleFileSelect(selectedFile: File) {
    setFile(selectedFile)
    try {
      let rows: string[][] = []

      try {
        const XLSX = (await import('xlsx')).default
        const buffer = await selectedFile.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array', raw: false })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
        rows = jsonData.map((row) => row.map((cell: any) => String(cell ?? '').trim()))
      } catch (err) {
        const text = await selectedFile.text()
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
        rows = lines.map((line) => parseCSVLine(line))
      }

      if (rows.length <= 1) {
        toast.error('File contains only header or is empty')
        return
      }

      const headers = rows[0]
      setRawHeaders(headers)
      setRawRows(rows)

      const normHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))

      // Auto-detect best columns
      const autoTitle = headers.find((h, i) => {
        const nh = normHeaders[i]
        return nh.includes('title') || nh.includes('name') || nh.includes('product') || nh.includes('item')
      }) || headers[0] || ''

      const autoPrice = headers.find((h, i) => {
        const nh = normHeaders[i]
        return nh.includes('price') || nh.includes('cost') || nh.includes('amount') || nh.includes('tzs') || nh.includes('usd')
      }) || ''

      const autoCategory = headers.find((h, i) => {
        const nh = normHeaders[i]
        return nh.includes('category') || nh.includes('cat') || nh.includes('group')
      }) || ''

      const autoSku = headers.find((h, i) => {
        const nh = normHeaders[i]
        return nh.includes('sku') || nh.includes('code') || nh.includes('model')
      }) || ''

      // Detect Image Column with strict priority (MainImageURL > Image > Image1 > Image_URL > ImageURLs)
      const priorityImageNames = [
        'mainimageurl',
        'mainimage',
        'image1',
        'imageurl',
        'image_url',
        'main_image',
        'productimage',
        'cover_image',
        'picture',
        'photo',
        'image',
        'images',
        'imageurls',
      ]

      let bestImageCol = ''

      for (const name of priorityImageNames) {
        const found = headers.find((h, i) => normHeaders[i] === name || normHeaders[i].startsWith(name))
        if (found) {
          const colIdx = headers.indexOf(found)
          const hasImages = rows.slice(1, 6).some((r) => extractImageUrlsFromCell(r[colIdx]).length > 0)
          if (hasImages) {
            bestImageCol = found
            break
          }
        }
      }

      if (!bestImageCol) {
        headers.forEach((h, colIdx) => {
          let count = 0
          for (let r = 1; r < Math.min(rows.length, 6); r++) {
            const imgs = extractImageUrlsFromCell(rows[r][colIdx])
            if (imgs.length > 0) count += imgs.length
          }
          if (count > 0 && !bestImageCol) {
            bestImageCol = h
          }
        })
      }

      setTitleCol(autoTitle)
      setPriceCol(autoPrice)
      setCategoryCol(autoCategory)
      setSkuCol(autoSku)
      setImageCol(bestImageCol || headers[0] || '')

      toast.success(`Loaded ${rows.length - 1} products from ${selectedFile.name}`)
    } catch (err) {
      console.error('File load error:', err)
      toast.error('Failed to read file')
    }
  }

  async function handleProcessCSV(e: React.FormEvent) {
    e.preventDefault()
    if (!rawRows || rawRows.length <= 1) {
      toast.error('Please select a valid CSV or Excel file')
      return
    }

    setIsUploading(true)

    try {
      const headers = rawHeaders
      const rows = rawRows

      const idxTitle = headers.indexOf(titleCol)
      const idxPrice = headers.indexOf(priceCol)
      const idxCategory = headers.indexOf(categoryCol)
      const idxSKU = headers.indexOf(skuCol)
      const idxSelectedImg = headers.indexOf(imageCol)

      // Collect all potential image columns as secondary
      const allImageCols: number[] = []
      headers.forEach((h, idx) => {
        const nh = h.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (
          idx === idxSelectedImg ||
          nh.includes('image') ||
          nh.includes('img') ||
          nh.includes('picture') ||
          nh.includes('photo') ||
          nh.includes('gallery') ||
          nh.includes('pic') ||
          nh.includes('url')
        ) {
          allImageCols.push(idx)
        }
      })

      const parsedProducts: any[] = []

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (row.length < 1) continue

        const title = idxTitle !== -1 && row[idxTitle] ? row[idxTitle].trim() : `Product ${i}`
        if (!title) continue

        const category = idxCategory !== -1 && row[idxCategory] ? row[idxCategory].trim() : "Men's Fashion > Suits & Blazers"
        const brand = 'Unbranded'
        const sku = idxSKU !== -1 && row[idxSKU] ? row[idxSKU].trim() : `SKU-${Date.now()}-${i}`
        const priceTZS = idxPrice !== -1 && row[idxPrice] ? Number(String(row[idxPrice]).replace(/[^0-9.]/g, '')) || 50000 : 50000
        const stock = 20
        const description = title

        // 1. Primary: extract from selected image column FIRST
        const imageList: string[] = []
        if (idxSelectedImg !== -1 && row[idxSelectedImg]) {
          imageList.push(...extractImageUrlsFromCell(row[idxSelectedImg]))
        }

        // 2. Secondary: extract from all other detected image columns
        for (const colIdx of allImageCols) {
          if (colIdx !== idxSelectedImg && row[colIdx]) {
            imageList.push(...extractImageUrlsFromCell(row[colIdx]))
          }
        }

        // 3. Fallback: scan ALL cells in the row if none found
        if (imageList.length === 0) {
          for (const cell of row) {
            imageList.push(...extractImageUrlsFromCell(cell))
          }
        }

        const uniqueImages = Array.from(new Set(imageList))
        const fallbackImage = resolveImage(title, category)
        const finalImages = uniqueImages.length > 0 ? uniqueImages : [fallbackImage]

        parsedProducts.push({
          title,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          brand,
          category,
          description,
          status: 'PENDING_REVIEW',
          isApproved: false,
          fromPriceTZS: priceTZS,
          images: finalImages,
          variants: [
            {
              id: `v_csv_${Date.now()}_${i}`,
              sku,
              name: 'Standard',
              priceTZS,
              costPriceTZS: Math.round(priceTZS * 0.7),
              stock,
              reorderPoint: 5,
              attributes: { Option: 'Standard' },
            },
          ],
        })
      }

      if (parsedProducts.length === 0) {
        toast.error('Could not parse any valid product rows')
        setIsUploading(false)
        return
      }

      // 1. Save to local Zustand store
      importProducts(parsedProducts)

      // 2. Persist to PostgreSQL database via API
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedProducts),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success(`Saved ${parsedProducts.length} product(s) to PostgreSQL database!`)
          }
        })
        .catch((err) => {
          console.error('Failed to post products to database API:', err)
        })

      setImportedCount(parsedProducts.length)
      setIsUploading(false)
      toast.success(`Successfully imported ${parsedProducts.length} product(s) into database catalog!`)
    } catch (err) {
      console.error('File Parsing Error:', err)
      toast.error('Failed to parse file')
      setIsUploading(false)
    }
  }

  // Generate live preview items for first 4 rows
  const previewProducts = rawRows.slice(1, 5).map((row, i) => {
    const idxTitle = rawHeaders.indexOf(titleCol)
    const idxPrice = rawHeaders.indexOf(priceCol)
    const idxCategory = rawHeaders.indexOf(categoryCol)
    const idxImg = rawHeaders.indexOf(imageCol)

    const title = idxTitle !== -1 && row[idxTitle] ? row[idxTitle] : `Product ${i + 1}`
    const price = idxPrice !== -1 && row[idxPrice] ? Number(String(row[idxPrice]).replace(/[^0-9.]/g, '')) || 50000 : 50000
    const cat = idxCategory !== -1 && row[idxCategory] ? row[idxCategory] : "Men's Fashion > Suits & Blazers"

    let imgs = idxImg !== -1 && row[idxImg] ? extractImageUrlsFromCell(row[idxImg]) : []
    const rawVal = idxImg !== -1 && row[idxImg] ? String(row[idxImg]).trim() : ''

    if (imgs.length === 0) {
      for (const cell of row) {
        imgs = extractImageUrlsFromCell(cell)
        if (imgs.length > 0) break
      }
    }
    const finalImg = imgs.length > 0 ? imgs[0] : resolveImage(title, cat)

    return {
      title,
      price,
      category: cat,
      image: finalImg,
      rawUrl: imgs.length > 0 ? imgs[0] : rawVal || 'No URL found in this column',
      hasRealImage: imgs.length > 0,
    }
  })

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" render={<Link href="/supplier/products" />}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            Alibaba Bulk Product CSV Import
            <Badge className="bg-brand-500/10 text-brand-500 border border-brand-500/20 text-xs font-bold gap-1">
              <ImageIcon className="size-3" /> Multi-Image Support
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Batch import product listings, prices, SKU stock, and multi-image CDN URLs matching Alibaba spreadsheet format.
          </p>
        </div>
      </div>

      {importedCount !== null ? (
        <Card className="border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="size-12 text-emerald-600" />
            <div className="flex flex-col gap-1 items-center">
              <h2 className="text-lg font-bold text-foreground">Import &amp; Database Sync Complete!</h2>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-extrabold text-[11px] my-1">
                STATUS: PENDING ADMIN APPROVAL
              </Badge>
              <p className="text-xs text-muted-foreground max-w-md">
                Successfully saved <strong className="text-foreground font-mono">{importedCount} new product(s)</strong> into PostgreSQL database with full image matrices. Products are now queued for Admin approval.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <Button size="sm" render={<Link href="/supplier/products" />} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
                View Supplier Catalogue
              </Button>
              <Button size="sm" variant="outline" render={<Link href="/admin/products?status=PENDING_REVIEW" />} className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-extrabold text-xs">
                Open Admin Catalog Approval Queue →
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleProcessCSV} className="flex flex-col gap-6">
          {/* Download Template Step */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  Step 1: Download Alibaba-Style CSV Template
                </CardTitle>
                <CardDescription className="text-xs">
                  Includes multi-image URL columns (<code className="bg-muted px-1 rounded font-mono">MainImageURL</code>, <code className="bg-muted px-1 rounded font-mono">ImageURL2</code>, <code className="bg-muted px-1 rounded font-mono">ImageURL3</code>, and semicolon-separated <code className="bg-muted px-1 rounded font-mono">ImageURLs</code>).
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="font-semibold text-xs border-brand-500/30 text-brand-500 hover:bg-brand-500/10">
                <Download className="size-3.5 mr-1" />
                Download Multi-Image Template CSV
              </Button>
            </CardHeader>
          </Card>

          {/* Upload File Drag & Drop Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Step 2: Upload Completed Product CSV File</CardTitle>
              <CardDescription className="text-xs">Supported formats: .CSV, .XLSX (Max file size 15MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-border hover:border-brand-500/50 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-muted/20 cursor-pointer"
                onClick={() => document.getElementById('csvFileInput')?.click()}
              >
                <FileSpreadsheet className="size-12 text-brand-500" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">
                    {file ? file.name : 'Click or Drag & Drop your CSV spreadsheet here'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Automatic column mapping &amp; multi-image extractor</p>
                </div>
                <input
                  id="csvFileInput"
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelect(f)
                  }}
                />
              </div>

              {file && rawHeaders.length > 0 && (
                <div className="space-y-4 pt-2">
                  {/* Column Mapper Dropdowns */}
                  <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
                    <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                      <Sparkles className="size-4 text-brand-500" /> Confirm Column Mapping
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-[11px] text-muted-foreground flex items-center justify-between">
                          <span>Image URL Column</span>
                          <span className="text-[9px] text-brand-500 font-bold">Pick your image col</span>
                        </label>
                        <select
                          value={imageCol}
                          onChange={(e) => setImageCol(e.target.value)}
                          className="w-full h-8 text-xs rounded-lg border border-brand-500/40 bg-background px-2 font-bold text-brand-500 shadow-xs"
                        >
                          {rawHeaders.map((h, i) => {
                            const sample = rawRows[1]?.[i] ? ` (${rawRows[1][i].slice(0, 25)}...)` : ''
                            return (
                              <option key={h} value={h}>
                                {h}{sample}
                              </option>
                            )
                          })}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[11px] text-muted-foreground">Product Title Column</label>
                        <select
                          value={titleCol}
                          onChange={(e) => setTitleCol(e.target.value)}
                          className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2"
                        >
                          {rawHeaders.map((h, i) => {
                            const sample = rawRows[1]?.[i] ? ` (${rawRows[1][i].slice(0, 20)}...)` : ''
                            return (
                              <option key={h} value={h}>
                                {h}{sample}
                              </option>
                            )
                          })}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[11px] text-muted-foreground">Price Column</label>
                        <select
                          value={priceCol}
                          onChange={(e) => setPriceCol(e.target.value)}
                          className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2"
                        >
                          {rawHeaders.map((h, i) => {
                            const sample = rawRows[1]?.[i] ? ` (${rawRows[1][i].slice(0, 15)}...)` : ''
                            return (
                              <option key={h} value={h}>
                                {h}{sample}
                              </option>
                            )
                          })}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[11px] text-muted-foreground">Category Column</label>
                        <select
                          value={categoryCol}
                          onChange={(e) => setCategoryCol(e.target.value)}
                          className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2"
                        >
                          {rawHeaders.map((h, i) => {
                            const sample = rawRows[1]?.[i] ? ` (${rawRows[1][i].slice(0, 20)}...)` : ''
                            return (
                              <option key={h} value={h}>
                                {h}{sample}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Live Visual Preview Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-foreground flex items-center gap-1.5">
                        <Eye className="size-4 text-emerald-600" /> Live Data &amp; Image Preview ({rawRows.length - 1} products)
                      </span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-bold">
                        Ready to Process
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {previewProducts.map((p, idx) => (
                        <div key={idx} className="p-3 bg-card rounded-xl border border-border space-y-2 text-xs">
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden border bg-muted/30">
                            <SafeProductImage
                              src={p.image}
                              alt={p.title}
                              title={p.title}
                              category={p.category}
                              className="size-full object-cover"
                            />
                            {p.hasRealImage && (
                              <Badge className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[9px] font-bold py-0.5 px-1">
                                Image Linked ✓
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-bold text-foreground line-clamp-1">{p.title}</h5>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-muted-foreground truncate max-w-[100px]">{p.category}</span>
                              <strong className="font-mono text-brand-500 font-extrabold">{formatTZS(p.price)}</strong>
                            </div>
                            <div
                              className="p-1 bg-muted/50 rounded text-[9px] font-mono text-muted-foreground break-all line-clamp-2"
                              title={p.rawUrl}
                            >
                              {p.rawUrl}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" render={<Link href="/supplier/products" />}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !file}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md"
            >
              {isUploading ? (
                <>Processing CSV &amp; Multi-Image Gallery...</>
              ) : (
                <>
                  <Upload className="size-4 mr-1" />
                  Process &amp; Import {rawRows.length > 1 ? `${rawRows.length - 1} ` : ''}Products
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

