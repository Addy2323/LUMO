import { prisma } from '../lib/db'

async function clearAllSourcingData() {
  console.log('--- Wiping 100% of Sourcing & Conversation Records ---')

  await prisma.message.deleteMany({})
  await prisma.conversationParticipant.deleteMany({})
  await prisma.conversation.deleteMany({})
  await prisma.sourcingRequest.deleteMany({})

  console.log('[SUCCESS] All sourcing requests and conversations have been completely deleted.')
  await prisma.$disconnect()
}

clearAllSourcingData().catch((e) => {
  console.error(e)
  process.exit(1)
})
