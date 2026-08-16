import { prisma } from '../lib/db'
import { SourcingStatus } from '@prisma/client'
import { createConversation } from '../lib/conversations/conversation-service'

async function seedSourcingTickets() {
  console.log('🌱 Seeding initial B2B Sourcing Requests into PostgreSQL...')

  // Find or create a demo buyer user
  let buyer = await prisma.user.findFirst({
    where: { role: 'BUYER' },
  })

  if (!buyer) {
    buyer = await prisma.user.create({
      data: {
        name: 'Amina Hassan (Demba Electronics)',
        email: 'amina.hassan@example.co.tz',
        phone: '+255712445908',
        role: 'BUYER',
        kycStatus: 'VERIFIED',
      },
    })
  }

  const sampleTickets = [
    {
      productUrl: 'https://detail.1688.com/offer/674829103.html',
      targetQuantity: 50,
      targetPriceUSD: 240,
      description: 'Solar Inverter 5kW Pure Sine Wave — Dual MPPT Hybrid Inverter for Dar es Salaam distribution.',
      status: SourcingStatus.SUBMITTED,
    },
    {
      productUrl: 'https://item.taobao.com/item.htm?id=920193847',
      targetQuantity: 200,
      targetPriceUSD: 85,
      description: 'Industrial Smart LED Street Lights 100W IP66 Waterproof for municipal tenders.',
      status: SourcingStatus.IN_REVIEW,
    },
    {
      productUrl: 'https://www.alibaba.com/product-detail/Commercial-Ice-Maker-100kg_1600492837.html',
      targetQuantity: 10,
      targetPriceUSD: 650,
      description: 'Heavy duty commercial ice making machine 100kg/24h stainless steel finish for hotel chain in Arusha.',
      status: SourcingStatus.QUOTED,
    },
    {
      productUrl: 'https://detail.1688.com/offer/583920194.html',
      targetQuantity: 500,
      targetPriceUSD: 18,
      description: 'Heavy Duty Ergonomic Mesh Office Chairs with lumbar support for corporate office fitting in Dodoma.',
      status: SourcingStatus.SUBMITTED,
    },
  ]

  for (const t of sampleTickets) {
    const targetPriceTZS = t.targetPriceUSD * 2600

    const req = await prisma.sourcingRequest.create({
      data: {
        buyerId: buyer.id,
        productUrl: t.productUrl,
        targetQuantity: t.targetQuantity,
        targetPriceTZS,
        description: t.description,
        status: t.status,
      },
    })

    console.log(`✅ Created SourcingRequest ${req.id} (Status: ${req.status})`)

    // Create linked conversation
    try {
      await createConversation({
        sourcingRequestId: req.id,
        visibility: 'CUSTOMER_VISIBLE',
        title: `Sourcing Discussion - SRC-${req.id.slice(0, 8).toUpperCase()}`,
        initialParticipants: [
          { userId: buyer.id, role: 'BUYER' },
        ],
      })
    } catch (e) {
      console.warn(`Conversation creation note:`, e)
    }
  }

  console.log('🎉 Sourcing tickets seeding finished successfully!')
}

seedSourcingTickets()
  .catch((err) => {
    console.error('❌ Seeding error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
