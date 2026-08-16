import { prisma } from '../lib/db'
import { createConversation, postMessage } from '../lib/conversations/conversation-service'

async function clearAndSeedSourcing() {
  console.log('--- Clearing All Existing Sourcing & Conversation Data ---')

  // 1. Delete messages, participants, conversations, and sourcing requests
  await prisma.message.deleteMany({})
  await prisma.conversationParticipant.deleteMany({})
  await prisma.conversation.deleteMany({})
  await prisma.sourcingRequest.deleteMany({})

  console.log('[SUCCESS] Database cleared cleanly.')

  console.log('--- Seeding Fresh Synchronized Sourcing Requests ---')

  // Find demo buyer user or first buyer
  const buyer = await prisma.user.findFirst({
    where: {
      email: { in: ['jonson@gmail.com', 'buyer@lumo.co.tz', 'amina.hassan@example.co.tz'] },
    },
  })

  if (!buyer) {
    console.error('[ERROR] No buyer user found for seeding.')
    process.exit(1)
  }

  // Create 2 fresh clean tickets in PostgreSQL
  const req1 = await prisma.sourcingRequest.create({
    data: {
      buyerId: buyer.id,
      productUrl: 'https://detail.1688.com/offer/7421890123.html',
      targetQuantity: 10,
      targetPriceTZS: 1620000,
      description: '500W Portable Solar Power Station with 100W foldable solar panel',
      status: 'SUBMITTED',
    },
  })

  const conv1 = await createConversation({
    sourcingRequestId: req1.id,
    title: `Sourcing Request: SRC-${req1.id.slice(0, 8).toUpperCase()}`,
    visibility: 'ASSIGNED_PARTICIPANTS',
    initialParticipants: [{ userId: buyer.id, role: 'BUYER' }],
  })

  await postMessage({
    conversationId: conv1.id,
    senderId: buyer.id,
    senderRole: 'BUYER',
    content: 'Hello Lumo Team! I submitted this request for 10 units of 500W Portable Solar Generators. Please inspect factory pricing in Guangzhou.',
  })

  const req2 = await prisma.sourcingRequest.create({
    data: {
      buyerId: buyer.id,
      productUrl: 'https://www.alibaba.com/product-detail/Top-Selling-Cars-5-Seater-SUV_1601673160277.html',
      targetQuantity: 48,
      targetPriceTZS: 700000000,
      description: 'Top Selling Cars 5-Seater SUV 2026 Edition with full accessories',
      status: 'SUBMITTED',
    },
  })

  const conv2 = await createConversation({
    sourcingRequestId: req2.id,
    title: `Sourcing Request: SRC-${req2.id.slice(0, 8).toUpperCase()}`,
    visibility: 'ASSIGNED_PARTICIPANTS',
    initialParticipants: [{ userId: buyer.id, role: 'BUYER' }],
  })

  await postMessage({
    conversationId: conv2.id,
    senderId: buyer.id,
    senderRole: 'BUYER',
    content: 'Requesting landed TZS quotation for 48 units of 5-Seater SUV to Dar es Salaam port.',
  })

  console.log(`[SUCCESS] Created 2 fresh sourcing tickets & conversation threads in PostgreSQL:`)
  console.log(`- SRC-${req1.id.slice(0, 8).toUpperCase()} (10 units)`)
  console.log(`- SRC-${req2.id.slice(0, 8).toUpperCase()} (48 units)`)

  await prisma.$disconnect()
}

clearAndSeedSourcing().catch((e) => {
  console.error(e)
  process.exit(1)
})
