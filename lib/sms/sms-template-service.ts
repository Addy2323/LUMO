/**
 * SMS Template & Localization Engine for Lumo Commerce
 */

export type SmsTemplateType =
  | 'REGISTRATION_OTP'
  | 'PASSWORD_RESET_OTP'
  | 'ORDER_PAID_CUSTOMER'
  | 'ORDER_PAID_INTERNAL'
  | 'ORDER_PROCESSING'
  | 'ORDER_SOURCING'
  | 'SUPPLIER_CONFIRMED'
  | 'QUALITY_INSPECTION_STARTED'
  | 'QUALITY_INSPECTION_PASSED'
  | 'INSPECTION_PROBLEM'
  | 'PACKAGING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'ARRIVED_IN_TANZANIA'
  | 'CUSTOMS_CLEARANCE'
  | 'DELIVERY_SELECTION_REQUIRED'
  | 'OUT_FOR_DELIVERY'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_VERIFYING'
  | 'DELIVERY_DOOR_SELECTED'
  | 'DELIVERY_PICKUP_SELECTED'
  | 'DELIVERY_ACTION_STAFF'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'SOURCING_SUBMITTED'
  | 'SOURCING_QUOTATION_READY'
  | 'SOURCING_STATUS_UPDATE'
  | 'CUSTOM_MARKETING'
  | 'CUSTOM_ANNOUNCEMENT'

export interface SmsTemplateRenderParams {
  code?: string
  firstName?: string
  customerName?: string
  customerDisplayName?: string
  orderReference?: string
  sourcingReference?: string
  sourcingUrl?: string
  sourcingStatus?: string
  trackingUrl?: string
  internalOrderUrl?: string
  staffOrderUrl?: string
  deliverySelectionUrl?: string
  confirmationUrl?: string
  paymentUrl?: string
  shopUrl?: string
  marketplaceUrl?: string
  customContent?: string
  currency?: string
  amount?: string
  trackingNumber?: string
  estimatedArrival?: string
  pickupLocation?: string
  shortAddress?: string
  recipientName?: string
  deliveryMethod?: string
  refundStatusMessage?: string
  lang?: 'en' | 'sw'
}

export interface SmsSegmentInfo {
  characterCount: number
  segmentCount: number
  encoding: 'GSM-7' | 'UNICODE'
  estimatedCostTzs: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost') ? process.env.NEXT_PUBLIC_APP_URL : 'https://lumo.co.tz'

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
    en: 'Thank you for shopping with Lumo! We have successfully received your payment for Order {{orderReference}}. Your order is confirmed and our team will begin processing it shortly. Track your order securely at {{trackingUrl}}. Lumo — Global sourcing you can trust.',
    sw: 'Asante kwa kununua na Lumo! Tumepokea malipo yako ya Oda {{orderReference}}. Oda yako imethibitishwa na timu ready imeanza kuishughulikia. Fuatilia oda yako: {{trackingUrl}}. Lumo.',
  },
  ORDER_PAID_INTERNAL: {
    en: 'Lumo New Order: Paid Order {{orderReference}} has been received from {{customerName}} for {{currency}} {{amount}}. Action is required. Review and begin processing: {{staffOrderUrl}}.',
    sw: 'Oda Mpya ya Lumo: Oda iliyolipwa {{orderReference}} imepokelewa kutoka kwa {{customerName}} ya {{currency}} {{amount}}. Hatua inahitajika: {{staffOrderUrl}}.',
  },
  ORDER_PROCESSING: {
    en: 'Good news! Lumo has started processing Order {{orderReference}}. Our team is confirming the product and preparing the next steps. Follow progress: {{trackingUrl}}.',
    sw: 'Habari njema! Lumo imeanza kushughulikia Oda {{orderReference}}. Timu yetu inathibitisha bidhaa na kuandaa hatua zinazofuata. Fuatilia: {{trackingUrl}}.',
  },
  ORDER_SOURCING: {
    en: 'Lumo Update: Procurement for Order {{orderReference}} is now in progress. We are coordinating with the supplier and will keep you informed. Track: {{trackingUrl}}.',
    sw: 'Taarifa ya Lumo: Manunuzi ya Oda {{orderReference}} yanaendelea. Tunaratibu na muuzaji na tutakuarifu. Fuatilia: {{trackingUrl}}.',
  },
  SUPPLIER_CONFIRMED: {
    en: 'The supplier for your Lumo Order {{orderReference}} has been confirmed. Your order is moving to the next stage. Track progress: {{trackingUrl}}.',
    sw: 'Muuzaji wa Oda yako ya Lumo {{orderReference}} amethibitishwa. Oda yako inahamia hatua inayofuata. Fuatilia: {{trackingUrl}}.',
  },
  QUALITY_INSPECTION_STARTED: {
    en: 'Quality inspection has started for Lumo Order {{orderReference}}. Our team is checking the product against your order requirements. View progress: {{trackingUrl}}.',
    sw: 'Uhakiki wa ubora umeanza kwa Oda ya Lumo {{orderReference}}. Timu yetu inakagua bidhaa kulingana na mahitaji yako. Fuatilia: {{trackingUrl}}.',
  },
  QUALITY_INSPECTION_PASSED: {
    en: 'Your Lumo Order {{orderReference}} has passed quality inspection and is being prepared for shipment. Track the next stage: {{trackingUrl}}.',
    sw: 'Oda yako ya Lumo {{orderReference}} imepita uhakiki wa ubora na inaandaliwa kwa usafirishaji. Fuatilia: {{trackingUrl}}.',
  },
  INSPECTION_PROBLEM: {
    en: 'Lumo Update: Our inspection identified an issue with Order {{orderReference}}. We are working with the supplier before shipment. No action is required from you unless we contact you. Updates: {{trackingUrl}}.',
    sw: 'Taarifa ya Lumo: Uhakiki wetu umegundua tatizo kwenye Oda {{orderReference}}. Tunafanya kazi na muuzaji kabla ya kusafirisha. Taarifa: {{trackingUrl}}.',
  },
  PACKAGING: {
    en: 'Your Lumo Order {{orderReference}} is now being securely packed for shipment. Follow its progress: {{trackingUrl}}.',
    sw: 'Oda yako ya Lumo {{orderReference}} sasa inafungwa kwa usalama kwa ajili ya usafirishaji. Fuatilia: {{trackingUrl}}.',
  },
  SHIPPED: {
    en: 'Your Lumo Order {{orderReference}} has been shipped. Tracking number: {{trackingNumber}}. Estimated arrival: {{estimatedArrival}}. Track securely: {{trackingUrl}}.',
    sw: 'Oda yako ya Lumo {{orderReference}} imesafirishwa. Namba ya ufuatiliaji: {{trackingNumber}}. Matarajio ya kuwasili: {{estimatedArrival}}. Fuatilia: {{trackingUrl}}.',
  },
  IN_TRANSIT: {
    en: 'Your Lumo Order {{orderReference}} is in transit to Tanzania. We will notify you when it arrives. Track progress: {{trackingUrl}}.',
    sw: 'Oda yako ya Lumo {{orderReference}} iko safarini kuja Tanzania. Tutakuarifu itakapowasili. Fuatilia: {{trackingUrl}}.',
  },
  ARRIVED_IN_TANZANIA: {
    en: 'Great news! Your Lumo Order {{orderReference}} has arrived in Tanzania. We will complete the local clearance process and notify you when delivery selection is available. Track: {{trackingUrl}}.',
    sw: 'Habari njema! Oda yako ya Lumo {{orderReference}} imewasili Tanzania. Tutamaliza taratibu za kibali na kuarifu kuchagua uwasilishaji. Fuatilia: {{trackingUrl}}.',
  },
  CUSTOMS_CLEARANCE: {
    en: 'Your Lumo Order {{orderReference}} is undergoing local clearance in Tanzania. We will notify you when it is ready for delivery or pickup. Track: {{trackingUrl}}.',
    sw: 'Oda yako ya Lumo {{orderReference}} inapitia ukaguzi wa forodha Tanzania. Tutakuarifu iko tayari kwa uwasilishaji au kuchukua. Fuatilia: {{trackingUrl}}.',
  },
  DELIVERY_SELECTION_REQUIRED: {
    en: 'Your Lumo Order {{orderReference}} is ready for the final delivery arrangement. Choose door-to-door delivery or Lumo office pickup here: {{deliverySelectionUrl}}.',
    sw: 'Oda yako ya Lumo {{orderReference}} iko tayari kwa mpango wa mwisho wa uwasilishaji. Chagua uwasilishaji wa mlango kwa mlango au kuchukua ofisini: {{deliverySelectionUrl}}.',
  },
  OUT_FOR_DELIVERY: {
    en: 'Your Lumo Order {{orderReference}} is out for delivery. Please keep your registered phone available. Track delivery: {{trackingUrl}}.',
    sw: 'Oda yako ya Lumo {{orderReference}} iko njiani kuwasilishwa kwako. Tafadhali weka simu yako wazi. Fuatilia: {{trackingUrl}}.',
  },
  READY_FOR_PICKUP: {
    en: 'Your Lumo Order {{orderReference}} is ready for pickup at {{pickupLocation}}. Bring your pickup code and identification. Details: {{trackingUrl}}.',
    sw: 'Oda yako ya Lumo {{orderReference}} iko tayari kuchukuliwa {{pickupLocation}}. Leta namba yako ya siri na kitambulisho. Taarifa: {{trackingUrl}}.',
  },
  DELIVERED: {
    en: 'Your Lumo Order {{orderReference}} has been delivered. Thank you for choosing Lumo. Please confirm receipt and share your experience: {{confirmationUrl}}.',
    sw: 'Oda yako ya Lumo {{orderReference}} imewasilishwa. Asante kwa kuchagua Lumo. Tafadhali thibitisha na utoe maoni: {{confirmationUrl}}.',
  },
  COMPLETED: {
    en: 'Thank you for purchasing with Lumo! Order {{orderReference}} is complete. We appreciate your trust and look forward to serving you again. Discover more products: {{marketplaceUrl}}.',
    sw: 'Asante kwa kununua na Lumo! Oda {{orderReference}} imekamilika. Tunashukuru kwa kuamini Lumo na karibu tena: {{marketplaceUrl}}.',
  },
  PAYMENT_FAILED: {
    en: 'Your payment for Lumo Order {{orderReference}} was not completed. No successful payment has been recorded. You may retry securely at {{paymentUrl}} or contact Lumo Support.',
    sw: 'Malipo ya Oda {{orderReference}} hayajakamilika. Hakuna malipo yaliyopokelewa. Jaribu tena kwa usalama: {{paymentUrl}} au wasiliana nasi.',
  },
  PAYMENT_VERIFYING: {
    en: 'Lumo is verifying payment for Order {{orderReference}}. Please do not pay again until verification is complete. We will update you shortly. Status: {{trackingUrl}}.',
    sw: 'Lumo inahakiki malipo ya Oda {{orderReference}}. Tafadhali usilipe tena mpaka uhakiki ukamilike. Tutakuarifu hivi karibuni. Hali: {{trackingUrl}}.',
  },
  DELIVERY_DOOR_SELECTED: {
    en: 'Delivery confirmed for Lumo Order {{orderReference}}. Your order will be delivered to {{shortAddress}}. Recipient: {{recipientName}}. We will notify you when it is out for delivery. Track: {{trackingUrl}}.',
    sw: 'Uwasilishaji umethibitishwa kwa Oda {{orderReference}}. Oda yako itawasilishwa {{shortAddress}}. Mpokeaji: {{recipientName}}. Tutakuarifu ikitoka. Fuatilia: {{trackingUrl}}.',
  },
  DELIVERY_PICKUP_SELECTED: {
    en: 'Pickup confirmed for Lumo Order {{orderReference}} at {{pickupLocation}}. We will send your pickup code when the order is ready. Details: {{trackingUrl}}.',
    sw: 'Kuchukua kumethibitishwa kwa Oda {{orderReference}} katika ofisi ya {{pickupLocation}}. Tutatuma namba ya siri iko tayari. Taarifa: {{trackingUrl}}.',
  },
  DELIVERY_ACTION_STAFF: {
    en: 'Delivery action required: Customer has selected {{deliveryMethod}} for Order {{orderReference}}. Review and arrange fulfilment: {{staffOrderUrl}}.',
    sw: 'Hatua ya uwasilishaji inahitajika: Mteja amechagua {{deliveryMethod}} kwa Oda {{orderReference}}. Angalia na ratibu: {{staffOrderUrl}}.',
  },
  REFUND_INITIATED: {
    en: 'Lumo has initiated a refund for Order {{orderReference}}. Amount: {{currency}} {{amount}}. Processing time depends on the payment method. Track the refund: {{trackingUrl}}.',
    sw: 'Lumo imeanzisha marejesho ya fedha ya Oda {{orderReference}}. Kiasi: {{currency}} {{amount}}. Fuatilia marejesho: {{trackingUrl}}.',
  },
  REFUND_COMPLETED: {
    en: 'Your refund of {{currency}} {{amount}} for Lumo Order {{orderReference}} has been completed. View details: {{trackingUrl}}.',
    sw: 'Marejesho yako ya {{currency}} {{amount}} kwa Oda {{orderReference}} yamekamilika. Angalia taarifa: {{trackingUrl}}.',
  },
  ORDER_CANCELLED: {
    en: 'Lumo Order {{orderReference}} has been cancelled. {{refundStatusMessage}} View details or contact support: {{trackingUrl}}.',
    sw: 'Oda ya Lumo {{orderReference}} imeghairiwa. {{refundStatusMessage}} Angalia taarifa: {{trackingUrl}}.',
  },
  SOURCING_SUBMITTED: {
    en: 'Thank you for submitting your sourcing request with Lumo! Ticket {{sourcingReference}}. Our global procurement team in Shenzhen & Yiwu has received your request and is sourcing suppliers. Track status: {{sourcingUrl}}. Lumo — Global sourcing you can trust.',
    sw: 'Asante kwa kuwasilisha ombi lako la kutafuta bidhaa na Lumo! Namba ya Ombi {{sourcingReference}}. Timu yetu ya manunuzi Shenzhen & Yiwu inashughulikia. Fuatilia: {{sourcingUrl}}. Lumo.',
  },
  SOURCING_QUOTATION_READY: {
    en: 'Great news! Your factory quotation for Lumo Sourcing Ticket {{sourcingReference}} is now ready. Review factory details, landed costs, and approve your order: {{sourcingUrl}}.',
    sw: 'Habari njema! Nukuu ya bei ya Ombi lako la Lumo {{sourcingReference}} iko tayari. Angalia gharama na thibitisha oda yako: {{sourcingUrl}}.',
  },
  SOURCING_STATUS_UPDATE: {
    en: 'Lumo Update: Sourcing Ticket {{sourcingReference}} status has been updated to {{sourcingStatus}}. View details: {{sourcingUrl}}.',
    sw: 'Taarifa ya Lumo: Hali ya Ombi la Kutafuta Bidhaa {{sourcingReference}} imesasishwa kuwa {{sourcingStatus}}. Angalia taarifa: {{sourcingUrl}}.',
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

  const trackingUrl = params.trackingUrl || `${APP_URL}/orders/${params.orderReference || ''}`
  const sourcingUrl = params.sourcingUrl || `${APP_URL}/account/sourcing/${params.sourcingReference || ''}`
  const internalOrderUrl = params.internalOrderUrl || params.staffOrderUrl || `${APP_URL}/admin/orders/${params.orderReference || ''}`
  const staffOrderUrl = params.staffOrderUrl || internalOrderUrl
  const deliverySelectionUrl = params.deliverySelectionUrl || `${APP_URL}/orders/${params.orderReference || ''}/delivery-selection`
  const confirmationUrl = params.confirmationUrl || trackingUrl
  const paymentUrl = params.paymentUrl || `${APP_URL}/checkout`
  const shopUrl = params.shopUrl || `${APP_URL}/shop`
  const marketplaceUrl = params.marketplaceUrl || `${APP_URL}/marketplace`

  const replacements: Record<string, string> = {
    code: params.code || '',
    firstName: params.firstName || 'Customer',
    customerName: params.customerName || params.customerDisplayName || params.firstName || 'Customer',
    customerDisplayName: params.customerDisplayName || params.customerName || params.firstName || 'Valued Customer',
    orderReference: params.orderReference || '',
    sourcingReference: params.sourcingReference || '',
    sourcingUrl,
    sourcingStatus: params.sourcingStatus || 'PROCESSING',
    trackingUrl,
    internalOrderUrl,
    staffOrderUrl,
    deliverySelectionUrl,
    confirmationUrl,
    paymentUrl,
    shopUrl,
    marketplaceUrl,
    currency: params.currency || 'TZS',
    amount: params.amount || '0',
    trackingNumber: params.trackingNumber || '',
    estimatedArrival: params.estimatedArrival || '3-5 business days',
    pickupLocation: params.pickupLocation || 'Lumo Hub Dar es Salaam',
    shortAddress: params.shortAddress || 'Dar es Salaam',
    recipientName: params.recipientName || params.customerName || 'Customer',
    deliveryMethod: params.deliveryMethod || 'Door Delivery',
    refundStatusMessage: params.refundStatusMessage || 'Refund processing has been initiated.',
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
