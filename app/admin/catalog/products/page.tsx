'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Edit,
  Eye,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  CATEGORIES,
  Product,
  addPublishedProducts,
  clearAllProducts,
  getStoredProducts,
  saveStoredProducts,
  updateCategoryCounts,
  resolveImage,
  SUPPLIERS,
} from '@/lib/mock/products'
import { formatTZS } from '@/lib/format'

export default function AdminProductsCatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)

  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('electronics')
  const [formBrand, setFormBrand] = useState('Generic')
  const [formPriceTZS, setFormPriceTZS] = useState('45000')
  const [formStock, setFormStock] = useState('100')
  const [formCountry, setFormCountry] = useState('China')
  const [formSupplier, setFormSupplier] = useState('Verified Factory Supplier')
  const [formImageUrl, setFormImageUrl] = useState('')

  function reloadProducts() {
    const list = getStoredProducts()
    setProducts([...list])
  }

  useEffect(() => {
    reloadProducts()
    window.addEventListener('lumo_catalog_updated', reloadProducts)
    return () => window.removeEventListener('lumo_catalog_updated', reloadProducts)
  }, [])

  // Filter logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search.trim() === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier?.name || '').toLowerCase().includes(search.toLowerCase())

    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory
    const matchesCountry =
      selectedCountry === 'ALL' ||
      (p.supplier?.country || '').toLowerCase().includes(selectedCountry.toLowerCase())

    return matchesSearch && matchesCat && matchesCountry
  })

  function handleDeleteSingle(id: string) {
    if (!confirm('Are you sure you want to delete this product from the marketplace catalog?')) return
    const updated = products.filter((p) => p.id !== id)
    saveStoredProducts(updated)
    setProducts(updated)
  }

  function handleClearAll() {
    clearAllProducts()
    setProducts([])
    setIsClearConfirmOpen(false)
  }

  function openCreateModal() {
    setEditingProduct(null)
    setFormTitle('')
    setFormCategory('electronics')
    setFormBrand('LUMO Factory')
    setFormPriceTZS('45000')
    setFormStock('100')
    setFormCountry('China')
    setFormSupplier('Guangzhou Direct Wholesale')
    setFormImageUrl('')
    setIsAddModalOpen(true)
  }

  function openEditModal(prod: Product) {
    setEditingProduct(prod)
    setFormTitle(prod.title)
    setFormCategory(prod.categoryId)
    setFormBrand(prod.brand)
    setFormPriceTZS(prod.fromPrice.toString())
    setFormStock((prod.variants?.[0]?.stock || 100).toString())
    setFormCountry(prod.supplier?.country || 'China')
    setFormSupplier(prod.supplier?.name || 'Verified Supplier')
    setFormImageUrl(prod.images?.[0]?.url || '')
    setIsAddModalOpen(true)
  }

  function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return

    const price = parseFloat(formPriceTZS) || 45000
    const stock = parseInt(formStock) || 100
    const img = formImageUrl.trim() || resolveImage(formTitle, formCategory)

    if (editingProduct) {
      // Update existing
      const updated = products.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            title: formTitle,
            categoryId: formCategory,
            brand: formBrand,
            fromPrice: price,
            images: [{ url: img, alt: formTitle }],
            supplier: {
              ...p.supplier,
              name: formSupplier,
              country: formCountry,
              city: formCountry,
            },
            variants: [
              {
                ...p.variants[0],
                price,
                stock,
              },
            ],
          }
        }
        return p
      })
      saveStoredProducts(updated)
      setProducts(updated)
    } else {
      // Create new
      const newId = `prod-custom-${Date.now()}`
      addPublishedProducts([
        {
          id: newId,
          slug: newId,
          title: formTitle,
          categoryId: formCategory,
          brand: formBrand,
          fromPrice: price,
          images: [{ url: img, alt: formTitle }],
          supplier: {
            id: `sup-${newId}`,
            name: formSupplier,
            rating: 4.9,
            city: formCountry,
            country: formCountry,
            flag: formCountry === 'Turkey' ? '🇹🇷' : formCountry === 'Dubai' ? '🇦🇪' : '🇨🇳',
          },
        },
      ])
      reloadProducts()
    }

    setIsAddModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/admin/catalog" />}>
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Catalog Product Directory (CRUD)</h1>
            <p className="text-xs text-muted-foreground">
              Manage, edit, delete, and publish live imported marketplace products.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-danger-600 border-danger-200 hover:bg-danger-50 gap-1.5"
            onClick={() => setIsClearConfirmOpen(true)}
          >
            <Trash2 className="size-3.5" /> Clear All Data
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" render={<Link href="/admin/catalog/import" />}>
            <UploadCloud className="size-3.5" /> Import CSV Feed
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1.5"
          >
            <Plus className="size-3.5" /> Create Product
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Total Products</span>
            <h3 className="text-2xl font-black text-foreground">{products.length}</h3>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
            <Layers className="size-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Active Categories</span>
            <h3 className="text-2xl font-black text-foreground">
              {CATEGORIES.filter((c) => c.productCount > 0).length}
            </h3>
          </div>
          <div className="p-3 bg-success-50 text-success-600 rounded-lg">
            <CheckCircle2 className="size-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Inventory Units</span>
            <h3 className="text-2xl font-black text-foreground">
              {products.reduce((acc, p) => acc + (p.variants?.[0]?.stock || 100), 0)}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <RefreshCw className="size-5" />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, brand, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border rounded-md bg-background text-xs"
            >
              <option value="ALL">All Categories ({products.length})</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="p-2 border rounded-md bg-background text-xs"
            >
              <option value="ALL">All Origins</option>
              <option value="China">China</option>
              <option value="Turkey">Turkey</option>
              <option value="Dubai">Dubai</option>
              <option value="Tanzania">Tanzania</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Directory Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <ShieldAlert className="size-10 text-muted-foreground/60" />
              <div>
                <h3 className="text-base font-bold">No Products Found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  No imported catalog products match your filter criteria or the catalog is currently empty.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" render={<Link href="/admin/catalog/import" />} className="bg-brand-600 text-white text-xs">
                  Import CSV Feed
                </Button>
                <Button size="sm" variant="outline" onClick={openCreateModal} className="text-xs">
                  Add Single Product
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground font-bold border-b">
                  <tr>
                    <th className="p-3">Product Item</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Retail Price</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Origin</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0]?.url || resolveImage(p.title, p.categoryId)}
                            alt={p.title}
                            className="size-12 object-cover rounded-md border bg-muted shrink-0"
                          />
                          <div>
                            <span className="font-bold text-foreground block text-xs line-clamp-1">{p.title}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">ID: {p.id} · Brand: {p.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {p.categoryId.replace(/-/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold text-brand-600">{formatTZS(p.fromPrice)}</td>
                      <td className="p-3 text-muted-foreground">{p.supplier?.name || 'Verified Direct'}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-medium">
                          {p.supplier?.flag || '🇨🇳'} {p.supplier?.country || 'China'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-semibold">{p.variants?.[0]?.stock || 100} pcs</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                          >
                            <Edit className="size-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            render={<Link href={`/marketplace/${p.slug}`} target="_blank" />}
                            title="View on Marketplace"
                          >
                            <Eye className="size-3.5 text-muted-foreground hover:text-brand-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteSingle(p.id)}
                            title="Delete Product"
                          >
                            <Trash2 className="size-3.5 text-danger-600 hover:text-danger-700" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-base">
                {editingProduct ? 'Edit Product Item' : 'Add New Catalog Product'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Product Title</label>
                <Input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Wireless Gaming Headphones ANC"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Brand Name</label>
                  <Input
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. LUMO Factory"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Retail Price (TZS)</label>
                  <Input
                    type="number"
                    required
                    value={formPriceTZS}
                    onChange={(e) => setFormPriceTZS(e.target.value)}
                    placeholder="45000"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Stock Quantity</label>
                  <Input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="100"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Country of Origin</label>
                  <select
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background text-xs"
                  >
                    <option value="China">China 🇨🇳</option>
                    <option value="Turkey">Turkey 🇹🇷</option>
                    <option value="Dubai">Dubai 🇦🇪</option>
                    <option value="Tanzania">Tanzania 🇹🇿</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Supplier Name</label>
                  <Input
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="Supplier / Manufacturer"
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Image URL (Optional - Auto resolved if blank)</label>
                <Input
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-brand-600 text-white hover:bg-brand-700">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150 text-center">
            <div className="mx-auto size-12 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center mb-3">
              <Trash2 className="size-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Clear All Catalog Products?</h3>
            <p className="text-xs text-muted-foreground mt-2">
              This will remove all {products.length} imported product items from your local storage. You can upload a fresh CSV feed anytime.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => setIsClearConfirmOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleClearAll} className="bg-danger-600 text-white hover:bg-danger-700 text-xs">
                Yes, Clear All Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
