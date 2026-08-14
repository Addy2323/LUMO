/**
 * SMS Template & Localization Engine for Lumo Commerce
 */

export type SmsTemplateType =
  | 'REGISTRATION_OTP'
  | 'PASSWORD_RESET_OTP'
  | 'ORDER_PAID_CUSTOMER'
  | 'ORDER_PAID_INTERNAL'
  | 'ORDER_DELIVERED_CUSTOMER'
  | 'CUSTOM_MARKETING'
  | 'CUSTOM_ANNOUNCEMENT'

export interface SmsTemplateRenderParams {
  code?: string
  firstName?: string
  customerDisplayName?: string
  orderReference?: string
  trackingUrl?: string
  internalOrderUrl?: string
  shopUrl?: string
  customContent?: string
  lang?: 'en' | 'sw'
}

export interface SmsSegmentInfo {
  characterCount: number
  segmentCount: number
  encoding: 'GSM-7' | 'UNICODE'
  estimatedCostTzs: number // approx 18 TZS per segment in TZ
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lumo.co.tz'

export const DEFAULT_TEMPLATES: Record<SmsTemplateType, { en: string; sw: string }> = {
  REGISTRATION_OTP: {
    en: 'Lumo: Your verification code is {{code}}. It expires in 5 minutes. Do not share this code with anyone.',
    sw: 'Lumo: Nambari yako ya uhakiki ni {{code}}. Itaisha baada ya dakika 5. Usishiriki nambari hii na mtu yeyote.',
  },
  PASSWORD_RESET_OTP: {
    en: 'Lumo: Your password reset code is {{code}}. It expires in 5 minutes. If you did not request this, ignore this message.',
    sw: 'Lumo: Nambari yako ya kubadilisha nywila ni {{code}}. Itaisha baada ya dakika 5. Ikiwa hukuomba, puuza ujumbe huu.',
  },
  ORDER_PAID_CUSTOMER: {
    en: 'Hello {{firstName}}, your Lumo payment for order {{orderReference}} has been confirmed. We are preparing your order and will update you as it progresses. Track your order: {{trackingUrl}}',
    sw: 'Habari {{firstName}}, malipo yako ya oda {{orderReference}} ya Lumo yamethibitishwa. Tunaandaa oda yako na tutakuarifu. Fuatilia oda: {{trackingUrl}}',
  },
  ORDER_PAID_INTERNAL: {
    en: 'Lumo order alert: Paid order {{orderReference}} from {{customerDisplayName}} requires processing. Open: {{internalOrderUrl}}',
    sw: 'Lumo order alert: Paid order {{orderReference}} from {{customerDisplayName}} requires processing. Open: {{internalOrderUrl}}',
  },
  ORDER_DELIVERED_CUSTOMER: {
    en: 'Thank you, {{firstName}}. Order {{orderReference}} has been delivered. We appreciate your trust in Lumo and welcome you to shop with us again: {{shopUrl}}',
    sw: 'Asante {{firstName}}. Oda {{orderReference}} imewasilishwa. Tunashukuru kwa kuamini Lumo na karibu ununue tena: {{shopUrl}}',
  },
  CUSTOM_MARKETING: {
    en: 'Lumo Offer: {{customContent}} Reply STOP to opt out.',
    sw: 'Ofa ya Lumo: {{customContent}} Jibu STOP kujitoa.',
  },
  CUSTOM_ANNOUNCEMENT: {
    en: 'Lumo Announcement: {{customContent}}',
    sw: 'Taarifa ya Lumo: {{customContent}}',
  },
}

/**
 * Render SMS message using template parameters
 */
export function renderSmsTemplate(type: SmsTemplateType, params: SmsTemplateRenderParams): string {
  const lang = params.lang || 'en'
  const templateObj = DEFAULT_TEMPLATES[type] || DEFAULT_TEMPLATES.CUSTOM_ANNOUNCEMENT
  let rawTemplate = templateObj[lang] || templateObj.en

  // Fill default URLs if omitted
  const trackingUrl = params.trackingUrl || `${APP_URL}/orders/${params.orderReference || ''}`
  const internalOrderUrl = params.internalOrderUrl || `${APP_URL}/admin/orders/${params.orderReference || ''}`
  const shopUrl = params.shopUrl || `${APP_URL}/shop`

  const replacements: Record<string, string> = {
    code: params.code || '',
    firstName: params.firstName || 'Customer',
    customerDisplayName: params.customerDisplayName || params.firstName || 'Valued Customer',
    orderReference: params.orderReference || '',
    trackingUrl,
    internalOrderUrl,
    shopUrl,
    customContent: params.customContent || '',
  }

  for (const [key, val] of Object.entries(replacements)) {
    rawTemplate = rawTemplate.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), val)
  }

  return rawTemplate
}

/**
 * Calculate SMS segment count and encoding type
 */
export function calculateSmsSegments(text: string): SmsSegmentInfo {
  // Check if text contains non-GSM-7 characters
  // Basic GSM-7 character set regex
  const gsm7Regex = /^[\x20-\x7E\r\n€äöüÄÖÜßàèéìòùÅåÆæØøñÑS]*$/
  const isGsm7 = gsm7Regex.test(text)

  const characterCount = text.length
  let segmentCount = 1

  if (isGsm7) {
    if (characterCount <= 160) {
      segmentCount = 1
    } else {
      segmentCount = Math.ceil(characterCount / 153)
    }
  } else {
    // Unicode (UCS-2)
    if (characterCount <= 70) {
      segmentCount = 1
    } else {
      segmentCount = Math.ceil(characterCount / 67)
    }
  }

  return {
    characterCount,
    segmentCount,
    encoding: isGsm7 ? 'GSM-7' : 'UNICODE',
    estimatedCostTzs: segmentCount * 18,
  }
}
