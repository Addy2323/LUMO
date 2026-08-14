/**
 * Catalog Import Data Validation Rules.
 * Checks for missing required fields, invalid numbers, invalid currencies, missing images, and invalid URLs.
 */

import { TargetFieldKey } from './column-aliases'

export type ValidationError = {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export type RowValidationResult = {
  rowNumber: number
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  normalizedData: Record<TargetFieldKey, string>
}

const SUPPORTED_CURRENCIES = ['TZS', 'USD', 'CNY', 'AED', 'TRY', 'EUR', 'GBP']

export function resolveCategorySlug(catName?: string): string {
  if (!catName || !catName.trim()) return 'general-sourcing'
  const norm = catName.toLowerCase().trim()
  if (norm.includes('auto') || norm.includes('car') || norm.includes('vehicle') || norm.includes('motor')) return 'automotive'
  if (norm.includes('appliance') || norm.includes('hvac')) return 'appliances'
  if (norm.includes('women') || norm.includes('female') || norm.includes('lady') || norm.includes('dress')) return 'womens-clothing'
  if (norm.includes('men') || norm.includes('male') || norm.includes('suit') || norm.includes('shirt')) return 'mens-clothing'
  if (norm.includes('shoe') || norm.includes('sneaker') || norm.includes('footwear') || norm.includes('boot')) return 'shoes'
  if (norm.includes('hair') || norm.includes('wig') || norm.includes('extension')) return 'hair-wigs'
  if (norm.includes('jewel') || norm.includes('watch') || norm.includes('ring') || norm.includes('necklace')) return 'jewelry-accessories'
  if (norm.includes('furniture') || norm.includes('decor') || norm.includes('chair') || norm.includes('table')) return 'furniture'
  if (norm.includes('toy') || norm.includes('game') || norm.includes('puzzle') || norm.includes('kid')) return 'toys-games'
  if (norm.includes('pet') || norm.includes('dog') || norm.includes('cat') || norm.includes('animal')) return 'pet-supplies'
  if (norm.includes('tool') || norm.includes('hardware') || norm.includes('fixture') || norm.includes('drill')) return 'tools-home'
  if (norm.includes('patio') || norm.includes('lawn') || norm.includes('garden') || norm.includes('plant')) return 'patio-lawn-garden'
  if (norm.includes('sport') || norm.includes('outdoor') || norm.includes('fitness') || norm.includes('gym')) return 'sports-outdoor'
  if (norm.includes('phone') || norm.includes('mobile') || norm.includes('case') || norm.includes('charger')) return 'phones-accessories'
  if (norm.includes('electr') || norm.includes('gadget') || norm.includes('audio') || norm.includes('display') || norm.includes('monitor') || norm.includes('screen')) return 'electronics'
  if (norm.includes('home') || norm.includes('kitchen')) return 'home-kitchen'
  if (norm.includes('solar') || norm.includes('inverter') || norm.includes('battery') || norm.includes('panel')) return 'solar-power'
  if (norm.includes('fashion') || norm.includes('cloth') || norm.includes('wear')) return 'fashion'
  if (norm.includes('beauty') || norm.includes('health') || norm.includes('cosmetic') || norm.includes('makeup')) return 'health-beauty'
  return norm.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general-sourcing'
}

export function parseNumericPrice(val?: string | number): number | null {
  if (typeof val === 'number') return isNaN(val) || val <= 0 ? null : val
  if (!val) return null
  const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) || parsed <= 0 ? null : parsed
}

export function extractImageUrl(input?: string): string | null {
  if (!input) return null
  const match = input.match(/(https?:\/\/[^\s,;"']+|\/[^\s,;"']+)/i)
  if (match) {
    const url = match[0].trim()
    if (!url.includes('example.com') && !url.includes('placeholder')) {
      return url
    }
  }
  return null
}

export function validateImportRow(
  rawData: Record<string, string>,
  mapping: Record<string, TargetFieldKey | ''>,
  rowNumber: number,
): RowValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Extract mapped values
  const mappedData: Partial<Record<TargetFieldKey, string>> = {}
  for (const [columnHeader, targetKey] of Object.entries(mapping)) {
    if (targetKey && rawData[columnHeader] !== undefined) {
      mappedData[targetKey] = String(rawData[columnHeader]).trim()
    }
  }

  const productName = mappedData.product_name || ''
  const category = mappedData.category || ''
  const description = mappedData.description || ''

  // Price Extraction & Fallback Scanner
  let priceRaw = mappedData.price || ''
  if (!priceRaw) {
    for (const [k, v] of Object.entries(rawData)) {
      const kLower = k.toLowerCase()
      if (
        kLower.includes('price') ||
        kLower.includes('retail') ||
        kLower.includes('retailer') ||
        kLower.includes('cost') ||
        kLower.includes('rate') ||
        kLower.includes('tzs') ||
        kLower.includes('usd') ||
        kLower.includes('amount')
      ) {
        if (v && v.trim()) {
          priceRaw = v.trim()
          break
        }
      }
    }
  }

  // Image Extraction & Fallback Scanner
  let imagesRaw = mappedData.images || ''
  if (!imagesRaw) {
    for (const [k, v] of Object.entries(rawData)) {
      const kLower = k.toLowerCase()
      if (
        kLower.includes('image') ||
        kLower.includes('img') ||
        kLower.includes('photo') ||
        kLower.includes('picture') ||
        kLower.includes('thumb')
      ) {
        if (v && v.trim()) {
          imagesRaw = v.trim()
          break
        }
      }
    }
  }

  const parsedPrice = parseNumericPrice(priceRaw)
  const currencyRaw = (mappedData.currency || 'USD').toUpperCase()
  const extractedUrl = extractImageUrl(imagesRaw)
  const externalUrl = mappedData.external_url || ''

  // Is string purely numeric digits or ID format (e.g. 10050112287312614 or id-123)?
  const isNumericOrId = (str: string) => /^\d+$/.test(str.trim()) || /^id[-_\d]+$/i.test(str.trim())

  let resolvedTitle = productName
  if (!resolvedTitle || isNumericOrId(resolvedTitle)) {
    const candidateName =
      (mappedData.short_description && !isNumericOrId(mappedData.short_description) ? mappedData.short_description : '') ||
      (mappedData.description && !isNumericOrId(mappedData.description) ? mappedData.description : '') ||
      (mappedData.subcategory && !isNumericOrId(mappedData.subcategory) ? mappedData.subcategory : '') ||
      (mappedData.brand && !isNumericOrId(mappedData.brand) && mappedData.brand !== 'Generic' ? mappedData.brand : '')

    if (candidateName) {
      resolvedTitle = candidateName.slice(0, 80)
    } else {
      const catSlug = resolveCategorySlug(category || mappedData.category)
      const formattedCat = catSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      resolvedTitle = `Direct Factory ${formattedCat} Item`
    }
    warnings.push({ field: 'product_name', message: 'Raw numeric ID detected as title — converted to descriptive product name', severity: 'warning' })
  }

  let resolvedDescription = description
  if (!resolvedDescription || isNumericOrId(resolvedDescription)) {
    resolvedDescription = `${resolvedTitle} — Verified factory direct product with air & sea freight support to Tanzania.`
  }

  // 1. Required field: Product Name
  if (!resolvedTitle) {
    errors.push({ field: 'product_name', message: 'Missing product name or title', severity: 'error' })
  } else if (resolvedTitle.length < 2) {
    errors.push({ field: 'product_name', message: 'Product name is too short (min 2 characters)', severity: 'error' })
  }

  // 2. Category check (Self-Healing)
  if (!category) {
    warnings.push({ field: 'category', message: 'Missing category — auto-assigning "General Sourcing"', severity: 'warning' })
  }

  // 3. Description check
  if (!description) {
    warnings.push({ field: 'description', message: 'Description is empty — default summary will be generated', severity: 'warning' })
  }

  // 4. Price check (Self-Healing)
  if (!parsedPrice) {
    warnings.push({ field: 'price', message: 'Missing or unparseable selling price — auto-calculating default', severity: 'warning' })
  }

  // 5. Currency check
  if (!SUPPORTED_CURRENCIES.includes(currencyRaw)) {
    warnings.push({ field: 'currency', message: `Unrecognized currency "${currencyRaw}" — defaulting to USD`, severity: 'warning' })
  }

  // 6. Image check
  if (!extractedUrl) {
    warnings.push({ field: 'images', message: 'No valid image URL found — placeholder will be assigned', severity: 'warning' })
  }

  // 7. Compare At Price check
  if (mappedData.compare_at_price) {
    const compareNum = parseNumericPrice(mappedData.compare_at_price)
    if (compareNum && parsedPrice && compareNum < parsedPrice) {
      warnings.push({ field: 'compare_at_price', message: 'Compare price is lower than retail price', severity: 'warning' })
    }
  }

  // 8. External URL check
  if (externalUrl && !externalUrl.startsWith('http://') && !externalUrl.startsWith('https://')) {
    warnings.push({ field: 'external_url', message: 'External URL missing http/https protocol prefix', severity: 'warning' })
  }

  // Build normalized output
  const normalizedData: Record<TargetFieldKey, string> = {
    external_url: externalUrl,
    external_product_id: mappedData.external_product_id || (isNumericOrId(productName) ? productName : ''),
    product_name: resolvedTitle,
    short_description: mappedData.short_description || '',
    description: resolvedDescription,
    category: category || 'General Sourcing',
    subcategory: mappedData.subcategory || '',
    brand: mappedData.brand || 'Generic',
    sku: mappedData.sku || '',
    price: parsedPrice ? parsedPrice.toString() : '10.00',
    currency: currencyRaw || 'USD',
    compare_at_price: parseNumericPrice(mappedData.compare_at_price)?.toString() || '',
    cost_price: parseNumericPrice(mappedData.cost_price)?.toString() || '',
    moq: mappedData.moq || '1',
    stock_quantity: mappedData.stock_quantity || '100',
    stock_status: mappedData.stock_status || 'In Stock',
    weight: mappedData.weight || '',
    length: mappedData.length || '',
    width: mappedData.width || '',
    height: mappedData.height || '',
    material: mappedData.material || '',
    color: mappedData.color || '',
    size: mappedData.size || '',
    variant_name: mappedData.variant_name || '',
    variant_value: mappedData.variant_value || '',
    images: extractedUrl || imagesRaw || '',
    video_url: mappedData.video_url || '',
    country_of_origin: mappedData.country_of_origin || 'China',
    supplier_name: mappedData.supplier_name || 'LUMO Sourcing Hub',
    supplier_reference: mappedData.supplier_reference || '',
    source_type: mappedData.source_type || 'CSV_IMPORT',
    source_platform: mappedData.source_platform || 'Initial Catalog',
    status: mappedData.status || 'IMPORTED',
  }

  return {
    rowNumber,
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizedData,
  }
}
