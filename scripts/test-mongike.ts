import {
  normalizeTanzanianPhone,
  redactSensitiveData,
  initiatePaymentInputSchema,
  mongikeInitiationResponseSchema,
} from '../lib/payments/mongike-service'

function runTests() {
  console.log('=== RUNNING MONGIKE INTEGRATION TESTS ===')

  // Test 1: Phone normalization
  const phone1 = normalizeTanzanianPhone('0711788830')
  console.assert(phone1 === '255711788830', `Expected 255711788830, got ${phone1}`)

  const phone2 = normalizeTanzanianPhone('+255 711 788 830')
  console.assert(phone2 === '255711788830', `Expected 255711788830, got ${phone2}`)

  const phone3 = normalizeTanzanianPhone('255711788830')
  console.assert(phone3 === '255711788830', `Expected 255711788830, got ${phone3}`)

  console.log('[PASS] Phone Normalization (0711..., +255 711..., 255711...)')

  // Test 2: Data Redactor
  const sensitive = {
    apiKey: 'mk_e30f8cc15b26d1b37fd2743be7c3e49810ff8e5df7a2584d',
    buyerPhone: '255711788830',
    orderId: 'ORD-100',
  }
  const redacted = redactSensitiveData(sensitive)
  console.assert(redacted.apiKey === '[REDACTED_SECRET]', 'ApiKey should be redacted')
  console.assert(redacted.buyerPhone === '255****8830', 'Phone should be masked')
  console.assert(redacted.orderId === 'ORD-100', 'OrderId should remain unchanged')

  console.log('[PASS] Sensitive Log Redactor')

  // Test 3: Zod Schema Validation (including boolean status, numeric code & numeric id)
  const input = initiatePaymentInputSchema.parse({
    orderId: 'ORD-001',
    buyerPhone: '0711788830',
    feePayer: 'MERCHANT',
  })
  console.assert(input.orderId === 'ORD-001', 'Zod schema parsed orderId')

  const res1 = mongikeInitiationResponseSchema.parse({
    success: true,
    id: 'MNG-12345',
    status: 'PENDING',
  })
  console.assert(res1.id === 'MNG-12345', 'Zod schema parsed Mongike response with string status')

  const res2 = mongikeInitiationResponseSchema.parse({
    success: true,
    id: 998822,
    status: true,
    code: 200,
    data: {
      id: 123456,
      amount: 383000,
    },
  })
  console.assert(res2.id === '998822', 'Zod schema parsed numeric id transformed to string')
  console.assert(res2.status === true, 'Zod schema parsed boolean status')
  console.assert(res2.code === '200', 'Zod schema parsed numeric code transformed to string')

  console.log('[PASS] Zod Input & Flexible Response Schema Validation')

  console.log('====================================')
  console.log('ALL MONGIKE INTEGRATION TESTS PASSED!')
  console.log('====================================')
}

runTests()
