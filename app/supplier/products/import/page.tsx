'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Upload, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSupplierStore } from '@/lib/stores/supplier-store'
import { toast } from 'sonner'

export default function BulkImportProductsPage() {
  const importProducts = useSupplierStore((s) => s.importProducts)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)

  function handleDownloadTemplate() {
    const csvContent =
      'Title,Brand,Category,SKU,OptionName,PriceTZS,Stock,Description\n' +
      'Solar Panel Monocrystalline 350W,Kilimanjaro Solar,Renewable Energy,KIL-SOL-350W,Standard,420000,50,High efficiency 350W monocrystalline solar module.\n' +
      'Commercial Air Fryer 12L,KiliKitchen Pro,Commercial Appliances,KIT-AF-12L,12L Digital,380000,30,Industrial grade 12-liter digital air fryer.\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Lumo_Supplier_Bulk_Product_Template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Downloaded CSV Bulk Import Template!')
  }

  function handleSimulateUpload(e: React.FormEvent) {
    e.preventDefault()
    setIsUploading(true)

    setTimeout(() => {
      setIsUploading(false)
      const count = Math.floor(5 + Math.random() * 8)
      setImportedCount(count)

      // Add mock imported products to store
      importProducts([
        {
          title: 'Industrial Heavy Weight Scales 500KG',
          slug: 'industrial-heavy-weight-scales-500kg',
          brand: 'Kilimanjaro Scale Co',
          category: 'POS & Retail Tech',
          description: 'Heavy duty digital platform scale for agricultural produce and warehousing.',
          status: 'active',
          fromPriceTZS: 750000,
          images: ['/images/products/phone-case-armour.png'],
          variants: [
            {
              id: `v_imp_1`,
              sku: `KIL-SCL-500KG`,
              name: '500KG Platform',
              priceTZS: 750000,
              costPriceTZS: 520000,
              stock: 25,
              reorderPoint: 5,
              attributes: { Capacity: '500KG' },
            },
          ],
        },
        {
          title: 'Automated Commercial Dough Mixer 40L',
          slug: 'automated-commercial-dough-mixer-40l',
          brand: 'KiliKitchen Pro',
          category: 'Commercial Appliances',
          description: 'Heavy duty 40-liter spiral dough mixer for commercial bakeries and restaurants.',
          status: 'active',
          fromPriceTZS: 2400000,
          images: ['/images/products/phone-case-armour.png'],
          variants: [
            {
              id: `v_imp_2`,
              sku: `KIT-MIX-40L`,
              name: '40L 3-Phase',
              priceTZS: 2400000,
              costPriceTZS: 1750000,
              stock: 12,
              reorderPoint: 3,
              attributes: { Capacity: '40L' },
            },
          ],
        },
      ])

      toast.success(`Successfully imported ${count} products into catalog!`)
    }, 2000)
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" render={<Link href="/supplier/products" />}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Bulk Product CSV Import</h1>
          <p className="text-sm text-muted-foreground">
            Batch import hundreds of product SKUs and stock inventory at once via CSV spreadsheet.
          </p>
        </div>
      </div>

      {importedCount !== null ? (
        <Card className="border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="size-12 text-emerald-600" />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-foreground">Import Complete!</h2>
              <p className="text-xs text-muted-foreground max-w-md">
                Successfully processed and imported <strong className="text-foreground font-mono">{importedCount} new products</strong> into your active catalog.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button size="sm" render={<Link href="/supplier/products" />} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                View Updated Catalogue
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSimulateUpload} className="flex flex-col gap-6">
          {/* Download Template Step */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold">Step 1: Download Standard CSV Template</CardTitle>
                <CardDescription className="text-xs">
                  Ensure your product data matches Lumo&apos;s required spreadsheet columns.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="font-semibold text-xs">
                <Download className="size-3.5 mr-1 text-brand-500" />
                Download Template CSV
              </Button>
            </CardHeader>
          </Card>

          {/* Upload File Drag & Drop Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Step 2: Upload Completed Product File</CardTitle>
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
                  <p className="text-[11px] text-muted-foreground">Automatic column mapping and validation check</p>
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
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">Ready to Import</Badge>
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
                <>Processing CSV Import...</>
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
