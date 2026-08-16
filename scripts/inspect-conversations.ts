import { prisma } from '../lib/db'

async function inspect() {
  console.log('=== SOURCING REQUESTS ===')
  const reqs = await prisma.sourcingRequest.findMany({
    include: { buyer: true },
  })
  console.log(JSON.stringify(reqs, null, 2))

  console.log('=== CONVERSATIONS ===')
  const convs = await prisma.conversation.findMany({
    include: {
      participants: { include: { user: true } },
      messages: true,
    },
  })
  console.log(JSON.stringify(convs, null, 2))

  await prisma.$disconnect()
}

inspect().catch(console.error)
