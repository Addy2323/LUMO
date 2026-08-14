'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Boxes, CheckCircle2, Download, Edit3, Package, Save, Search, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { useSupplierStore } from '@/lib/stores/supplier-store'
import { toast } from 'sonner'

export default function SupplierInventoryPage() {
  const { products, updateStock, updateReorderPoint } = useSupplierStore()
  const [search, setSearch] = useState('')

  // Inline editing state: productId:variantId -> stock number
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({})
  const [reorderEdits, setReorderEdits] = useState<Record<string, number>>({})

  const allVariants = products.flatMap((p) =>
    p.variants.map((v) => ({
      productId: p.id,
      productTitle: p.title,
      category: p.category,
      variantId: v.id,
      sku: v.sku,
      name: v.name,
      priceTZS: v.priceTZS,
      stock: v.stock,
      reorderPoint: v.reorderPoint,
    })),
  )

  const filteredVariants = allVariants.filter((v) => {
    const query = search.toLowerCase()
    return (
      v.sku.toLowerCase().includes(query) ||
      v.productTitle.toLowerCase().includes(query) ||
      v.name.toLowerCase().includes(query)
    )
  })

  function handleSaveStock(productId: string, variantId: string, currentStock: number) {
    const key = `${productId}:${variantId}`
    const newStock = stockEdits[key] !== undefined ? stockEdits[key] : currentStock
    updateStock(productId, variantId, newStock)
    toast.success('Stock quantity updated!')
  }

  function handleSaveReorder(productId: string, variantId: string, currentReorder: number) {
    const key = `${productId}:${variantId}`
    const newReorder = reorderEdits[key] !== undefined ? reorderEdits[key] : currentReorder
    updateReorderPoint(productId, variantId, newReorder)
    toast.success('Reorder threshold updated!')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Inventory &amp; Stock Control</h1>
          <p className="text-sm text-muted-foreground">
            Monitor real-time warehouse quantities, reorder thresholds, and low-stock alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const content =
                'SKU,Product,Variant,PriceTZS,Stock,ReorderPoint\n' +
                allVariants
                  .map((v) => `${v.sku},"${v.productTitle}","${v.name}",${v.priceTZS},${v.stock},${v.reorderPoint}`)
                  .join('\n')
              const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.setAttribute('download', `Lumo_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`)
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              toast.success('Inventory report downloaded!')
            }}
            className="text-xs font-semibold"
          >
            <Download className="size-3.5 mr-1" />
            Export Inventory CSV
          </Button>
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="size-5 text-brand-500" />
            <CardTitle className="text-base font-extrabold">Active Stock Matrix ({allVariants.length} SKUs)</CardTitle>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Filter by SKU or product title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-y text-muted-foreground uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3.5">SKU / Product</th>
                  <th className="p-3.5">Variant Option</th>
                  <th className="p-3.5">Price (TZS)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Current Stock</th>
                  <th className="p-3.5">Reorder Point</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVariants.map((item) => {
                  const key = `${item.productId}:${item.variantId}`
                  const currentStockVal = stockEdits[key] !== undefined ? stockEdits[key] : item.stock
                  const currentReorderVal = reorderEdits[key] !== undefined ? reorderEdits[key] : item.reorderPoint

                  const isLow = item.stock > 0 && item.stock <= item.reorderPoint
                  const isOut = item.stock === 0

                  return (
                    <tr key={key} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-brand-500">{item.sku}</span>
                          <span className="font-semibold text-foreground truncate max-w-[220px]">{item.productTitle}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-muted-foreground">{item.name}</td>

                      <td className="p-3.5 font-mono font-bold">{formatTZS(item.priceTZS)}</td>

                      <td className="p-3.5">
                        {isOut ? (
                          <Badge variant="destructive" className="text-[10px] font-bold">
                            Depleted
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/40 font-bold">
                            Low Stock Alert
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20 font-bold">
                            Healthy
                          </Badge>
                        )}
                      </td>

                      {/* Stock Inline Editor */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={currentStockVal}
                            onChange={(e) => setStockEdits({ ...stockEdits, [key]: Number(e.target.value) })}
                            className="w-20 h-8 font-mono text-xs"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSaveStock(item.productId, item.variantId, item.stock)}
                            className="size-8 text-emerald-600 hover:bg-emerald-500/10"
                            title="Save stock update"
                          >
                            <Save className="size-3.5" />
                          </Button>
                        </div>
                      </td>

                      {/* Reorder Point Inline Editor */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={currentReorderVal}
                            onChange={(e) => setReorderEdits({ ...reorderEdits, [key]: Number(e.target.value) })}
                            className="w-16 h-8 font-mono text-xs"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSaveReorder(item.productId, item.variantId, item.reorderPoint)}
                            className="size-8 text-primary hover:bg-primary/10"
                            title="Save reorder point"
                          >
                            <Save className="size-3.5" />
                          </Button>
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updateStock(item.productId, item.variantId, item.stock + 50)
                            toast.success(`Restocked +50 units to ${item.sku}!`)
                          }}
                          className="text-[11px] font-bold"
                        >
                          +50 Restock
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
