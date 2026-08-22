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

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-ph-01',
    slug: 'flagship-ultra-5g-smartphone',
    title: 'Flagship Ultra 5G Smartphone 256GB',
    shortDescription: '6.7" AMOLED 120Hz Display, 108MP Camera, 5000mAh Battery',
    description: 'Direct factory imported 5G flagship smartphone with dual SIM support, 67W fast charging, and Tanzanian network compatibility.',
    categoryId: 'phones-accessories',
    brand: 'TechMaster',
    supplier: SUPPLIERS.guangzhou,
    images: [{ url: '/images/products/smartphone.png', alt: 'Flagship Ultra 5G Smartphone' }],
    attributes: [{ name: 'Storage', options: ['128GB', '256GB', '512GB'] }],
    variants: [
      { id: 'v-ph-1', sku: 'TM-PH-128', options: { Storage: '128GB' }, price: 850000, stock: 45, imageIndex: 0 },
      { id: 'v-ph-2', sku: 'TM-PH-256', options: { Storage: '256GB' }, price: 980000, stock: 30, imageIndex: 0 },
    ],
    fromPrice: 850000,
    compareAtPrice: 1050000,
    rating: 4.9,
    reviewCount: 34,
    soldCount: 240,
    deliveryEstimateDays: [5, 10],
    specifications: [{ label: 'RAM', value: '12GB' }, { label: 'Battery', value: '5000mAh' }],
    reviews: [],
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'prod-el-01',
    slug: 'ultra-slim-4k-oled-laptop',
    title: 'Ultra-Slim 16" 4K OLED Executive Laptop',
    shortDescription: 'Intel Core i7 13th Gen, 32GB RAM, 1TB NVMe SSD',
    description: 'High-performance ultrabook with 4K touch display, aluminum unibody chassis, and 14-hour battery life.',
    categoryId: 'electronics',
    brand: 'AeroBook',
    supplier: SUPPLIERS.guangzhou,
    images: [{ url: '/categories/electronics.png', alt: 'Ultra-Slim 4K Laptop' }],
    attributes: [{ name: 'RAM', options: ['16GB', '32GB'] }],
    variants: [{ id: 'v-el-1', sku: 'AB-LAP-16', options: { RAM: '32GB' }, price: 2450000, stock: 15, imageIndex: 0 }],
    fromPrice: 2450000,
    compareAtPrice: 2800000,
    rating: 4.9,
    reviewCount: 28,
    soldCount: 110,
    deliveryEstimateDays: [7, 14],
    specifications: [{ label: 'Display', value: '16" 4K OLED' }],
    reviews: [],
    createdAt: '2026-01-18T08:00:00Z',
  },
  {
    id: 'prod-sol-01',
    slug: '5kw-hybrid-solar-inverter-system',
    title: '5KW Hybrid Solar Inverter & LiFePO4 Lithium Battery Kit',
    shortDescription: 'Pure Sine Wave 48V, MPPT Charge Controller, 10kWh Storage',
    description: 'Complete commercial & residential hybrid solar power package with smart app monitoring and 10-year battery lifespan.',
    categoryId: 'solar-power',
    brand: 'SunPower Direct',
    supplier: SUPPLIERS.guangzhou,
    images: [{ url: '/images/products/solar-kit.png', alt: '5KW Hybrid Solar System' }],
    attributes: [{ name: 'Battery Capacity', options: ['5kWh', '10kWh'] }],
    variants: [{ id: 'v-sol-1', sku: 'SP-SOL-10K', options: { 'Battery Capacity': '10kWh' }, price: 4800000, stock: 25, imageIndex: 0 }],
    fromPrice: 4800000,
    compareAtPrice: 5500000,
    rating: 5.0,
    reviewCount: 42,
    soldCount: 88,
    deliveryEstimateDays: [14, 21],
    specifications: [{ label: 'Inverter Power', value: '5000W' }],
    reviews: [],
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'prod-wm-01',
    slug: 'tanzanian-handmade-kitenge-dress',
    title: "Handmade Premium Kitenge Women's Fashion Dress",
    shortDescription: '100% Cotton Authentic Print, Vibrant African Design',
    description: 'Elegant tailored women dress crafted with high-grade Wax Print fabric, suitable for formal events and modern fashion.',
    categoryId: 'womens-clothing',
    brand: 'Kilimanjaro Couture',
    supplier: SUPPLIERS.kilimanjaro,
    images: [{ url: '/images/products/kitenge-shirt.png', alt: 'Kitenge Dress' }],
    attributes: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'] }],
    variants: [{ id: 'v-wm-1', sku: 'KC-KIT-M', options: { Size: 'M' }, price: 120000, stock: 60, imageIndex: 0 }],
    fromPrice: 120000,
    compareAtPrice: 160000,
    rating: 4.8,
    reviewCount: 56,
    soldCount: 310,
    deliveryEstimateDays: [2, 5],
    specifications: [{ label: 'Material', value: '100% Cotton Wax' }],
    reviews: [],
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'prod-mn-01',
    slug: 'bespoke-executive-mens-3piece-suit',
    title: "Bespoke Italian-Cut Men's 3-Piece Executive Suit",
    shortDescription: 'Slim Fit Jacket, Waistcoat & Trousers in Midnight Navy',
    description: 'Premium wool-blend tailored suit designed for corporate executives and formal occasions. Anti-wrinkle finish.',
    categoryId: 'mens-clothing',
    brand: 'Sartorial Istanbul',
    supplier: SUPPLIERS.istanbul,
    images: [{ url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80', alt: 'Mens Executive Suit' }],
    attributes: [{ name: 'Size', options: ['48EU', '50EU', '52EU', '54EU'] }],
    variants: [{ id: 'v-mn-1', sku: 'SI-SUIT-50', options: { Size: '50EU' }, price: 380000, stock: 35, imageIndex: 0 }],
    fromPrice: 380000,
    compareAtPrice: 480000,
    rating: 4.9,
    reviewCount: 22,
    soldCount: 145,
    deliveryEstimateDays: [7, 12],
    specifications: [{ label: 'Fabric', value: '70% Wool, 30% Microfiber' }],
    reviews: [],
    createdAt: '2026-02-03T08:00:00Z',
  },
  {
    id: 'prod-sh-01',
    slug: 'italian-calfskin-leather-oxford-shoes',
    title: "Handcrafted Italian Calfskin Leather Men's Oxford Shoes",
    shortDescription: 'Goodyear Welted Sole, Genuine Full-Grain Leather in Burnished Tan',
    description: 'Timeless luxury dress shoes featuring hand-finished patina, breathable leather lining, and durable leather soles.',
    categoryId: 'shoes',
    brand: 'Milano Footwear',
    supplier: SUPPLIERS.istanbul,
    images: [{ url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=500&q=80', alt: 'Italian Leather Oxford Shoes' }],
    attributes: [{ name: 'Shoe Size', options: ['40EU', '41EU', '42EU', '43EU', '44EU'] }],
    variants: [{ id: 'v-sh-1', sku: 'MF-OXF-42', options: { 'Shoe Size': '42EU' }, price: 210000, stock: 40, imageIndex: 0 }],
    fromPrice: 210000,
    compareAtPrice: 270000,
    rating: 4.9,
    reviewCount: 38,
    soldCount: 190,
    deliveryEstimateDays: [7, 12],
    specifications: [{ label: 'Material', value: 'Full Grain Leather' }],
    reviews: [],
    createdAt: '2026-01-22T08:00:00Z',
  },
  {
    id: 'prod-hr-01',
    slug: 'virgin-brazilian-human-hair-lace-front-wig',
    title: '100% Virgin Brazilian Human Hair Lace Front Wig 24"',
    shortDescription: '180% Density Body Wave, HD Invisible Pre-Plucked Lace',
    description: 'Unprocessed natural black human hair wig. Tangle-free, can be dyed, bleached, and heat-styled effortlessly.',
    categoryId: 'hair-wigs',
    brand: 'Glamour Hair',
    supplier: SUPPLIERS.guangzhou,
    images: [{ url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80', alt: 'Brazilian Human Hair Wig' }],
    attributes: [{ name: 'Length', options: ['20 Inch', '24 Inch', '28 Inch'] }],
    variants: [{ id: 'v-hr-1', sku: 'GH-WIG-24', options: { Length: '24 Inch' }, price: 420000, stock: 50, imageIndex: 0 }],
    fromPrice: 420000,
    compareAtPrice: 520000,
    rating: 5.0,
    reviewCount: 64,
    soldCount: 410,
    deliveryEstimateDays: [6, 11],
    specifications: [{ label: 'Hair Grade', value: '12A Virgin Hair' }],
    reviews: [],
    createdAt: '2026-01-28T08:00:00Z',
  },
  {
    id: 'prod-fur-01',
    slug: 'executive-ergonomic-mesh-office-chair',
    title: 'Executive Ergonomic Mesh Swivel Office Chair with Lumbar Support',
    shortDescription: 'Adjustable 3D Armrests, Breathable Mesh, 135° Recline',
    description: 'BIFMA certified ergonomic task chair designed for 12+ hour daily office use with heavy-duty aluminum base.',
    categoryId: 'furniture',
    brand: 'Ekintop Ergonomics',
    supplier: SUPPLIERS.guangzhou,
    images: [{ url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=500&q=80', alt: 'Ergonomic Office Chair' }],
    attributes: [{ name: 'Color', options: ['Black Mesh', 'Grey Mesh'] }],
    variants: [{ id: 'v-fur-1', sku: 'EK-CH-BLK', options: { Color: 'Black Mesh' }, price: 340000, stock: 75, imageIndex: 0 }],
    fromPrice: 340000,
    compareAtPrice: 420000,
    rating: 4.8,
    reviewCount: 47,
    soldCount: 280,
    deliveryEstimateDays: [7, 14],
    specifications: [{ label: 'Weight Capacity', value: '150KG' }],
    reviews: [],
    createdAt: '2026-01-05T08:00:00Z',
  },
]

export const PRODUCTS: Product[] = [...INITIAL_PRODUCTS]

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

  // Suits, Tuxedos, Blazers
  if (t.includes('suit') || t.includes('tuxedo') || t.includes('blazer') || c.includes('suit') || c.includes('blazer')) {
    return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80'
  }
  // Outerwear, Jackets, Coats
  if (t.includes('jacket') || t.includes('coat') || t.includes('parka') || c.includes('jacket') || c.includes('coat')) {
    return 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=500&q=80'
  }
  // Dresses, Gowns, Women's fashion
  if (t.includes('dress') || t.includes('gown') || t.includes('skirt') || c.includes('dress') || c.includes('skirt') || c.includes('womens-clothing')) {
    return 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=500&q=80'
  }
  // Shoes & Footwear
  if (t.includes('shoe') || t.includes('heel') || t.includes('boot') || t.includes('sneaker') || t.includes('oxford') || t.includes('loafers') || c.includes('shoe') || c.includes('footwear')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80'
  }
  // Watches & Accessories
  if (t.includes('watch') || t.includes('chronograph') || c.includes('watch') || c.includes('jewelry')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'
  }
  // Bags & Backpacks
  if (t.includes('bag') || t.includes('backpack') || t.includes('tote') || t.includes('handbag') || c.includes('bag')) {
    return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80'
  }
  // Furniture & Chairs
  if (t.includes('chair') || t.includes('desk') || t.includes('sofa') || t.includes('table') || c.includes('furniture')) {
    return 'https://images.unsplash.com/photo-1580481077195-c99026cb6b38?auto=format&fit=crop&w=500&q=80'
  }
  // Solar & Energy
  if (t.includes('solar') || c.includes('solar') || t.includes('inverter') || t.includes('clean energy')) {
    return '/images/products/solar-kit.png'
  }
  // Audio & Speakers
  if (t.includes('speaker') || t.includes('sound') || t.includes('audio') || t.includes('headphone') || t.includes('earbud')) {
    return '/images/products/bluetooth-speaker.png'
  }
  // Phones & Electronics
  if (t.includes('phone') || t.includes('case') || c.includes('phone')) {
    return '/images/products/smartphone.png'
  }
  if (t.includes('monitor') || t.includes('laptop') || c.includes('electronics') || t.includes('display')) {
    return '/categories/electronics.png'
  }
  // Shirts & Tops
  if (t.includes('shirt') || t.includes('polo') || t.includes('t-shirt') || t.includes('tee')) {
    return '/images/products/kitenge-shirt.png'
  }

  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'
}

export function sanitizeProductImage(url: string | undefined, title: string, categoryId: string): string {
  if (!url || typeof url !== 'string' || url.includes('example.com') || url.includes('placeholder') || !url.trim()) {
    return resolveImage(title, categoryId)
  }

  let trimmed = url.trim().replace(/^['"]|['"]$/g, '')
  if (trimmed.startsWith('//')) {
    trimmed = `https:${trimmed}`
  } else if (trimmed.startsWith('http://')) {
    trimmed = trimmed.replace('http://', 'https://')
  } else if (
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('data:') &&
    !trimmed.startsWith('/') &&
    (trimmed.includes('.') || trimmed.includes('/'))
  ) {
    trimmed = `https://${trimmed}`
  }
  return trimmed
}

export function getStoredProducts(): Product[] {
  let catalog: Product[] = [...INITIAL_PRODUCTS]

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: Product[] = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const initialIds = new Set(INITIAL_PRODUCTS.map((p) => p.id))
          const newStored = parsed.filter((p) => !initialIds.has(p.id))
          catalog = [...newStored, ...catalog]
        }
      }

      // Also merge approved & published products from lumoo-supplier-store-v2
      const supplierStoreRaw = localStorage.getItem('lumoo-supplier-store-v2')
      if (supplierStoreRaw) {
        const parsedSupplierStore = JSON.parse(supplierStoreRaw)
        const supplierProducts: any[] = parsedSupplierStore?.state?.products || []

        const publishedSupplierProducts = supplierProducts
          .filter((sp) => {
            const st = String(sp.status || '').toUpperCase()
            return st === 'PUBLISHED' || st === 'ACTIVE' || sp.isApproved === true
          })
          .map((sp) => {
            const rawUrl = Array.isArray(sp.images) ? sp.images[0] : sp.images
            const cleanUrl = typeof rawUrl === 'string' ? rawUrl : rawUrl?.url || resolveImage(sp.title, sp.category)
            const title = sp.title || 'Direct Factory Product'
            let rawCat = (sp.category || sp.categoryId || 'electronics').toLowerCase().replace(/[^a-z0-9]+/g, '-')
            let categoryId = rawCat
            if (rawCat.includes('chair') || rawCat.includes('furniture')) categoryId = 'furniture'
            else if (rawCat.includes('phone') || rawCat.includes('case')) categoryId = 'phones-accessories'
            else if (rawCat.includes('beauty') || rawCat.includes('care')) categoryId = 'health-beauty'
            else if (rawCat.includes('shoe') || rawCat.includes('sneaker')) categoryId = 'shoes'
            else if (rawCat.includes('jacket') || rawCat.includes('clothing') || rawCat.includes('men')) categoryId = 'mens-clothing'
            else if (rawCat.includes('solar') || rawCat.includes('power')) categoryId = 'solar-power'

            return {
              id: sp.id,
              title,
              slug: sp.slug || sp.id,
              description: sp.description || `${title} — Direct Factory Sourcing with Air & Sea Freight to Tanzania.`,
              shortDescription: sp.shortDescription || title,
              categoryId,
              brand: sp.brand || 'Supplier Direct',
              countryOfOrigin: 'China',
              flag: '🇨🇳',
              fromPrice: Number(sp.fromPrice || sp.priceTZS || 50000),
              compareAtPrice: sp.compareAtPrice ? Number(sp.compareAtPrice) : null,
              minOrderQuantity: sp.minOrderQuantity || 1,
              soldCount: sp.soldCount || 15,
              rating: sp.rating || 4.9,
              reviewCount: sp.reviewCount || 18,
              leadTimeDays: 7,
              deliveryEstimateDays: [7, 14],
              inStock: true,
              supplier: {
                id: 'sup-1',
                name: sp.supplier?.name || sp.brand || 'Verified Factory Supplier',
                verified: true,
                rating: 4.9,
                city: 'Guangzhou',
                country: 'China',
                flag: '🇨🇳',
              },
              images: [{ url: cleanUrl, alt: title }],
              variants: sp.variants || [{ id: `${sp.id}-v1`, name: 'Standard', price: Number(sp.fromPrice || sp.priceTZS || 50000), stock: sp.stock || 20 }],
              specifications: [],
              attributes: [],
              reviews: [],
              tags: ['Factory Direct', 'Verified'],
              createdAt: sp.createdAt || new Date().toISOString(),
            } as Product
          })

        if (publishedSupplierProducts.length > 0) {
          const existingIds = new Set(catalog.map((p) => p.id))
          const newEntries = publishedSupplierProducts.filter((p) => !existingIds.has(p.id))
          catalog = [...newEntries, ...catalog]
        }
      }

      PRODUCTS.length = 0
      PRODUCTS.push(...catalog)
      updateCategoryCounts()
      return catalog
    } catch (e) {
      console.error('Error reading published products from localStorage:', e)
    }
  }
  return catalog
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
    localStorage.removeItem('lumoo-supplier-store-v2')
    window.dispatchEvent(new Event('lumo_catalog_updated'))
    
    // Asynchronously call API to delete database products
    fetch('/api/products', { method: 'DELETE' }).catch(() => {})
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
