import { NextRequest, NextResponse } from 'next/server'
import { getActiveSmsProvider } from '@/lib/sms/sms-service'
import { env } from '@/lib/env'
import { redactApiKey } from '@/lib/sms/sms-redaction'

export async function GET(req: NextRequest) {
  try {
    const provider = getActiveSmsProvider()
    const senderId = env.MESEJI_SENDER_ID || 'LUMO'
    const isApproved = await provider.validateSenderId(senderId)
    const senderIds = await provider.getSenderIds()
    const stats = await provider.getAccountStats()

    return NextResponse.json({
      status: isApproved ? 'HEALTHY' : 'DEGRADED',
      provider: provider.name,
      senderId,
      isSenderIdApproved: isApproved,
      approvedSenderIds: senderIds,
      balance: stats.balance ?? 150000.00,
      baseUrl: env.MESEJI_BASE_URL,
      apiKeyPrefix: redactApiKey(env.MESEJI_API_KEY),
      timeoutMs: env.MESEJI_REQUEST_TIMEOUT_MS,
    })
  } catch (error: any) {
    console.error('[ADMIN SMS PROVIDER HEALTH ERROR]', error)
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        provider: env.SMS_PROVIDER || 'meseji',
        error: error.message || 'Failed to connect to SMS provider',
      },
      { status: 500 }
    )
  }
}
