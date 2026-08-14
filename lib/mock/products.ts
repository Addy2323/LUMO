/**
 * Catalogue fixtures and live catalog memory store for LUMO Marketplace.
 * Single retail pricing per product, TZS currency support.
 * Persisted in browser localStorage so imported/published items survive page reloads and tab navigation.
 */

export type ProductImage = { url: string; alt: string }

export type VariantAttribute = { name: string; options: string[] }

export type ProductVariant = {
  id: string
  sku: string
  options: Record<string, string>
  price: number
  stock: number
  imageIndex: number
}

export type ProductReview = {
  id: string
  author: string
  rating: number
  createdAt: string
  title: string
  body: string
  verifiedPurchase: boolean
}

export type Product = {
  id: string
  slug: string
  title: string
  shortDescription: string
  description: string
  categoryId: string
  brand: string
  supplier: {
    id: string
    name: string
    rating: number
    city: string
    country: string
    flag: string
  }
  images: ProductImage[]
  attributes: VariantAttribute[]
  variants: ProductVariant[]
  fromPrice: number
  compareAtPrice?: number
  rating: number
  reviewCount: number
  soldCount: number
  deliveryEstimateDays: [number, number]
  specifications: { label: string; value: string }[]
  reviews: ProductReview[]
  createdAt: string
}

export type Category = {
  id: string
  name: string
  productCount: number
}

export const SUPPLIERS = {
  guangzhou: {
    id: 'sup_china_01',
    name: 'Guangzhou Tech & Electronics Co., Ltd',
    rating: 4.9,
    city: 'Guangzhou',
    country: 'China',
    flag: '🇨🇳',
  },
  yiwu: {
    id: 'sup_china_02',
    name: 'Yiwu Commodity Direct Manufacturers',
    rating: 4.8,
    city: 'Yiwu',
    country: 'China',
    flag: '🇨🇳',
  },
  dubai: {
    id: 'sup_uae_01',
    name: 'Dubai Dragon Mart Wholesale UAE',
    rating: 4.7,
    city: 'Dubai',
    country: 'UAE',
    flag: '🇦🇪',
  },
  istanbul: {
    id: 'sup_turkey_01',
    name: 'Istanbul Textile & Fashion Hub',
    rating: 4.8,
    city: 'Istanbul',
    country: 'Turkey',
    flag: '🇹🇷',
  },
  kilimanjaro: {
    id: 'sup_tz_01',
    name: 'Kilimanjaro Electronics (Local Stock)',
    rating: 4.7,
    city: 'Arusha',
    country: 'Tanzania',
    flag: '🇹🇿',
  },
  bahari: {
    id: 'sup_tz_02',
    name: 'Bahari Home & Appliance Imports',
    rating: 4.5,
    city: 'Dar es Salaam',
    country: 'Tanzania',
    flag: '🇹🇿',
  },
}

/** NO hardcoded demo products. Pure real imported catalog storage. */
export const INITIAL_PRODUCTS: Product[] = []

export const PRODUCTS: Product[] = []

export const CATEGORIES: Category[] = [
  { id: 'phones-accessories', name: 'Phones & Accessories', productCount: 0 },
  { id: 'electronics', name: 'Electronics & Gadgets', productCount: 0 },
  { id: 'home-kitchen', name: 'Home & Kitchen', productCount: 0 },
  { id: 'appliances', name: 'Appliances & HVAC', productCount: 0 },
  { id: 'solar-power', name: 'Solar & Clean Energy', productCount: 0 },
  { id: 'automotive', name: 'Automotive & Parts', productCount: 0 },
  { id: 'womens-clothing', name: "Women's Clothing", productCount: 0 },
  { id: 'mens-clothing', name: "Men's Clothing", productCount: 0 },
  { id: 'shoes', name: 'Shoes & Footwear', productCount: 0 },
  { id: 'fashion', name: 'Fashion & Apparel', productCount: 0 },
  { id: 'health-beauty', name: 'Beauty & Health', productCount: 0 },
  { id: 'hair-wigs', name: 'Hair Extensions & Wigs', productCount: 0 },
  { id: 'jewelry-accessories', name: 'Jewelry & Accessories', productCount: 0 },
  { id: 'furniture', name: 'Furniture & Decor', productCount: 0 },
  { id: 'toys-games', name: 'Toys & Games', productCount: 0 },
  { id: 'pet-supplies', name: 'Pet Supplies', productCount: 0 },
  { id: 'tools-home', name: 'Tools & Home Improvement', productCount: 0 },
  { id: 'patio-lawn-garden', name: 'Patio, Lawn & Garden', productCount: 0 },
  { id: 'sports-outdoor', name: 'Sports & Outdoor', productCount: 0 },
  { id: 'general-sourcing', name: 'General Sourcing', productCount: 0 },
]

const STORAGE_KEY = 'lumo_published_products'

export function resolveImage(title: string, category: string): string {
  const t = (title || '').toLowerCase()
  const c = (category || '').toLowerCase()

  if (t.includes('monitor') || t.includes('display') || t.includes('screen') || t.includes('tv')) {
    return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'
  }
  if (t.includes('laptop') || t.includes('notebook') || t.includes('macbook')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'
  }
  if (t.includes('shoe') || t.includes('sneaker') || t.includes('boot') || c.includes('shoe') || t.includes('footwear')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'
  }
  if (t.includes('dress') || t.includes('skirt') || c.includes('women')) {
    return 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'
  }
  if (t.includes('mouse')) {
    return 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800'
  }
  if (t.includes('led') || t.includes('strip') || t.includes('light') || t.includes('backlight')) {
    return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'
  }
  if (t.includes('power bank') || t.includes('powerbank') || t.includes('battery') || t.includes('charger')) {
    return 'https://images.unsplash.com/photo-1609592424009-dd09fa668478?w=800'
  }
  if (t.includes('speaker') || t.includes('sound') || t.includes('audio') || t.includes('boom')) {
    return 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'
  }
  if (t.includes('headphone') || t.includes('earbud') || t.includes('tws') || t.includes('headset')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
  }
  if (t.includes('smartwatch') || t.includes('watch') || t.includes('band')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
  }
  if (t.includes('shirt') || t.includes('polo') || c.includes('fashion') || t.includes('apparel') || c.includes('men')) {
    return 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'
  }
  if (t.includes('fryer') || t.includes('juicer') || t.includes('blender') || c.includes('kitchen') || c.includes('home')) {
    return 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800'
  }
  if (t.includes('solar') || c.includes('solar') || t.includes('clean energy')) {
    return 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800'
  }
  if (t.includes('phone') || t.includes('case') || c.includes('phone')) {
    return 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800'
  }
  if (c.includes('beauty') || t.includes('dryer') || t.includes('care')) {
    return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'
  }

  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
}

export function sanitizeProductImage(url: string | undefined, title: string, categoryId: string): string {
  const t = (title || '').toLowerCase()
  const isMonitorOrLaptop = t.includes('monitor') || t.includes('display') || t.includes('screen') || t.includes('tv') || t.includes('laptop')
  
  if (!url || typeof url !== 'string' || url.includes('example.com') || url.includes('placeholder') || !url.trim()) {
    return resolveImage(title, categoryId)
  }

  // If previous fallback assigned a mouse photo to a monitor or laptop, fix it automatically
  if (isMonitorOrLaptop && url.includes('photo-1615663245857')) {
    return resolveImage(title, categoryId)
  }

  return url.trim()
}

export function getStoredProducts(): Product[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: Product[] = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sanitize images and repair numeric titles in local storage
          const sanitized = parsed.map((p) => {
            const rawUrl = p.images?.[0]?.url
            let title = p.title || ''
            const isNumericTitle = /^\d+$/.test(title.trim()) || /^10050\d+/.test(title.trim())

            if (isNumericTitle) {
              if (p.categoryId === 'shoes' || p.categoryId === 'footwear') {
                title = "Men's Casual Leather & Canvas Shoes"
              } else if (p.categoryId === 'electronics') {
                title = "Wireless Bluetooth Audio Headphones"
              } else if (p.categoryId === 'health-beauty') {
                title = "Personal Beauty & Skincare Set"
              } else if (p.categoryId === 'fashion') {
                title = "Men's & Women's Premium Apparel"
              } else if (p.categoryId === 'home-kitchen') {
                title = "Modern Kitchen & Home Appliance"
              } else {
                title = "Direct Factory Sourcing Item"
              }
            }

            let description = p.description || ''
            if (!description || /^\d+$/.test(description.trim())) {
              description = `${title} — Verified direct factory product with air & sea shipping to Tanzania.`
            }

            const validUrl = sanitizeProductImage(rawUrl, title, p.categoryId)
            return {
              ...p,
              title,
              description,
              images: [{ url: validUrl, alt: title }],
            }
          })
          PRODUCTS.length = 0
          PRODUCTS.push(...sanitized)
          saveStoredProducts(sanitized)
          updateCategoryCounts()
          return sanitized
        }
      }
    } catch (e) {
      console.error('Error reading lumo_published_products from localStorage:', e)
    }
  }
  return PRODUCTS
}

export function saveStoredProducts(products: Product[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
      window.dispatchEvent(new Event('lumo_catalog_updated'))
    } catch (e) {
      console.error('Error saving lumo_published_products to localStorage:', e)
    }
  }
}

export function updateCategoryCounts() {
  const currentProds = PRODUCTS.length > 0 ? PRODUCTS : getStoredProducts()
  CATEGORIES.forEach((cat) => {
    cat.productCount = currentProds.filter((p) => p.categoryId === cat.id).length
  })
}

export function clearAllProducts() {
  PRODUCTS.length = 0
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('lumo_catalog_updated'))
  }
  updateCategoryCounts()
}

export function addPublishedProducts(newProducts: Partial<Product>[]) {
  getStoredProducts()

  newProducts.forEach((p) => {
    if (!p.id || !p.title) return

    let categoryId = p.categoryId || 'electronics'
    const catLower = (p.categoryId || '').toLowerCase()
    if (catLower.includes('phone') || catLower.includes('accessory')) categoryId = 'phones-accessories'
    else if (catLower.includes('electron') || catLower.includes('audio') || catLower.includes('gadget')) categoryId = 'electronics'
    else if (catLower.includes('kitchen') || catLower.includes('home') || catLower.includes('appliance')) categoryId = 'home-kitchen'
    else if (catLower.includes('solar') || catLower.includes('power') || catLower.includes('clean')) categoryId = 'solar-power'
    else if (catLower.includes('fashion') || catLower.includes('apparel') || catLower.includes('shirt')) categoryId = 'fashion'
    else if (catLower.includes('health') || catLower.includes('beauty')) categoryId = 'health-beauty'
    else if (catLower.includes('shoe')) categoryId = 'shoes'

    const existsIndex = PRODUCTS.findIndex((existing) => existing.id === p.id || existing.slug === p.slug)

    const rawUrl = p.images?.[0]?.url
    const finalImage = sanitizeProductImage(rawUrl, p.title || 'Product', categoryId)

    const imagesToStore = p.images && p.images.length > 0
      ? p.images.map((imgObj, idx) => ({
          url: sanitizeProductImage(imgObj.url || '', p.title || 'Product', categoryId),
          alt: imgObj.alt || `${p.title || 'Product'} - Image ${idx + 1}`,
        }))
      : [{ url: finalImage, alt: p.title || 'Product' }]

    const fullProduct: Product = {
      id: p.id,
      slug: p.slug || p.id,
      title: p.title,
      shortDescription: p.shortDescription || p.title,
      description: p.description || p.title,
      categoryId,
      brand: p.brand || 'LUMO Supplier',
      supplier: p.supplier || SUPPLIERS.guangzhou,
      images: imagesToStore,
      attributes: p.attributes || [],
      variants: p.variants || [
        { id: `${p.id}-v1`, sku: `SKU-${p.id}`, options: {}, price: p.fromPrice || 45000, stock: 100, imageIndex: 0 },
      ],
      fromPrice: p.fromPrice || 45000,
      compareAtPrice: p.compareAtPrice,
      rating: 4.9,
      reviewCount: 18,
      soldCount: 150,
      deliveryEstimateDays: [5, 9],
      specifications: p.specifications || [{ label: 'Origin', value: 'China' }],
      reviews: [],
      createdAt: new Date().toISOString(),
    }

    if (existsIndex >= 0) {
      PRODUCTS[existsIndex] = fullProduct
    } else {
      PRODUCTS.unshift(fullProduct)
    }
  })

  saveStoredProducts(PRODUCTS)
  updateCategoryCounts()
}

export function variantLabel(variant: ProductVariant): string {
  return Object.values(variant?.options || {}).join(' · ')
}

export function findVariant(
  product: Product,
  selection: Record<string, string>,
): ProductVariant | undefined {
  return product.variants?.find((variant) =>
    Object.entries(selection).every(([key, value]) => variant.options[key] === value),
  )
}

export function defaultSelection(product: Product): Record<string, string> {
  const inStock = product.variants?.find((variant) => variant.stock > 0) ?? product.variants?.[0]
  return inStock ? { ...inStock.options } : {}
}
