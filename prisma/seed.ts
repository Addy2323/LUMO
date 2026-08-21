import { PrismaClient, ProductStatus, SourceType, AccountStatus, KycStatus, Role } from '@prisma/client'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting LUMO Hierarchical Category, Admin Accounts & Catalog Seeding...')

  const defaultPassword = '0987654321'
  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(defaultPassword, salt)

  // Seed Primary & Production Admin Users
  const adminAccounts = [
    { name: 'LUMO Super Admin', email: 'admin@lumo.co.tz', phone: '+255711788830' },
    { name: 'Ado Myamba (Admin)', email: 'myambaado@gmail.com', phone: '+255768828247' },
  ]

  for (const adminAcc of adminAccounts) {
    await prisma.user.upsert({
      where: { email: adminAcc.email },
      update: {
        role: Role.ADMIN,
        passwordHash: hashedPassword,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KycStatus.VERIFIED,
        phoneVerifiedAt: new Date(),
      },
      create: {
        name: adminAcc.name,
        email: adminAcc.email,
        role: Role.ADMIN,
        passwordHash: hashedPassword,
        phone: adminAcc.phone,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KycStatus.VERIFIED,
        phoneVerifiedAt: new Date(),
      },
    })
  }

  const categoryTree = [
    {
      name: 'Electronics',
      slug: 'electronics',
      icon: 'Smartphone',
      description: 'Consumer electronics, smartphones, audio equipment and smart devices.',
      children: [
        { name: 'Audio & Headphones', slug: 'electronics-audio', icon: 'Headphones', description: 'Wireless earbuds, noise cancelling headphones, and bluetooth speakers.' },
        { name: 'Mobile Accessories', slug: 'electronics-mobile-accessories', icon: 'Smartphone', description: 'Cases, chargers, cables, and screen protectors.' },
        { name: 'Computer Accessories', slug: 'electronics-computer-accessories', icon: 'Laptop', description: 'Mice, keyboards, webcams, and docking stations.' },
        { name: 'Smart Devices', slug: 'electronics-smart-devices', icon: 'Watch', description: 'Smartwatches, fitness bands, and home automation.' },
      ],
    },
    {
      name: "Men's Fashion",
      slug: 'mens-fashion',
      icon: 'Shirt',
      description: 'Men apparel, footwear, tailoring, and lifestyle accessories.',
      children: [
        { name: "Men's Shirts", slug: 'mens-shirts', icon: 'Shirt', description: 'Formal cotton dress shirts, casual linen shirts, and polo shirts.' },
        { name: "Men's Trousers", slug: 'mens-trousers', icon: 'Scissors', description: 'Chinos, jeans, suit trousers, and casual shorts.' },
        { name: "Men's Jackets", slug: 'mens-jackets', icon: 'Shield', description: 'Blazers, winter coats, windbreakers, and leather jackets.' },
        { name: "Men's Shoes", slug: 'mens-shoes', icon: 'Footprints', description: 'Leather oxfords, loafers, sneakers, and boots.' },
        { name: "Men's Accessories", slug: 'mens-accessories', icon: 'Watch', description: 'Belts, ties, wallets, sunglasses, and watches.' },
      ],
    },
    {
      name: "Women's Fashion",
      slug: 'womens-fashion',
      icon: 'ShoppingBag',
      description: 'Women dresses, tops, footwear, bags, and fashion accessories.',
      children: [
        { name: "Women's Dresses", slug: 'womens-dresses', icon: 'Sparkles', description: 'Evening gowns, casual summer dresses, and office wear dresses.' },
        { name: "Women's Tops", slug: 'womens-tops', icon: 'Shirt', description: 'Blouses, t-shirts, tunics, and sweaters.' },
        { name: "Women's Trousers", slug: 'womens-trousers', icon: 'Scissors', description: 'Wide leg pants, leggings, jeans, and skirts.' },
        { name: "Women's Shoes", slug: 'womens-shoes', icon: 'Footprints', description: 'Heels, flats, sandals, and sneakers.' },
        { name: "Women's Accessories", slug: 'womens-accessories', icon: 'Heart', description: 'Scarves, hats, belts, and hair accessories.' },
      ],
    },
    {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      icon: 'Home',
      description: 'Kitchen appliances, cookware, home furniture, storage and lighting.',
      children: [
        { name: 'Kitchen & Dining', slug: 'kitchen-dining', icon: 'Utensils', description: 'Blenders, air fryers, cookware sets, and tableware.' },
        { name: 'Furniture', slug: 'home-furniture', icon: 'Armchair', description: 'Living room chairs, desks, side tables, and office chairs.' },
        { name: 'Storage & Organization', slug: 'home-storage', icon: 'Box', description: 'Closet organizers, storage bins, and shoe racks.' },
        { name: 'Lighting', slug: 'home-lighting', icon: 'Lightbulb', description: 'LED ceiling lights, desk lamps, and outdoor solar lighting.' },
      ],
    },
    {
      name: 'Beauty & Accessories',
      slug: 'beauty-accessories',
      icon: 'Sparkles',
      description: 'Personal care appliances, luxury bags, fine jewelry, and cosmetics.',
      children: [
        { name: 'Personal Care', slug: 'beauty-personal-care', icon: 'Smile', description: 'Hair dryers, shavers, facial massagers, and dental care.' },
        { name: 'Bags & Luggage', slug: 'beauty-bags', icon: 'Briefcase', description: 'Handbags, leather backpacks, travel suitcases, and totes.' },
        { name: 'Jewelry & Watches', slug: 'beauty-jewelry', icon: 'Gem', description: 'Necklaces, earrings, bracelets, and fashion watches.' },
        { name: 'Beauty Accessories', slug: 'beauty-accessories-items', icon: 'Heart', description: 'Makeup brush sets, vanity mirrors, and travel cosmetic kits.' },
      ],
    },
  ]

  const categoryMap: Record<string, string> = {}

  for (const parent of categoryTree) {
    const parentRecord = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name, icon: parent.icon, description: parent.description },
      create: {
        name: parent.name,
        slug: parent.slug,
        icon: parent.icon,
        description: parent.description,
      },
    })
    categoryMap[parent.name] = parentRecord.id

    for (const child of parent.children) {
      const childRecord = await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, icon: child.icon, description: child.description, parentId: parentRecord.id },
        create: {
          name: child.name,
          slug: child.slug,
          icon: child.icon,
          description: child.description,
          parentId: parentRecord.id,
        },
      })
      categoryMap[child.name] = childRecord.id
    }
  }



  // Seed 100 Demo Products (20 per category)
  console.log('📦 Seeding 100 Catalog Products across 5 categories...')

  const categories = [
    { name: 'Electronics', prefix: 'EL', basePriceUSD: 35.0, count: 20 },
    { name: "Men's Fashion", prefix: 'MF', basePriceUSD: 22.0, count: 20 },
    { name: "Women's Fashion", prefix: 'WF', basePriceUSD: 25.0, count: 20 },
    { name: 'Home & Kitchen', prefix: 'HK', basePriceUSD: 55.0, count: 20 },
    { name: 'Beauty & Accessories', prefix: 'BA', basePriceUSD: 28.0, count: 20 },
  ]

  const origins = ['China', 'Turkey', 'Dubai']
  const imagesByCat: Record<string, string[]> = {
    Electronics: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',
      'https://images.unsplash.com/photo-1609592424074-8848db2c75a4?w=800',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    ],
    "Men's Fashion": [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800',
      'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    ],
    "Women's Fashion": [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
      'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    ],
    'Home & Kitchen': [
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800',
      'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800',
      'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800',
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800',
      'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800',
    ],
    'Beauty & Accessories': [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800',
      'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=800',
    ],
  }

  let globalCounter = 1

  for (const catConfig of categories) {
    const categoryId = categoryMap[catConfig.name]
    const imgList = imagesByCat[catConfig.name] || imagesByCat['Electronics']

    for (let i = 1; i <= catConfig.count; i++) {
      const code = `LUMO-${catConfig.prefix}-${String(globalCounter).padStart(6, '0')}`
      const slug = `${catConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-item-${globalCounter}`
      const usdPrice = new Prisma.Decimal((catConfig.basePriceUSD + (i % 7) * 4.5).toFixed(2))
      const tzsPrice = new Prisma.Decimal((Number(usdPrice) * 2600).toFixed(2))
      const costUsd = new Prisma.Decimal((Number(usdPrice) * 0.55).toFixed(2))
      const img = imgList[(i - 1) % imgList.length]
      const origin = origins[i % origins.length]

      await prisma.product.upsert({
        where: { slug },
        update: {
          productCode: code,
          title: `LUMO Premium ${catConfig.name} Item #${i}`,
          priceUSD: usdPrice,
          priceTZS: tzsPrice,
          costPriceUSD: costUsd,
          status: ProductStatus.PUBLISHED,
          sourceType: SourceType.DEMO,
          countryOfOrigin: origin,
          categoryId,
          imageUrl: img,
        },
        create: {
          productCode: code,
          title: `LUMO Premium ${catConfig.name} Item #${i}`,
          slug,
          shortDescription: `High quality direct factory ${catConfig.name.toLowerCase()} sourced from ${origin}.`,
          description: `Direct wholesale ${catConfig.name} product manufactured with premium materials and quality inspected before shipment to Dar es Salaam.`,
          priceUSD: usdPrice,
          priceTZS: tzsPrice,
          costPriceUSD: costUsd,
          moq: 5,
          stock: 150 + i * 10,
          status: ProductStatus.PUBLISHED,
          sourceType: SourceType.DEMO,
          countryOfOrigin: origin,
          categoryId,
          imageUrl: img,
          images: {
            create: [
              { storageUrl: img, isPrimary: true, sortOrder: 0 },
            ],
          },
        },
      })

      globalCounter++
    }
  }

  console.log(`✅ LUMO 100 Product Seed Complete! (${globalCounter - 1} products created)`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
