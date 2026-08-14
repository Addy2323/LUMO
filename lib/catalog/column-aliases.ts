/**
 * Column Name Alias Map for Automatic CSV/Excel Column Detection.
 * Supports flexible column naming from diverse supplier feeds (China, Dubai, Turkey, India, CSV exports).
 */

export type TargetFieldKey =
  | 'external_url'
  | 'external_product_id'
  | 'product_name'
  | 'short_description'
  | 'description'
  | 'category'
  | 'subcategory'
  | 'brand'
  | 'sku'
  | 'price'
  | 'currency'
  | 'compare_at_price'
  | 'cost_price'
  | 'moq'
  | 'stock_quantity'
  | 'stock_status'
  | 'weight'
  | 'length'
  | 'width'
  | 'height'
  | 'material'
  | 'color'
  | 'size'
  | 'variant_name'
  | 'variant_value'
  | 'images'
  | 'video_url'
  | 'country_of_origin'
  | 'supplier_name'
  | 'supplier_reference'
  | 'source_type'
  | 'source_platform'
  | 'status'

export type TargetFieldDef = {
  key: TargetFieldKey
  label: string
  required: boolean
  description: string
  aliases: string[]
}

export const TARGET_FIELDS: TargetFieldDef[] = [
  {
    key: 'product_name',
    label: 'Product Name / Title',
    required: true,
    description: 'Main display title of the product',
    aliases: [
      'product_name',
      'product name',
      'title',
      'product title',
      'name',
      'item_name',
      'item name',
      'subject',
      'listing_title',
      'nama_bidang',
    ],
  },
  {
    key: 'category',
    label: 'Category',
    required: true,
    description: 'Primary product category',
    aliases: [
      'category',
      'category_name',
      'category name',
      'product_category',
      'cat',
      'main_category',
      'department',
      'kategori',
    ],
  },
  {
    key: 'subcategory',
    label: 'Subcategory',
    required: false,
    description: 'Subcategory under main category',
    aliases: [
      'subcategory',
      'sub_category',
      'sub category',
      'subcat',
      'child_category',
      'secondary_category',
    ],
  },
  {
    key: 'description',
    label: 'Description',
    required: true,
    description: 'Full product details and features',
    aliases: [
      'description',
      'desc',
      'details',
      'product_details',
      'product details',
      'overview',
      'specification',
      'specs',
      'body',
      'content',
      'maelezo',
    ],
  },
  {
    key: 'short_description',
    label: 'Short Description',
    required: false,
    description: 'Summary bullet point or excerpt',
    aliases: ['short_description', 'short_desc', 'summary', 'excerpt', 'highlights'],
  },
  {
    key: 'price',
    label: 'Price',
    required: true,
    description: 'Retail selling price',
    aliases: [
      'price',
      'unit_price',
      'unit price',
      'selling_price',
      'selling price',
      'retail_price',
      'retail price',
      'price_usd',
      'price usd',
      'price_tzs',
      'price tzs',
      'price ($)',
      'price(usd)',
      'price(tzs)',
      'sales price',
      'fob price',
      'wholesale price',
      'amount',
      'cost',
      'bei',
    ],
  },
  {
    key: 'currency',
    label: 'Currency',
    required: true,
    description: 'Currency code (e.g. TZS, USD)',
    aliases: ['currency', 'curr', 'currency_code', 'money_unit'],
  },
  {
    key: 'compare_at_price',
    label: 'Compare At Price / MSRP',
    required: false,
    description: 'Original list price before discount',
    aliases: ['compare_at_price', 'compare_price', 'msrp', 'list_price', 'original_price'],
  },
  {
    key: 'cost_price',
    label: 'Supplier Cost Price',
    required: false,
    description: 'Factory cost price from supplier',
    aliases: ['cost_price', 'cost', 'supplier_cost', 'wholesale_price', 'factory_price'],
  },
  {
    key: 'images',
    label: 'Image URLs',
    required: true,
    description: 'Main product image or comma-separated image URLs',
    aliases: [
      'images',
      'image',
      'image_url',
      'image url',
      'image_urls',
      'image urls',
      'img',
      'img_url',
      'img url',
      'photo',
      'photos',
      'photo_url',
      'picture',
      'pictures',
      'primary_image',
      'product_image',
      'product image',
      'image link',
      'image_link',
      'thumbnail',
      'gallery',
      'picha',
    ],
  },
  {
    key: 'sku',
    label: 'SKU Code',
    required: false,
    description: 'Stock Keeping Unit unique code',
    aliases: ['sku', 'sku_code', 'product_code', 'item_code', 'model_number', 'part_number'],
  },
  {
    key: 'moq',
    label: 'MOQ (Min Order Qty)',
    required: false,
    description: 'Minimum order quantity',
    aliases: ['moq', 'min_order', 'minimum_order_quantity', 'min_qty'],
  },
  {
    key: 'stock_quantity',
    label: 'Stock Quantity',
    required: false,
    description: 'Available inventory units',
    aliases: ['stock_quantity', 'stock', 'qty', 'quantity', 'inventory', 'available_stock'],
  },
  {
    key: 'stock_status',
    label: 'Stock Status',
    required: false,
    description: 'In Stock / Out of Stock status string',
    aliases: ['stock_status', 'availability', 'in_stock'],
  },
  {
    key: 'brand',
    label: 'Brand Name',
    required: false,
    description: 'Manufacturer or brand name',
    aliases: ['brand', 'brand_name', 'manufacturer', 'maker', 'label'],
  },
  {
    key: 'weight',
    label: 'Weight (kg)',
    required: false,
    description: 'Item weight in kilograms',
    aliases: ['weight', 'item_weight', 'weight_kg', 'gross_weight'],
  },
  {
    key: 'length',
    label: 'Length (cm)',
    required: false,
    description: 'Package length in cm',
    aliases: ['length', 'package_length', 'l_cm'],
  },
  {
    key: 'width',
    label: 'Width (cm)',
    required: false,
    description: 'Package width in cm',
    aliases: ['width', 'package_width', 'w_cm'],
  },
  {
    key: 'height',
    label: 'Height (cm)',
    required: false,
    description: 'Package height in cm',
    aliases: ['height', 'package_height', 'h_cm'],
  },
  {
    key: 'material',
    label: 'Material',
    required: false,
    description: 'Product material breakdown',
    aliases: ['material', 'fabric', 'composition', 'build_material'],
  },
  {
    key: 'color',
    label: 'Color',
    required: false,
    description: 'Color variant name',
    aliases: ['color', 'colour', 'shade'],
  },
  {
    key: 'size',
    label: 'Size',
    required: false,
    description: 'Size variant name',
    aliases: ['size', 'dimension', 'measurement'],
  },
  {
    key: 'variant_name',
    label: 'Variant Name',
    required: false,
    description: 'Variant group name (e.g. Storage Capacity)',
    aliases: ['variant_name', 'option_name', 'attribute_name'],
  },
  {
    key: 'variant_value',
    label: 'Variant Value',
    required: false,
    description: 'Variant group value (e.g. 256GB)',
    aliases: ['variant_value', 'option_value', 'attribute_value'],
  },
  {
    key: 'country_of_origin',
    label: 'Country of Origin',
    required: false,
    description: 'Country where product was manufactured (China, Dubai, Turkey, etc.)',
    aliases: [
      'country_of_origin',
      'origin',
      'made_in',
      'manufacturing_country',
      'source_country',
    ],
  },
  {
    key: 'supplier_name',
    label: 'Supplier Name',
    required: false,
    description: 'Name of the factory or wholesale vendor',
    aliases: ['supplier_name', 'vendor', 'supplier', 'factory_name', 'merchant'],
  },
  {
    key: 'supplier_reference',
    label: 'Supplier Reference ID',
    required: false,
    description: 'Supplier internal code or booth number',
    aliases: ['supplier_reference', 'vendor_id', 'supplier_id', 'booth_number'],
  },
  {
    key: 'source_type',
    label: 'Source Type',
    required: false,
    description: 'DEMO, CSV_IMPORT, LUMO_AGENT, LUMO_SUPPLIER, etc.',
    aliases: ['source_type', 'source', 'import_source', 'channel_type'],
  },
  {
    key: 'source_platform',
    label: 'Source Hub / Platform',
    required: false,
    description: 'Yiwu, Guangzhou, Dubai Dragon Mart, Istanbul, etc.',
    aliases: ['source_platform', 'source_hub', 'hub_location', 'market_hub'],
  },
  {
    key: 'external_product_id',
    label: 'External Product ID',
    required: false,
    description: 'Reference product code from catalog file',
    aliases: [
      'external_product_id',
      'external_id',
      'reference_id',
      'source_id',
      'product_id',
      'product id',
      'item_id',
      'item id',
      'goods_id',
      'goods id',
      'id',
      'ali_id',
      '1688_id',
      'product_code',
      'item_code',
      'article_id',
      'asin',
    ],
  },
  {
    key: 'external_url',
    label: 'External Product URL',
    required: false,
    description: 'Reference link to authorized catalog page',
    aliases: ['external_url', 'source_url', 'reference_url', 'catalog_url', 'product_url'],
  },
  {
    key: 'video_url',
    label: 'Video URL',
    required: false,
    description: 'Product demo or inspection video link',
    aliases: ['video_url', 'video', 'demo_video', 'mp4_url'],
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    description: 'Product lifecycle status (IMPORTED, DRAFT, PENDING_REVIEW, etc.)',
    aliases: ['status', 'state', 'publication_status'],
  },
]

/**
 * Given file column headers, return an initial column mapping object mapping header -> target field key.
 */
export function autoDetectMapping(headers: string[]): Record<string, TargetFieldKey | ''> {
  const mapping: Record<string, TargetFieldKey | ''> = {}
  const usedKeys = new Set<TargetFieldKey>()

  for (const header of headers) {
    const normalized = header.toLowerCase().trim().replace(/[\s\-_]+/g, '_')
    let matchedKey: TargetFieldKey | '' = ''

    for (const field of TARGET_FIELDS) {
      if (usedKeys.has(field.key)) continue

      const isExact = field.key === normalized
      const isAliasMatch = field.aliases.some(
        (alias) => alias.toLowerCase().replace(/[\s\-_]+/g, '_') === normalized,
      )

      if (isExact || isAliasMatch) {
        matchedKey = field.key
        usedKeys.add(field.key)
        break
      }
    }

    // Fuzzy Fallback Matching for Price
    if (!matchedKey && !usedKeys.has('price')) {
      if (
        normalized.includes('price') ||
        normalized.includes('retail') ||
        normalized.includes('retailer') ||
        normalized.includes('cost') ||
        normalized.includes('rate') ||
        normalized.includes('tzs') ||
        normalized.includes('usd')
      ) {
        matchedKey = 'price'
        usedKeys.add('price')
      }
    }

    // Fuzzy Fallback Matching for Images
    if (!matchedKey && !usedKeys.has('images')) {
      if (
        normalized.includes('image') ||
        normalized.includes('img') ||
        normalized.includes('photo') ||
        normalized.includes('picture') ||
        normalized.includes('thumb')
      ) {
        matchedKey = 'images'
        usedKeys.add('images')
      }
    }

    // Fuzzy Fallback Matching for Product Name / Title
    if (!matchedKey && !usedKeys.has('product_name')) {
      const isIdOrCodeColumn =
        normalized.endsWith('_id') ||
        normalized.endsWith('id') ||
        normalized.endsWith('_code') ||
        normalized.endsWith('code') ||
        normalized.endsWith('_url') ||
        normalized.endsWith('url') ||
        normalized.endsWith('_link') ||
        normalized.endsWith('link') ||
        normalized.endsWith('_no') ||
        normalized.endsWith('number') ||
        normalized === 'id' ||
        normalized === 'sku'

      if (
        !isIdOrCodeColumn &&
        (normalized.includes('name') ||
          normalized.includes('title') ||
          normalized.includes('subject') ||
          (normalized.includes('product') && !normalized.includes('id') && !normalized.includes('code')) ||
          (normalized.includes('item') && !normalized.includes('id') && !normalized.includes('code')))
      ) {
        matchedKey = 'product_name'
        usedKeys.add('product_name')
      }
    }

    mapping[header] = matchedKey
  }

  return mapping
}
