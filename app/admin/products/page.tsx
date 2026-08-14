'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Edit,
  Eye,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { SafeProductImage } from '@/components/ui/product-image'
import { toast } from 'sonner'

type DatabaseProduct = {
  id: string
  title: string
  categoryId: string
  brand: string
  fromPrice: number
  images: { url: string; alt?: string }[]
  supplier?: {
    name: string
    country: string
    flag?: string
  }
  variants?: { price: number; stock: number }[]
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<DatabaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<DatabaseProduct | null>(null)

  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('electronics')
  const [formBrand, setFormBrand] = useState('Generic')
  const [formPriceTZS, setFormPriceTZS] = useState('45000')
  const [formStock, setFormStock] = useState('100')
  const [formCountry, setFormCountry] = useState('China')
  const [formSupplier, setFormSupplier] = useState('Verified Factory Supplier')
  const [formImageUrls, setFormImageUrls] = useState<string[]>([])
  const [newImageUrlInput, setNewImageUrlInput] = useState('')

  const fetchDatabaseProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (Array.isArray(data.products)) {
        setProducts(data.products)
      } else if (Array.isArray(data)) {
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch database products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseProducts()
  }, [])

  // Filter logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search.trim() === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())

    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory
    return matchesSearch && matchesCat
  })

  function handleDeleteSingle(id: string) {
    if (!confirm('Are you sure you want to delete this product from the database catalog?')) return
    setProducts(products.filter((p) => p.id !== id))
    toast.success('Product removed from database view')
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
    setFormImageUrls([])
    setNewImageUrlInput('')
    setIsAddModalOpen(true)
  }

  function openEditModal(prod: DatabaseProduct) {
    setEditingProduct(prod)
    setFormTitle(prod.title)
    setFormCategory(prod.categoryId)
    setFormBrand(prod.brand)
    setFormPriceTZS(prod.fromPrice.toString())
    setFormStock((prod.variants?.[0]?.stock || 100).toString())
    setFormCountry(prod.supplier?.country || 'China')
    setFormSupplier(prod.supplier?.name || 'Verified Supplier')
    setFormImageUrls(prod.images?.map((i) => i.url) || [])
    setNewImageUrlInput('')
    setIsAddModalOpen(true)
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return

    const price = parseFloat(formPriceTZS) || 45000
    const stock = parseInt(formStock) || 100

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          categoryId: formCategory,
          brand: formBrand,
          fromPrice: price,
          images: formImageUrls.map((url) => ({ url })),
          supplier: {
            name: formSupplier,
            country: formCountry,
          },
          variants: [{ price, stock }],
        }),
      })

      if (res.ok) {
        toast.success(editingProduct ? 'Product updated in database!' : 'New product created in PostgreSQL!')
        setIsAddModalOpen(false)
        fetchDatabaseProducts()
      } else {
        toast.error('Failed to save product to database')
      }
    } catch (error) {
      toast.error('Network error saving product')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Catalog Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage, edit, delete, and publish marketplace products stored directly in PostgreSQL database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDatabaseProducts} className="text-xs font-bold gap-1.5 h-9">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-[#FF6B00] hover:bg-[#E05E00] text-white text-xs font-bold gap-1.5 h-9"
          >
            <Plus className="size-3.5" /> Create Product
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Database Products</span>
            <h3 className="text-2xl font-black text-foreground">{products.length}</h3>
          </div>
          <div className="p-3 bg-orange-500/10 text-[#FF6B00] rounded-lg">
            <Layers className="size-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Active Categories</span>
            <h3 className="text-2xl font-black text-foreground">
              {new Set(products.map((p) => p.categoryId)).size}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
            <CheckCircle2 className="size-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Database Inventory Units</span>
            <h3 className="text-2xl font-black text-foreground">
              {products.reduce((acc, p) => acc + (p.variants?.[0]?.stock || 100), 0)}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-lg">
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
              className="pl-8 text-xs h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Directory Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
              Loading database products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <ShieldAlert className="size-10 text-muted-foreground/60" />
              <div>
                <h3 className="text-base font-bold">No Products Found in Database</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  Click "Create Product" to add your first database catalog item.
                </p>
              </div>
              <Button size="sm" onClick={openCreateModal} className="bg-[#FF6B00] hover:bg-[#E05E00] text-white text-xs font-bold">
                Add Database Product
              </Button>
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
                    <th className="p-3">Stock</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <SafeProductImage
                            src={p.images?.[0]?.url}
                            alt={p.title}
                            title={p.title}
                            category={p.categoryId}
                            className="size-12 object-cover rounded-md border bg-muted shrink-0"
                          />
                          <div>
                            <span className="font-bold text-foreground block text-xs line-clamp-1">{p.title}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">ID: {p.id.slice(0, 8)} · Brand: {p.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {p.categoryId.replace(/-/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#FF6B00]">{formatTZS(p.fromPrice)}</td>
                      <td className="p-3 text-muted-foreground">{p.supplier?.name || 'Verified Supplier'}</td>
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
                            onClick={() => handleDeleteSingle(p.id)}
                            title="Delete Product"
                          >
                            <Trash2 className="size-3.5 text-red-600 hover:text-red-700" />
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

      {/* Create / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-background border rounded-xl shadow-2xl max-w-md w-full p-4 max-h-[92vh] flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <h3 className="font-extrabold text-sm text-foreground">
                {editingProduct ? 'Edit Catalog Product' : 'Add Database Product'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold block text-[11px] mb-1">Product Title</label>
                <Input required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Product title..." className="h-9 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block text-[11px] mb-1">Category ID</label>
                  <Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="h-9 text-xs" />
                </div>
                <div>
                  <label className="font-bold block text-[11px] mb-1">Retail Price (TZS)</label>
                  <Input type="number" required value={formPriceTZS} onChange={(e) => setFormPriceTZS(e.target.value)} className="h-9 text-xs font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold">Save to Database</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
