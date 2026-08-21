import 'dotenv/config'
import { initiateMongikeMobileMoneyPayment } from '../lib/payments/mongike-service'

async function testLivePush() {
  console.log('--- TESTING MONGIKE LIVE INITIATION DISPATCH ---')
  const testPhone = process.env.TEST_BUYER_PHONE || '255711788830'
  const uniqueOrderNumber = `LUMO-TEST-${Math.floor(100000 + Math.random() * 900000)}`
  
  try {
    const result = await initiateMongikeMobileMoneyPayment({
      orderId: `test-uuid-${Date.now()}`,
      orderNumber: uniqueOrderNumber,
      amountTZS: 1000, // 1,000 TZS
      buyerPhone: testPhone,
      feePayer: 'MERCHANT',
      buyerName: 'Test Customer',
      buyerEmail: 'dev@lumo.co.tz',
    })

    console.log('Result Success:', result.success)
    console.log('Result Status:', result.status)
    console.log('Provider Payment ID:', result.providerPaymentId)
    console.log('Gateway Reference:', result.gatewayReference)
    console.log('Failure Code:', result.failureCode)
    console.log('Failure Message:', result.failureMessage)
    console.log('Raw Provider Response:', JSON.stringify(result.rawResponse, null, 2))
  } catch (err: any) {
    console.error('Error during live push test:', err)
  }
}

testLivePush()
