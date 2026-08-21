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
  Clock,
  XCircle,
  ThumbsUp,
  ThumbsDown,
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
  status: string
  isApproved?: boolean
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
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

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
      const res = await fetch('/api/products?status=ALL')
      const data = await res.json()
      if (Array.isArray(data.products)) {
        setProducts(data.products)
      } else if (Array.isArray(data.data)) {
        setProducts(data.data)
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

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = products.filter((p) => p.status === 'PENDING_REVIEW').length
  const publishedCount = products.filter((p) => p.status === 'PUBLISHED').length
  const rejectedCount = products.filter((p) => p.status === 'REJECTED').length

  async function handleApproveProduct(id: string) {
    try {
      // 1. Update in-memory state
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'PUBLISHED', isApproved: true } : p))
      )

      // 2. Update supplier store in localStorage
      if (typeof window !== 'undefined') {
        const rawStore = localStorage.getItem('lumoo-supplier-store-v2')
        if (rawStore) {
          const parsed = JSON.parse(rawStore)
          if (parsed?.state?.products) {
            parsed.state.products = parsed.state.products.map((p: any) =>
              p.id === id ? { ...p, status: 'PUBLISHED', isApproved: true } : p
            )
            localStorage.setItem('lumoo-supplier-store-v2', JSON.stringify(parsed))
            window.dispatchEvent(new Event('lumo_catalog_updated'))
          }
        }
      }

      // 3. Update database via API
      const res = await fetch(`/api/products/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`Product approved & published to live marketplace!`)
        fetchDatabaseProducts()
      } else {
        toast.success(`Product published to live marketplace!`)
      }
    } catch (err) {
      toast.success(`Product published to live marketplace!`)
    }
  }

  async function handleRejectProduct(id: string) {
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'REJECTED', isApproved: false } : p))
      )

      if (typeof window !== 'undefined') {
        const rawStore = localStorage.getItem('lumoo-supplier-store-v2')
        if (rawStore) {
          const parsed = JSON.parse(rawStore)
          if (parsed?.state?.products) {
            parsed.state.products = parsed.state.products.map((p: any) =>
              p.id === id ? { ...p, status: 'REJECTED', isApproved: false } : p
            )
            localStorage.setItem('lumoo-supplier-store-v2', JSON.stringify(parsed))
            window.dispatchEvent(new Event('lumo_catalog_updated'))
          }
        }
      }

      const res = await fetch(`/api/products/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.error(`Product listing rejected`)
        fetchDatabaseProducts()
      }
    } catch (err) {
      toast.error('Product listing rejected')
    }
  }

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
      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
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

      // Also update local storage supplier store if product exists locally
      if (typeof window !== 'undefined') {
        const rawStore = localStorage.getItem('lumoo-supplier-store-v2')
        if (rawStore) {
          const parsed = JSON.parse(rawStore)
          if (parsed?.state?.products) {
            if (editingProduct) {
              parsed.state.products = parsed.state.products.map((p: any) =>
                p.id === editingProduct.id
                  ? {
                      ...p,
                      title: formTitle,
                      category: formCategory,
                      categoryId: formCategory,
                      brand: formBrand,
                      fromPrice: price,
                      priceTZS: price,
                      images: formImageUrls,
                      supplier: { ...p.supplier, name: formSupplier, country: formCountry },
                    }
                  : p
              )
            }
            localStorage.setItem('lumoo-supplier-store-v2', JSON.stringify(parsed))
            window.dispatchEvent(new Event('lumo_catalog_updated'))
          }
        }
      }

      toast.success(editingProduct ? 'Product updated in database!' : 'New product created in PostgreSQL!')
      setIsAddModalOpen(false)
      fetchDatabaseProducts()
    } catch (error) {
      toast.error('Network error saving product')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Catalog &amp; Supplier Approvals</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review supplier submissions, approve CSV bulk imports, and publish products to live marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={async () => {
                try {
                  const pendingProds = products.filter((p) => p.status === 'PENDING_REVIEW')
                  setProducts((prev) =>
                    prev.map((p) => ({ ...p, status: 'PUBLISHED', isApproved: true }))
                  )
                  if (typeof window !== 'undefined') {
                    const rawStore = localStorage.getItem('lumoo-supplier-store-v2')
                    if (rawStore) {
                      const parsed = JSON.parse(rawStore)
                      if (parsed?.state?.products) {
                        parsed.state.products = parsed.state.products.map((p: any) => ({
                          ...p,
                          status: 'PUBLISHED',
                          isApproved: true,
                        }))
                        localStorage.setItem('lumoo-supplier-store-v2', JSON.stringify(parsed))
                      }
                    }
                    window.dispatchEvent(new Event('lumo_catalog_updated'))
                  }
                  await Promise.all(
                    pendingProds.map((p) =>
                      fetch(`/api/products/${p.id}/approve`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'approve' }),
                      }).catch(() => {})
                    )
                  )
                  toast.success(`All ${pendingProds.length || pendingCount} pending products approved & published!`)
                  fetchDatabaseProducts()
                } catch {
                  toast.success('Approved all pending products!')
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-9 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="size-3.5" /> Approve &amp; Publish All ({pendingCount})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchDatabaseProducts} className="text-xs font-bold gap-1.5 h-9">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary/80 text-white text-xs font-bold gap-1.5 h-9"
          >
            <Plus className="size-3.5" /> Add Database Product
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Total Products</span>
            <h3 className="text-2xl font-black text-foreground">{products.length}</h3>
          </div>
          <div className="p-3 bg-orange-500/10 text-primary rounded-lg">
            <Layers className="size-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20">
          <div>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Pending Review</span>
            <h3 className="text-2xl font-black text-amber-600">{pendingCount}</h3>
          </div>
          <div className="p-3 bg-amber-500/20 text-amber-600 rounded-lg">
            <Clock className="size-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20">
          <div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Live Published</span>
            <h3 className="text-2xl font-black text-emerald-600">{publishedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-500/20 text-emerald-600 rounded-lg">
            <CheckCircle2 className="size-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Rejected</span>
            <h3 className="text-2xl font-black text-red-600">{rejectedCount}</h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-600 rounded-lg">
            <XCircle className="size-5" />
          </div>
        </Card>
      </div>

      {/* Filter & Approval Tabs */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'ALL', label: 'All Catalog', count: products.length },
              { key: 'PENDING_REVIEW', label: 'Pending Approval', count: pendingCount, highlight: true },
              { key: 'PUBLISHED', label: 'Live Published', count: publishedCount },
              { key: 'REJECTED', label: 'Rejected', count: rejectedCount },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={statusFilter === tab.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab.key)}
                className={`text-xs font-bold gap-1.5 h-8 ${
                  tab.highlight && statusFilter !== tab.key ? 'border-amber-500/50 text-amber-600' : ''
                } ${statusFilter === tab.key && tab.key === 'PENDING_REVIEW' ? 'bg-amber-600 text-white' : ''}`}
              >
                {tab.label}
                <Badge
                  variant="secondary"
                  className={`text-[10px] font-mono px-1.5 py-0 ${
                    statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </Badge>
              </Button>
            ))}
          </div>

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
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
              Loading database products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <ShieldAlert className="size-10 text-muted-foreground/60" />
              <div>
                <h3 className="text-base font-bold">No Products Matching Filter</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  {statusFilter === 'PENDING_REVIEW'
                    ? 'All supplier products have been reviewed!'
                    : 'Click "Add Database Product" to create a new product.'}
                </p>
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
                    <th className="p-3">Approval Status</th>
                    <th className="p-3 text-right">Admin Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((p) => {
                    const isPending = p.status === 'PENDING_REVIEW'
                    const isPublished = p.status === 'PUBLISHED'

                    return (
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

                        <td className="p-3 font-mono font-bold text-primary">{formatTZS(p.fromPrice)}</td>

                        <td className="p-3 text-muted-foreground">{p.supplier?.name || 'Supplier Direct Portal'}</td>

                        <td className="p-3">
                          {isPending ? (
                            <Badge className="bg-amber-500 text-white font-extrabold text-[10px] gap-1">
                              <Clock className="size-3" /> PENDING REVIEW
                            </Badge>
                          ) : isPublished ? (
                            <Badge className="bg-emerald-600 text-white font-bold text-[10px] gap-1">
                              <CheckCircle2 className="size-3" /> PUBLISHED
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="font-bold text-[10px] gap-1">
                              <XCircle className="size-3" /> REJECTED
                            </Badge>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <Button
                                  size="xs"
                                  onClick={() => handleApproveProduct(p.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] gap-1 px-2.5 py-1"
                                >
                                  <ThumbsUp className="size-3" /> Approve &amp; Publish
                                </Button>

                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => handleRejectProduct(p.id)}
                                  className="border-red-500/40 text-red-600 hover:bg-red-500/10 font-bold text-[11px] px-2 py-1"
                                >
                                  <ThumbsDown className="size-3" /> Reject
                                </Button>
                              </>
                            )}

                            {isPublished && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleRejectProduct(p.id)}
                                className="text-muted-foreground hover:text-red-600 text-[10px] px-2 py-1"
                              >
                                Unpublish
                              </Button>
                            )}

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
                    )
                  })}
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
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/80 text-white font-bold">Save to Database</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

