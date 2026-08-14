import { NextRequest, NextResponse } from 'next/server'
import { getActiveSmsProvider } from '@/lib/sms/sms-service'
import { normalizeTanzanianPhone } from '@/lib/sms/phone-normalizer'
import { env } from '@/lib/env'

export async function POST(req: NextRequest) {
  try {
    const { recipientPhone, message } = await req.json()

    if (!recipientPhone || !message) {
      return NextResponse.json({ error: 'Recipient phone number and test message are required.' }, { status: 400 })
    }

    const norm = normalizeTanzanianPhone(recipientPhone)
    if (!norm.isValid) {
      return NextResponse.json({ error: norm.error || 'Invalid Tanzanian phone number format.' }, { status: 400 })
    }

    const provider = getActiveSmsProvider()
    const senderId = env.MESEJI_SENDER_ID || 'LUMO'

    const result = await provider.send({
      senderId,
      message,
      contacts: [norm.e164],
      correlationId: `test_${Date.now()}`,
    })

    return NextResponse.json({
      success: true,
      provider: provider.name,
      batchId: result.batchId,
      message: `Test SMS dispatched successfully to ${norm.formattedDisplay}.`,
    })
  } catch (error: any) {
    console.error('[ADMIN SMS TEST DISPATCH ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to dispatch test SMS' }, { status: 500 })
  }
}
