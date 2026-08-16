'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldCheck,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIES } from '@/lib/mock/products'
import { useSupplierStore } from '@/lib/stores/supplier-store'
import { toast } from 'sonner'

type VariantInput = {
  id: string
  sku: string
  label: string
  price: number
  stock: number
}

const PRESET_DEMO_IMAGES = [
  '/images/products/phone-case-armour.png',
  '/images/products/solar-panel.png',
  '/images/products/leather-boots.png',
]

export default function NewProductPage() {
  const addProduct = useSupplierStore((s) => s.addProduct)

  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].name)
  const [shortDesc, setShortDesc] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Image Upload state (supports local base64 & external URLs)
  const [images, setImages] = useState<string[]>([
    '/images/products/phone-case-armour.png',
  ])
  const [imageUrlInput, setImageUrlInput] = useState('')

  // Variant Matrix state
  const [variants, setVariants] = useState<VariantInput[]>([
    { id: 'v1', sku: 'KIL-PROD-01-A', label: 'Standard · Black', price: 45000, stock: 50 },
    { id: 'v2', sku: 'KIL-PROD-01-B', label: 'Standard · White', price: 45000, stock: 30 },
  ])

  function handleAddImageUrl() {
    if (!imageUrlInput.trim()) {
      toast.error('Please enter a valid image URL')
      return
    }
    setImages([...images, imageUrlInput.trim()])
    setImageUrlInput('')
    toast.success('Image URL added!')
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string
        if (base64Url) {
          setImages((prev) => [...prev, base64Url])
        }
      }
      reader.readAsDataURL(file)
    })

    toast.success(`Uploaded ${files.length} local image(s)!`)
  }

  function handleRemoveImage(index: number) {
    if (images.length <= 1) {
      toast.error('Product must have at least 1 image')
      return
    }
    setImages(images.filter((_, i) => i !== index))
  }

  function handleSetCoverImage(index: number) {
    const selected = images[index]
    const rest = images.filter((_, i) => i !== index)
    setImages([selected, ...rest])
    toast.success('Set as primary cover image!')
  }

  function handleAddVariant() {
    setVariants([
      ...variants,
      {
        id: `v_${Date.now()}`,
        sku: `KIL-PROD-${String(variants.length + 1).padStart(2, '0')}`,
        label: 'New Option',
        price: 45000,
        stock: 20,
      },
    ])
  }

  function handleRemoveVariant(id: string) {
    if (variants.length <= 1) return
    setVariants(variants.filter((v) => v.id !== id))
  }

  function handleUpdateVariant(id: string, field: keyof VariantInput, value: any) {
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !shortDesc) return

    const minPrice = Math.min(...variants.map((v) => v.price))

    const newProd = {
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: brand.trim() || 'Generic Brand',
      category: categoryId,
      description: description.trim() || shortDesc.trim(),
      status: 'PENDING_REVIEW',
      fromPriceTZS: minPrice,
      images: images.length > 0 ? images : ['/images/products/phone-case-armour.png'],
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.label,
        priceTZS: v.price,
        costPriceTZS: Math.round(v.price * 0.7),
        stock: v.stock,
        reorderPoint: 5,
        attributes: { option: v.label },
      })),
    }

    // 1. Add to local store
    addProduct(newProd as any)

    // 2. Persist to PostgreSQL Database
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProd),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast.success('Product saved to PostgreSQL database! Queued for Admin review.')
        }
      })
      .catch((err) => console.error('Failed to post product to database API:', err))

    toast.success('New product listed in catalog!')
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" render={<Link href="/supplier/products" />}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add New Product</h1>
          <p className="text-sm text-muted-foreground">
            List a new product in the Lumo marketplace with single TZS retail prices.
          </p>
        </div>
      </div>

      <Card className="border-info-500/20 bg-info-50/40 dark:bg-info-950/20">
        <CardContent className="flex items-start gap-3 p-4 text-xs text-info-800 dark:text-info-400">
          <ShieldCheck className="size-4 shrink-0 text-info-600 mt-0.5" />
          <span>
            <strong>Pricing Policy:</strong> All product variants must be priced in single retail TZS units. Tiered pricing (MOQ/wholesale discounts) is not supported.
          </span>
        </CardContent>
      </Card>

      {submitted ? (
        <Card className="border-success-500/20 bg-success-50/40 dark:bg-success-950/20">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="size-12 text-success-600" />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Product Submitted for Catalog Review</h2>
              <p className="text-xs text-muted-foreground max-w-md">
                Your product listing <span className="font-semibold text-foreground">{title}</span> with {variants.length} variant(s) has been submitted to the Lumo catalog team for quality check.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button size="sm" render={<Link href="/supplier/products" />}>
                Return to Product Catalog
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">General Product Information</CardTitle>
              <CardDescription>Product title, category, brand, and descriptions.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Product Title</label>
                  <Input
                    placeholder="e.g. 65W GaN Fast Wall Charger"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Brand</label>
                  <Input
                    placeholder="e.g. Kilimanjaro Tech"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Short Summary</label>
                <Input
                  placeholder="Key features summary (max 120 characters)..."
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Detailed Description</label>
                <Textarea
                  placeholder="Full technical details, usage instructions, and warranty terms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Media & Image Uploader */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <ImageIcon className="size-5 text-brand-500" />
                Product Imagery &amp; Media Upload
              </CardTitle>
              <CardDescription className="text-xs">
                Upload high-resolution local product images or paste hosted image web URLs. First image is used as primary cover.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Dual Uploader Inputs */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* 1. Local File Drag & Drop */}
                <div
                  className="border-2 border-dashed border-border hover:border-brand-500/50 transition-colors rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2 bg-muted/20 cursor-pointer"
                  onClick={() => document.getElementById('productLocalImageInput')?.click()}
                >
                  <Upload className="size-8 text-brand-500" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Click or Drag &amp; Drop Local Photos</p>
                    <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP up to 10MB per image</p>
                  </div>
                  <input
                    id="productLocalImageInput"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {/* 2. Hosted Web URL Input */}
                <div className="flex flex-col justify-between p-5 rounded-2xl border border-border bg-card space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      <LinkIcon className="size-3.5 text-brand-500" />
                      Paste Web Hosted Image URL
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Direct link from Cloudinary, Unsplash, CJ Dropshipping, or supplier CDN.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/images/product-01.jpg"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="text-xs font-mono h-9"
                    />
                    <Button type="button" size="sm" onClick={handleAddImageUrl} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shrink-0">
                      Add URL
                    </Button>
                  </div>

                  {/* Preset Demo Images Quick Add */}
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-semibold">Quick Presets:</span>
                    <div className="flex gap-1.5">
                      {PRESET_DEMO_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (!images.includes(preset)) {
                              setImages([...images, preset])
                              toast.success('Preset image added!')
                            }
                          }}
                          className="text-[10px] bg-muted hover:bg-brand-500/10 hover:text-brand-500 border rounded px-2 py-0.5 font-mono transition-colors"
                        >
                          Demo {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Gallery Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Uploaded Gallery ({images.length} Image{images.length > 1 ? 's' : ''})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">⭐ First image is primary cover</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((imgUrl, index) => {
                    const isCover = index === 0
                    return (
                      <div
                        key={index}
                        className={`relative group rounded-xl overflow-hidden border-2 bg-muted/40 transition-all ${
                          isCover ? 'border-brand-500 shadow-md ring-2 ring-brand-500/20' : 'border-border hover:border-muted-foreground/40'
                        }`}
                      >
                        <div className="aspect-square relative w-full overflow-hidden bg-white/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Product image ${index + 1}`}
                            className="object-cover size-full group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Cover Badge */}
                        {isCover && (
                          <div className="absolute top-2 left-2 bg-brand-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                            <Star className="size-2.5 fill-white" />
                            Primary Cover
                          </div>
                        )}

                        {/* Action Overlays */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="size-7 rounded-lg bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                              title="Remove image"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          {!isCover && (
                            <Button
                              type="button"
                              size="xs"
                              onClick={() => handleSetCoverImage(index)}
                              className="w-full bg-white/90 hover:bg-white text-black font-extrabold text-[10px] py-1"
                            >
                              Set as Cover
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variant Matrix Builder */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Variant Matrix & Pricing (TZS)</CardTitle>
                <CardDescription>Define SKUs, option attributes, prices, and initial stock.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
                <Plus data-icon="inline-start" />
                Add Variant Row
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-t border-border">
                {variants.map((v) => (
                  <div key={v.id} className="grid grid-cols-12 gap-3 p-4 items-center text-xs">
                    <div className="col-span-3 flex flex-col gap-1">
                      <label className="font-medium text-[11px] text-muted-foreground">SKU Code</label>
                      <Input
                        value={v.sku}
                        onChange={(e) => handleUpdateVariant(v.id, 'sku', e.target.value)}
                        className="text-xs font-mono"
                        required
                      />
                    </div>

                    <div className="col-span-4 flex flex-col gap-1">
                      <label className="font-medium text-[11px] text-muted-foreground">Variant Option Label</label>
                      <Input
                        value={v.label}
                        onChange={(e) => handleUpdateVariant(v.id, 'label', e.target.value)}
                        placeholder="e.g. 256GB · Black"
                        className="text-xs"
                        required
                      />
                    </div>

                    <div className="col-span-3 flex flex-col gap-1">
                      <label className="font-medium text-[11px] text-muted-foreground">Retail Price (TZS)</label>
                      <Input
                        type="number"
                        value={v.price}
                        onChange={(e) => handleUpdateVariant(v.id, 'price', Number(e.target.value))}
                        className="text-xs tnum"
                        required
                      />
                    </div>

                    <div className="col-span-1 flex flex-col gap-1">
                      <label className="font-medium text-[11px] text-muted-foreground">Stock</label>
                      <Input
                        type="number"
                        value={v.stock}
                        onChange={(e) => handleUpdateVariant(v.id, 'stock', Number(e.target.value))}
                        className="text-xs tnum"
                        required
                      />
                    </div>

                    <div className="col-span-1 flex justify-end pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-danger"
                        onClick={() => handleRemoveVariant(v.id)}
                        disabled={variants.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" render={<Link href="/supplier/products" />}>
              Cancel
            </Button>
            <Button type="submit">Submit Product Listing</Button>
          </div>
        </form>
      )}
    </div>
  )
}
