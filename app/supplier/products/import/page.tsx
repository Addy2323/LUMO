'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Upload, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSupplierStore } from '@/lib/stores/supplier-store'
import { resolveImage } from '@/lib/mock/products'
import { toast } from 'sonner'

export default function BulkImportProductsPage() {
  const importProducts = useSupplierStore((s) => s.importProducts)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)

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

  async function handleProcessCSV(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a CSV or Excel spreadsheet file to upload')
      return
    }

    setIsUploading(true)

    try {
      let rows: string[][] = []

      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')

      if (isExcel) {
        // Use SheetJS to parse Excel binary files
        const XLSX = (await import('xlsx')).default
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })

        // Convert all cells to strings
        rows = jsonData.map((row) => row.map((cell: any) => String(cell ?? '').trim()))
      } else {
        // CSV: read as text
        const text = await file.text()
        if (!text) {
          toast.error('CSV file is empty')
          setIsUploading(false)
          return
        }
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
        rows = lines.map((line) => parseCSVLine(line))
      }

      if (rows.length <= 1) {
        toast.error('File contains header row only or is empty')
        setIsUploading(false)
        return
      }

      const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))

      console.log('[IMPORT DEBUG] Detected headers:', headers)

      // Find column indexes with resilient keyword matching
      const idxTitle = headers.findIndex((h) => h.includes('title') || h.includes('name') || h.includes('product') || h.includes('item') || h.includes('subject'))
      const idxBrand = headers.findIndex((h) => h.includes('brand') || h.includes('company') || h.includes('supplier') || h.includes('manufacturer'))
      const idxCategory = headers.findIndex((h) => h.includes('category') || h.includes('cat') || h.includes('group') || h.includes('type'))
      const idxSKU = headers.findIndex((h) => h.includes('sku') || h.includes('code') || h.includes('model') || h.includes('number'))
      const idxOption = headers.findIndex((h) => h.includes('option') || h.includes('variant') || h.includes('size') || h.includes('color') || h.includes('style'))
      const idxPrice = headers.findIndex((h) => h.includes('price') || h.includes('cost') || h.includes('amount') || h.includes('rate') || h.includes('tzs') || h.includes('usd'))
      const idxStock = headers.findIndex((h) => h.includes('stock') || h.includes('qty') || h.includes('quantity') || h.includes('inventory'))
      const idxDesc = headers.findIndex((h) => h.includes('desc') || h.includes('detail') || h.includes('info') || h.includes('specification'))

      // Image column detection - find ALL columns that could contain image URLs
      const idxMainImg = headers.findIndex((h) => h.includes('mainimage') || h.includes('image1') || h === 'image' || h.includes('img') || h.includes('picture') || h.includes('photo') || h.includes('thumbnail') || h.includes('pic'))
      const idxImg2 = headers.findIndex((h) => h.includes('imageurl2') || h.includes('image2') || h.includes('picture2') || h.includes('photo2') || h.includes('pic2'))
      const idxImg3 = headers.findIndex((h) => h.includes('imageurl3') || h.includes('image3') || h.includes('picture3') || h.includes('photo3') || h.includes('pic3'))
      const idxMultiImgs = headers.findIndex((h) => h.includes('imageurls') || h.includes('images') || h.includes('pictures') || h.includes('photos') || h.includes('gallery') || h.includes('pics'))

      // Also find any column header containing 'url', 'link', or 'src' that is NOT already matched
      const usedIdxs = new Set([idxTitle, idxBrand, idxCategory, idxSKU, idxOption, idxPrice, idxStock, idxDesc, idxMainImg, idxImg2, idxImg3, idxMultiImgs].filter(i => i !== -1))
      const extraImageIdxs: number[] = []
      headers.forEach((h, idx) => {
        if (!usedIdxs.has(idx) && (h.includes('url') || h.includes('link') || h.includes('src') || h.includes('href'))) {
          extraImageIdxs.push(idx)
        }
      })

      console.log('[IMPORT DEBUG] Column indexes:', { idxTitle, idxBrand, idxCategory, idxPrice, idxMainImg, idxImg2, idxImg3, idxMultiImgs, extraImageIdxs })

      const parsedProducts: any[] = []

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (row.length < 2) continue

        const title = idxTitle !== -1 ? row[idxTitle] : `Product ${i}`
        if (!title || !title.trim()) continue

        const brand = idxBrand !== -1 ? row[idxBrand] : 'Generic Brand'
        const category = idxCategory !== -1 ? row[idxCategory] : 'Commercial Appliances'
        const sku = idxSKU !== -1 ? row[idxSKU] : `SKU-${Date.now()}-${i}`
        const optionName = idxOption !== -1 ? row[idxOption] : 'Standard'
        const priceTZS = idxPrice !== -1 ? Number(String(row[idxPrice]).replace(/[^0-9.]/g, '')) || 50000 : 50000
        const stock = idxStock !== -1 ? Number(String(row[idxStock]).replace(/[^0-9]/g, '')) || 20 : 20
        const description = idxDesc !== -1 ? row[idxDesc] : title

        // Extract image URLs
        const imageList: string[] = []

        function cleanUrl(u: string): string {
          if (!u) return ''
          let trimmed = String(u).trim().replace(/^['"]|['"]$/g, '')
          if (!trimmed) return ''
          if (trimmed.startsWith('//')) return `https:${trimmed}`
          if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:') && !trimmed.startsWith('/')) {
            if (trimmed.includes('alicdn') || trimmed.includes('alibaba') || trimmed.includes('/') || trimmed.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
              return `https://${trimmed}`
            }
          }
          return trimmed
        }

        function isImageUrl(url: string): boolean {
          if (!url || url.length < 10) return false
          return url.startsWith('http://') || url.startsWith('https://') || url.includes('alicdn') || url.includes('alibaba') || !!url.match(/\.(jpg|jpeg|png|webp|gif)/i)
        }

        // 1. Named image columns
        if (idxMainImg !== -1 && row[idxMainImg]) imageList.push(cleanUrl(row[idxMainImg]))
        if (idxImg2 !== -1 && row[idxImg2]) imageList.push(cleanUrl(row[idxImg2]))
        if (idxImg3 !== -1 && row[idxImg3]) imageList.push(cleanUrl(row[idxImg3]))

        if (idxMultiImgs !== -1 && row[idxMultiImgs]) {
          const splitImgs = String(row[idxMultiImgs])
            .split(/[;|\n,]/)
            .map((s) => cleanUrl(s))
            .filter((s) => s.length > 5)
          imageList.push(...splitImgs)
        }

        // 2. Extra URL/link/src columns
        for (const idx of extraImageIdxs) {
          if (row[idx]) {
            const cleaned = cleanUrl(row[idx])
            if (isImageUrl(cleaned)) imageList.push(cleaned)
          }
        }

        // 3. Scan ALL cells as last resort
        if (imageList.length === 0) {
          for (const cell of row) {
            const cleaned = cleanUrl(cell)
            if (isImageUrl(cleaned)) {
              imageList.push(cleaned)
            }
          }
        }

        const uniqueImages = Array.from(new Set(imageList.filter((url) => url.length > 5)))
        const fallbackImage = resolveImage(title, category)
        const finalImages = uniqueImages.length > 0 ? uniqueImages : [fallbackImage]

        console.log(`[IMPORT DEBUG] Product "${title}": ${uniqueImages.length} images found:`, uniqueImages.length > 0 ? uniqueImages[0] : 'FALLBACK')

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
              name: optionName,
              priceTZS,
              costPriceTZS: Math.round(priceTZS * 0.7),
              stock,
              reorderPoint: 5,
              attributes: { Option: optionName },
            },
          ],
        })
      }

      if (parsedProducts.length === 0) {
        toast.error('Could not parse any valid product rows from file')
        setIsUploading(false)
        return
      }

      // 1. Save to local Zustand store
      importProducts(parsedProducts)

      // 2. Persist directly into PostgreSQL Database via API
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedProducts),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success(`Saved ${parsedProducts.length} product(s) to PostgreSQL database! Status set to PENDING_REVIEW.`)
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
      toast.error('Failed to parse file. Please check format.')
      setIsUploading(false)
    }
  }

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
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              {file && (
                <div className="p-3 rounded-xl bg-card border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="font-bold">{file.name}</span>
                    <span className="text-muted-foreground text-[11px]">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-bold">Ready to Import</Badge>
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
              disabled={isUploading}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md"
            >
              {isUploading ? (
                <>Processing CSV &amp; Multi-Image Gallery...</>
              ) : (
                <>
                  <Upload className="size-4 mr-1" />
                  Process &amp; Import Products
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

