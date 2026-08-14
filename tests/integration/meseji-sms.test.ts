/**
 * Meseji SMS Integration Test Suite
 */

import { normalizeTanzanianPhone } from '@/lib/sms/phone-normalizer'
import { redactApiKey, redactPhoneNumber, redactOtpCode, redactSmsBody, sanitizeSmsLogData } from '@/lib/sms/sms-redaction'
import { renderSmsTemplate, calculateSmsSegments } from '@/lib/sms/sms-template-service'
import { MesejiSmsProvider } from '@/lib/sms/meseji-sms-provider'

export function runMesejiSmsTests() {
  const results: { name: string; passed: boolean; detail: string }[] = []

  // 1. Phone Normalizer Tests
  const norm1 = normalizeTanzanianPhone('0712345678')
  results.push({
    name: 'Phone Normalizer - Local format 07XXXXXXXX',
    passed: norm1.isValid && norm1.e164 === '255712345678',
    detail: `Expected 255712345678, got ${norm1.e164}`,
  })

  const norm2 = normalizeTanzanianPhone('+255 768 828 247')
  results.push({
    name: 'Phone Normalizer - E.164 string with spaces and +',
    passed: norm2.isValid && norm2.e164 === '255768828247',
    detail: `Expected 255768828247, got ${norm2.e164}`,
  })

  const normInvalid = normalizeTanzanianPhone('12345')
  results.push({
    name: 'Phone Normalizer - Invalid length rejection',
    passed: !normInvalid.isValid,
    detail: `Expected invalid, got isValid=${normInvalid.isValid}`,
  })

  // 2. Security Redaction Tests
  const keyRedacted = redactApiKey('zs_test_9876543210abcdef1234567890abcdef')
  results.push({
    name: 'Security Redaction - API Key masking',
    passed: keyRedacted.startsWith('zs_') && keyRedacted.endsWith('cdef') && !keyRedacted.includes('9876543210'),
    detail: `Masked key: ${keyRedacted}`,
  })

  const phoneRedacted = redactPhoneNumber('255712345678')
  results.push({
    name: 'Security Redaction - Phone masking',
    passed: phoneRedacted === '2557****678',
    detail: `Masked phone: ${phoneRedacted}`,
  })

  const logSanitized = sanitizeSmsLogData({
    apiKey: 'zs_test_9876543210abcdef1234567890abcdef',
    phone: '255712345678',
    otp: '123456',
    message: 'Your verification code is 123456',
  })
  results.push({
    name: 'Security Redaction - Deep log payload sanitization',
    passed: !JSON.stringify(logSanitized).includes('123456') && !JSON.stringify(logSanitized).includes('9876543210'),
    detail: `Sanitized payload: ${JSON.stringify(logSanitized)}`,
  })

  // 3. Segment & Cost Calculator
  const gsmSegments = calculateSmsSegments('Lumo: Your verification code is 123456. It expires in 5 minutes.')
  results.push({
    name: 'SMS Calculator - Single GSM-7 segment',
    passed: gsmSegments.segmentCount === 1 && gsmSegments.encoding === 'GSM-7' && gsmSegments.estimatedCostTzs === 18,
    detail: `Segments: ${gsmSegments.segmentCount}, Cost: ${gsmSegments.estimatedCostTzs} TZS`,
  })

  // 4. Template Rendering
  const renderedSw = renderSmsTemplate('REGISTRATION_OTP', { code: '884920', lang: 'sw' })
  results.push({
    name: 'Template Service - Swahili OTP rendering',
    passed: renderedSw.includes('Nambari yako ya uhakiki ni 884920') && renderedSw.includes('dakika 5'),
    detail: `Rendered: "${renderedSw}"`,
  })

  return {
    suiteName: 'Meseji SMS Integration & Security Audit',
    results,
  }
}
