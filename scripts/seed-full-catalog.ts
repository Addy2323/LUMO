import { prisma } from '../lib/db'

async function main() {
  console.log('Seeding full multi-category catalog into PostgreSQL Database...')

  // 1. Ensure categories exist in DB
  const categoriesData = [
    { slug: 'phones-accessories', name: 'Phones & Accessories', description: 'Smartphones, cases, chargers, audio' },
    { slug: 'electronics', name: 'Electronics & Gadgets', description: 'Laptops, monitors, smartwatches, gadgets' },
    { slug: 'home-kitchen', name: 'Home & Kitchen', description: 'Cookware, kitchen appliances, home decor' },
    { slug: 'appliances', name: 'Appliances & HVAC', description: 'Air conditioners, refrigerators, washing machines' },
    { slug: 'solar-power', name: 'Solar & Clean Energy', description: 'Solar panels, inverters, lithium batteries, street lights' },
    { slug: 'automotive', name: 'Automotive & Parts', description: 'Dash cams, car inflators, spare parts, accessories' },
    { slug: 'womens-clothing', name: "Women's Clothing", description: 'Kitenge dresses, blouses, skirts, evening wear' },
    { slug: 'mens-clothing', name: "Men's Clothing", description: 'Executive suits, African print shirts, polo shirts, trousers' },
    { slug: 'shoes', name: 'Shoes & Footwear', description: 'Italian leather oxfords, loafers, sneakers, heels' },
    { slug: 'fashion', name: 'Fashion & Apparel', description: 'Bags, sunglasses, belts, wallets' },
    { slug: 'health-beauty', name: 'Beauty & Health', description: 'Skincare, hair care, cosmetics, facial brushes' },
    { slug: 'hair-wigs', name: 'Hair Extensions & Wigs', description: 'Virgin Brazilian wigs, lace front wigs, hair bundles' },
    { slug: 'jewelry-accessories', name: 'Jewelry & Accessories', description: 'Gold necklaces, watches, bracelets, rings' },
    { slug: 'furniture', name: 'Furniture & Decor', description: 'Ergonomic office chairs, swivel stools, desks, sofas' },
    { slug: 'toys-games', name: 'Toys & Games', description: 'RC cars, educational building blocks, drone toys' },
    { slug: 'pet-supplies', name: 'Pet Supplies', description: 'Pet water fountains, pet beds, grooming accessories' },
    { slug: 'tools-home', name: 'Tools & Home Improvement', description: 'Cordless drills, laser measurers, hand tool sets' },
    { slug: 'patio-lawn-garden', name: 'Patio, Lawn & Garden', description: 'Solar garden lights, retractable hose reels' },
    { slug: 'sports-outdoor', name: 'Sports & Outdoor', description: 'Camping tents, dumbbell sets, outdoor gear' },
    { slug: 'general-sourcing', name: 'General Sourcing', description: 'Direct factory custom bulk merchandise' },
  ]

  const catMap = new Map<string, string>()
  for (const c of categoriesData) {
    const upserted = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    })
    catMap.set(c.slug, upserted.id)
  }

  // 2. Sample products across all categories
  const productsToSeed = [
    // Phones & Accessories
    { title: 'Flagship Ultra 5G Smartphone 256GB', categorySlug: 'phones-accessories', priceTZS: 850000, img: '/images/products/smartphone.png', brand: 'TechMaster' },
    { title: 'Magnetic Wireless Fast Charging Stand 15W', categorySlug: 'phones-accessories', priceTZS: 65000, img: '/images/products/phone-case-armour.png', brand: 'Anker Tech' },
    { title: 'ANC Active Noise Cancelling Wireless Earbuds', categorySlug: 'phones-accessories', priceTZS: 120000, img: '/images/products/bluetooth-speaker.png', brand: 'SoundPro' },
    { title: 'Rugged Shockproof Heavy Duty Phone Case', categorySlug: 'phones-accessories', priceTZS: 25000, img: '/images/products/phone-case-armour.png', brand: 'ArmorShield' },
    
    // Electronics
    { title: 'Ultra-Slim 16 inch 4K OLED Executive Laptop', categorySlug: 'electronics', priceTZS: 2450000, img: '/categories/electronics.png', brand: 'AeroBook' },
    { title: '34 inch Curved 165Hz Gaming Monitor 2K', categorySlug: 'electronics', priceTZS: 890000, img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80', brand: 'ViewMax' },
    { title: 'Smart Fitness & Health Tracker Watch Pro', categorySlug: 'electronics', priceTZS: 145000, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80', brand: 'FitTech' },

    // Solar Power
    { title: '5KW Hybrid Solar Inverter & LiFePO4 Battery Kit', categorySlug: 'solar-power', priceTZS: 4800000, img: '/images/products/solar-kit.png', brand: 'SunPower Direct' },
    { title: 'All-in-One Solar LED Street Light 100W Waterproof', categorySlug: 'solar-power', priceTZS: 185000, img: '/images/products/solar-kit.png', brand: 'LumoSolar' },
    { title: 'Monocrystalline Solar Panel 450W High Efficiency', categorySlug: 'solar-power', priceTZS: 320000, img: '/images/products/solar-kit.png', brand: 'SolaTech' },

    // Women's Clothing
    { title: "Handmade Premium Kitenge Women's Fashion Dress", categorySlug: 'womens-clothing', priceTZS: 120000, img: '/images/products/kitenge-shirt.png', brand: 'Kilimanjaro Couture' },
    { title: "Vibrant Floral Print Chiffon Maxi Women's Dress", categorySlug: 'womens-clothing', priceTZS: 95000, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=500&q=80', brand: 'Safari Chic' },
    { title: "Silk Button-Up Tailored Women's Executive Blouse", categorySlug: 'womens-clothing', priceTZS: 85000, img: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=500&q=80', brand: 'Kilimanjaro Couture' },
    { title: "Authentic Tanzanian Kanga Print Evening Dress", categorySlug: 'womens-clothing', priceTZS: 110000, img: '/images/products/kitenge-shirt.png', brand: 'Bahari Fashion' },

    // Men's Clothing
    { title: "Bespoke Italian-Cut Men's 3-Piece Executive Suit", categorySlug: 'mens-clothing', priceTZS: 380000, img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80', brand: 'Sartorial Istanbul' },
    { title: "African Print Wax Cotton Men's Short Sleeve Shirt", categorySlug: 'mens-clothing', priceTZS: 75000, img: '/images/products/kitenge-shirt.png', brand: 'Kilimanjaro Couture' },
    { title: "Classic Men's Slim Fit Stretch Chino Trousers", categorySlug: 'mens-clothing', priceTZS: 65000, img: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=500&q=80', brand: 'UrbanStyle' },

    // Shoes & Footwear
    { title: "Handcrafted Italian Calfskin Leather Men's Oxford Shoes", categorySlug: 'shoes', priceTZS: 210000, img: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=500&q=80', brand: 'Milano Footwear' },
    { title: "Men's Genuine Leather Penny Loafers Slip-On", categorySlug: 'shoes', priceTZS: 175000, img: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=500&q=80', brand: 'Milano Footwear' },
    { title: "Ultra-Lightweight Breathable Mesh Running Sneakers", categorySlug: 'shoes', priceTZS: 115000, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80', brand: 'ProRun' },

    // Hair Extensions & Wigs
    { title: '100% Virgin Brazilian Human Hair Lace Front Wig 24"', categorySlug: 'hair-wigs', priceTZS: 420000, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80', brand: 'Glamour Hair' },
    { title: 'HD Invisible Lace Closure Human Hair Bundles 3Pcs', categorySlug: 'hair-wigs', priceTZS: 310000, img: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=500&q=80', brand: 'Crown Wigs' },
    { title: 'Deep Wave Natural Black Human Hair Wig 28"', categorySlug: 'hair-wigs', priceTZS: 480000, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80', brand: 'Glamour Hair' },

    // Furniture
    { title: 'Executive Ergonomic Mesh Swivel Office Chair', categorySlug: 'furniture', priceTZS: 340000, img: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=500&q=80', brand: 'Ekintop Ergonomics' },
    { title: 'Luxury Leather Boss Swivel Chair with Footrest', categorySlug: 'furniture', priceTZS: 450000, img: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?auto=format&fit=crop&w=500&q=80', brand: 'Boss Office' },

    // Beauty & Health
    { title: 'Organic Botanical Skincare Face Glow Serum 50ml', categorySlug: 'health-beauty', priceTZS: 55000, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80', brand: 'PureGlow' },

    // Appliances
    { title: 'Inverter Split Air Conditioner 18000 BTU Cooling', categorySlug: 'appliances', priceTZS: 1450000, img: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=500&q=80', brand: 'CoolZone' },
  ]

  for (const item of productsToSeed) {
    const categoryId = catMap.get(item.categorySlug)
    if (!categoryId) continue

    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const priceUSD = Math.round((item.priceTZS / 2600) * 100) / 100
    const productCode = `LUMO-SEED-${Math.floor(100000 + Math.random() * 900000)}`

    const existing = await prisma.product.findUnique({ where: { slug } })
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          categoryId,
          priceTZS: item.priceTZS,
          priceUSD,
          status: 'PUBLISHED',
          isApproved: true,
          imageUrl: item.img,
          brand: item.brand,
        },
      })
    } else {
      await prisma.product.create({
        data: {
          productCode,
          title: item.title,
          slug,
          brand: item.brand,
          description: `${item.title} — Direct Factory Sourcing with Express Freight to Tanzania.`,
          shortDescription: item.title,
          categoryId,
          priceTZS: item.priceTZS,
          priceUSD,
          stock: 50,
          status: 'PUBLISHED',
          isApproved: true,
          sourceType: 'LUMO_SUPPLIER',
          sourceHub: 'Global Sourcing Catalog',
          imageUrl: item.img,
        },
      })
    }
  }

  // Update category IDs for existing CSV chairs & shoes to correct slugs
  const allProds = await prisma.product.findMany()
  for (const p of allProds) {
    const tLower = p.title.toLowerCase()
    let slugTarget = ''
    if (tLower.includes('chair') || tLower.includes('stool') || tLower.includes('desk') || tLower.includes('sofa')) {
      slugTarget = 'furniture'
    } else if (tLower.includes('shoe') || tLower.includes('oxford') || tLower.includes('sneaker') || tLower.includes('loafers')) {
      slugTarget = 'shoes'
    } else if (tLower.includes('dress') || tLower.includes('blouse') || tLower.includes('skirt') || tLower.includes("women's")) {
      slugTarget = 'womens-clothing'
    } else if (tLower.includes('suit') || tLower.includes('jacket') || tLower.includes("men's")) {
      slugTarget = 'mens-clothing'
    } else if (tLower.includes('wig') || tLower.includes('hair') || tLower.includes('weave')) {
      slugTarget = 'hair-wigs'
    } else if (tLower.includes('solar') || tLower.includes('inverter') || tLower.includes('panel')) {
      slugTarget = 'solar-power'
    }

    if (slugTarget && catMap.has(slugTarget)) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          categoryId: catMap.get(slugTarget)!,
          status: 'PUBLISHED',
          isApproved: true,
        },
      })
    }
  }

  const finalCount = await prisma.product.count()
  console.log(`SUCCESSFULLY SEEDED DB PRODUCTS: ${finalCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
