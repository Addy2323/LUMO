import { NextRequest, NextResponse } from 'next/server'
import { SmsCampaignType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { calculateSmsSegments } from '@/lib/sms/sms-template-service'
import { normalizeTanzanianPhone } from '@/lib/sms/phone-normalizer'
import { getActiveSmsProvider } from '@/lib/sms/sms-service'

export async function GET(req: NextRequest) {
  try {
    const campaigns = await prisma.smsCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: {
          select: { recipients: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      campaigns,
    })
  } catch (error: any) {
    console.error('[ADMIN SMS CAMPAIGNS LIST ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { campaignName, campaignType, senderId, language, messageContent, audienceFilter } = body

    if (!campaignName || !messageContent) {
      return NextResponse.json({ error: 'Campaign name and message content are required.' }, { status: 400 })
    }

    // Coerce campaignType to valid SmsCampaignType Prisma Enum
    let validCampaignType: SmsCampaignType = SmsCampaignType.SERVICE
    const rawType = (campaignType || '').toUpperCase()
    if (rawType === 'TRANSACTIONAL') validCampaignType = SmsCampaignType.TRANSACTIONAL
    else if (rawType === 'MARKETING') validCampaignType = SmsCampaignType.MARKETING
    else if (rawType === 'SECURITY') validCampaignType = SmsCampaignType.SECURITY
    else validCampaignType = SmsCampaignType.SERVICE

    // Segment & Cost calculation
    const segmentInfo = calculateSmsSegments(messageContent)
    
    // Calculate eligible recipients based on audience filter
    let audienceCriteria: any = {}
    try {
      if (typeof audienceFilter === 'string') audienceCriteria = JSON.parse(audienceFilter)
      else if (audienceFilter) audienceCriteria = audienceFilter
    } catch {}

    const targetRole = (audienceCriteria.role || 'ALL').toUpperCase()
    
    // Include all registered non-suspended users (ACTIVE + PENDING_PHONE_VERIFICATION)
    let usersQuery: any = {
      accountStatus: { not: 'SUSPENDED' },
    }

    if (targetRole !== 'ALL') {
      if (targetRole === 'BUYER' || targetRole === 'CUSTOMER') {
        usersQuery.role = { in: ['BUYER', 'CUSTOMER'] }
      } else {
        usersQuery.role = targetRole
      }
    }

    // Query registered user mobile numbers directly from PostgreSQL
    const eligibleUsers = await prisma.user.findMany({
      where: usersQuery,
      select: { id: true, name: true, phone: true, role: true, accountStatus: true },
    })

    const validRecipients: { userId: string; phoneE164: string; name: string }[] = []
    let excludedCount = 0

    for (const u of eligibleUsers) {
      if (!u.phone) {
        excludedCount++
        continue
      }
      const norm = normalizeTanzanianPhone(u.phone)
      if (norm.isValid) {
        validRecipients.push({ userId: u.id, phoneE164: norm.e164, name: u.name || 'User' })
      } else {
        excludedCount++
      }
    }

    const recipientCount = validRecipients.length
    const estimatedCostTzs = recipientCount * segmentInfo.estimatedCostTzs

    // Two-person approval threshold: Large campaigns (> 50 recipients) require PENDING_APPROVAL
    const status = recipientCount > 50 ? 'PENDING_APPROVAL' : 'APPROVED'

    const campaign = await prisma.smsCampaign.create({
      data: {
        campaignName,
        campaignType: validCampaignType,
        senderId: senderId || 'LUMO',
        language: language || 'sw',
        messageContent,
        audienceFilter: JSON.stringify(audienceCriteria),
        recipientCount,
        excludedCount,
        estimatedSegments: segmentInfo.segmentCount,
        estimatedCostTzs,
        status,
        createdById: 'admin_user_id',
      },
    })

    // Populate campaign recipients and dispatch to registered user mobile numbers
    let dispatchResult = null
    if (validRecipients.length > 0) {
      // 1. Record recipients in DB
      await prisma.smsCampaignRecipient.createMany({
        data: validRecipients.map((r) => ({
          campaignId: campaign.id,
          userId: r.userId,
          phoneE164: r.phoneE164,
          status: status === 'APPROVED' ? 'QUEUED' : 'PENDING_APPROVAL',
        })),
      })

      // 2. Dispatch SMS via active provider (Meseji / Beem Africa / Dev Logger) if APPROVED
      if (status === 'APPROVED') {
        const smsProvider = getActiveSmsProvider()
        const targetPhones = validRecipients.map((r) => r.phoneE164)
        
        try {
          dispatchResult = await smsProvider.send({
            senderId: senderId || 'LUMO',
            message: messageContent,
            contacts: targetPhones,
            correlationId: campaign.id,
          })
          console.log(`[SMS CAMPAIGN DISPATCH] Sent broadcast to ${targetPhones.length} registered mobile numbers via ${smsProvider.name}:`, targetPhones)
        } catch (dispatchErr) {
          console.error('[SMS CAMPAIGN DISPATCH ERROR]', dispatchErr)
        }
      }
    }

    return NextResponse.json({
      success: true,
      campaign,
      recipientCount,
      excludedCount,
      estimatedCostTzs,
      requiresApproval: status === 'PENDING_APPROVAL',
      dispatchedRecipients: validRecipients.map((r) => ({ name: r.name, phone: r.phoneE164 })),
      providerBatchId: dispatchResult?.batchId,
    })
  } catch (error: any) {
    console.error('[ADMIN SMS CAMPAIGN CREATE ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 })
  }
}
