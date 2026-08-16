'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Boxes,
  Edit2,
  ExternalLink,
  Plus,
  Search,
  Sparkles,
  Trash2,
  CheckCircle,
  AlertCircle,
  Package,
} from 'lucide-react'
import { SafeProductImage } from '@/components/ui/product-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatTZS } from '@/lib/format'
import { useSupplierStore, SupplierProduct } from '@/lib/stores/supplier-store'
import { toast } from 'sonner'

export default function SupplierProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useSupplierStore()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBrand, setEditBrand] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPrice, setEditPrice] = useState(0)
  const [editDescription, setEditDescription] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [editImageUrlInput, setEditImageUrlInput] = useState('')

  // Delete Confirmation Modal State
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const categories = Array.from(new Set(products.map((p) => p.category)))

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSearch =
      search.trim() === '' ||
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.brand.toLowerCase().includes(search.toLowerCase()) ||
      product.variants.some((v) => v.sku.toLowerCase().includes(search.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  function openEditModal(prod: SupplierProduct) {
    setEditingProduct(prod)
    setEditTitle(prod.title)
    setEditBrand(prod.brand)
    setEditCategory(prod.category)
    setEditPrice(prod.fromPriceTZS)
    setEditDescription(prod.description)
    setEditImages(prod.images || ['/images/products/phone-case-armour.png'])
    setEditImageUrlInput('')
  }

  function handleEditFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string
        if (base64Url) {
          setEditImages((prev) => [...prev, base64Url])
        }
      }
      reader.readAsDataURL(file)
    })

    toast.success(`Uploaded ${files.length} local image(s)!`)
  }

  function handleAddEditImageUrl() {
    if (!editImageUrlInput.trim()) {
      toast.error('Please enter a valid image URL')
      return
    }
    setEditImages([...editImages, editImageUrlInput.trim()])
    setEditImageUrlInput('')
    toast.success('Image URL added!')
  }

  function handleSaveEdit() {
    if (!editingProduct) return
    if (!editTitle.trim()) {
      toast.error('Product title cannot be empty')
      return
    }

    updateProduct(editingProduct.id, {
      title: editTitle.trim(),
      brand: editBrand.trim(),
      category: editCategory.trim(),
      fromPriceTZS: editPrice,
      description: editDescription.trim(),
      images: editImages.length > 0 ? editImages : ['/images/products/phone-case-armour.png'],
    })

    toast.success(`Product "${editTitle}" updated successfully!`)
    setEditingProduct(null)
  }

  function handleDeleteConfirm() {
    if (!deletingProductId) return
    deleteProduct(deletingProductId)
    toast.success('Product deleted from catalog')
    setDeletingProductId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Product Catalogue Management</h1>
          <p className="text-sm text-muted-foreground">
            Add, update, or remove product listings, retail TZS prices, and stock SKU matrices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!confirm('Are you sure you want to delete all imported products from catalog and database?')) return
              try {
                await fetch('/api/products', { method: 'DELETE' })
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('lumoo-supplier-store-v2')
                  localStorage.removeItem('lumo_published_products')
                  window.dispatchEvent(new Event('lumo_catalog_updated'))
                  window.location.reload()
                }
              } catch {}
            }}
            className="text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400"
          >
            Clear All Products
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/supplier/products/import" />}>
            Bulk Import CSV
          </Button>
          <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white font-bold" render={<Link href="/supplier/products/new" />}>
            <Plus className="size-4 mr-1" />
            Add New Product
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="text-xs"
            >
              All Categories ({products.length})
            </Button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length
              return (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs"
                >
                  {cat} ({count})
                </Button>
              )
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search title, brand, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y border-t border-border">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No products found matching your search.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0)

                return (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border bg-muted flex items-center justify-center">
                        <SafeProductImage
                          src={product.images}
                          alt={product.title}
                          title={product.title}
                          category={product.category}
                          className="size-full object-cover rounded-xl"
                        />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{product.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {product.variants.length} SKU{product.variants.length > 1 ? 's' : ''}
                          </Badge>
                          <Badge
                            className={`text-[10px] capitalize ${
                              product.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'
                            }`}
                          >
                            {product.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Brand: <strong className="text-foreground">{product.brand}</strong> · Category:{' '}
                          <strong className="text-foreground">{product.category}</strong>
                        </span>
                        <span className="text-xs font-mono font-extrabold text-brand-500">
                          {formatTZS(product.fromPriceTZS)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                      <Badge
                        variant={totalStock > 0 ? 'secondary' : 'destructive'}
                        className="text-xs font-bold"
                      >
                        {totalStock > 0 ? `${totalStock} units in stock` : 'Out of stock'}
                      </Badge>

                      {/* CRUD Actions Buttons */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateProduct(product.id, {
                              status: product.status === 'active' ? 'draft' : 'active',
                            })
                          }
                          className="text-xs"
                          title="Toggle Active/Draft Status"
                        >
                          {product.status === 'active' ? 'Unpublish' : 'Publish'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(product)}
                          className="text-xs font-semibold text-primary"
                        >
                          <Edit2 className="size-3.5 mr-1" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingProductId(product.id)}
                          className="text-xs font-semibold text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Dialog open onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">Edit Product Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Product Title</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-xs h-9" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Brand</label>
                  <Input value={editBrand} onChange={(e) => setEditBrand(e.target.value)} className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Category</label>
                  <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="text-xs h-9" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Starting Retail Price (TZS)</label>
                <Input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Description</label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="text-xs h-20"
                />
              </div>

              {/* Image Uploader inside Edit Modal */}
              <div className="space-y-3 pt-2 border-t">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span>Product Images ({editImages.length})</span>
                  <span className="text-[10px] text-muted-foreground font-normal">First image is cover</span>
                </label>

                {/* Upload Local File or Paste URL */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste Image URL (https://...)"
                      value={editImageUrlInput}
                      onChange={(e) => setEditImageUrlInput(e.target.value)}
                      className="text-xs font-mono h-8"
                    />
                    <Button type="button" size="xs" onClick={handleAddEditImageUrl} className="bg-brand-500 hover:bg-brand-600 text-white font-bold shrink-0">
                      Add URL
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => document.getElementById('editModalLocalImageInput')?.click()}
                      className="text-xs w-full border-dashed border-brand-500/40 text-brand-500 hover:bg-brand-500/10 font-bold"
                    >
                      Upload Local Photos
                    </Button>
                    <input
                      id="editModalLocalImageInput"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleEditFileUpload}
                    />
                  </div>
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {editImages.map((imgUrl, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={`Product thumbnail ${index + 1}`} className="object-cover size-full" />
                      <button
                        type="button"
                        onClick={() => {
                          if (editImages.length <= 1) {
                            toast.error('Product must have at least 1 image')
                            return
                          }
                          setEditImages(editImages.filter((_, i) => i !== index))
                        }}
                        className="absolute top-1 right-1 size-5 rounded bg-red-600/90 text-white text-[10px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        title="Delete image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <Dialog open onOpenChange={() => setDeletingProductId(null)}>
          <DialogContent className="max-w-sm p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-destructive flex items-center gap-2">
                <AlertCircle className="size-5" />
                Delete Product?
              </DialogTitle>
            </DialogHeader>

            <p className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this product and its associated SKU variants from your catalog?
            </p>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setDeletingProductId(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDeleteConfirm} className="font-bold">
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
