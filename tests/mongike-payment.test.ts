import { describe, it, expect } from 'vitest'
import {
  normalizeTanzanianPhone,
  redactSensitiveData,
  initiatePaymentInputSchema,
  mongikeInitiationResponseSchema,
} from '../lib/payments/mongike-service'

describe('Mongike Tanzania Mobile Money Integration Tests', () => {
  describe('Phone Number Normalization', () => {
    it('normalizes local Tanzanian phone number starting with 0', () => {
      expect(normalizeTanzanianPhone('0711788830')).toBe('255711788830')
      expect(normalizeTanzanianPhone('0768828247')).toBe('255768828247')
    })

    it('normalizes international format with plus sign', () => {
      expect(normalizeTanzanianPhone('+255 711 788 830')).toBe('255711788830')
      expect(normalizeTanzanianPhone('+255-754-112-233')).toBe('255754112233')
    })

    it('retains already valid 255 format', () => {
      expect(normalizeTanzanianPhone('255711788830')).toBe('255711788830')
    })

    it('throws error for invalid length numbers', () => {
      expect(() => normalizeTanzanianPhone('12345')).toThrow(/Invalid Tanzanian phone number length/)
      expect(() => normalizeTanzanianPhone('255711788830123')).toThrow(/Invalid Tanzanian phone number length/)
    })
  })

  describe('Sensitive Data Redactor', () => {
    it('redacts API keys, secrets, and phone numbers in log objects', () => {
      const logData = {
        orderId: 'ORD-12345',
        apiKey: 'mk_e30f8cc15b26d1b37fd2743be7c3e49810ff8e5df7a2584d',
        buyerPhone: '255711788830',
        metadata: {
          secretToken: 'super-secret',
          customerPhone: '0711788830',
        },
      }

      const redacted = redactSensitiveData(logData)

      expect(redacted.apiKey).toBe('[REDACTED_SECRET]')
      expect(redacted.buyerPhone).toBe('255****8830')
      expect(redacted.metadata.secretToken).toBe('[REDACTED_SECRET]')
      expect(redacted.metadata.customerPhone).toBe('071****8830')
      expect(redacted.orderId).toBe('ORD-12345')
    })
  })

  describe('Zod Input & Response Schemas', () => {
    it('validates correct initiation input', () => {
      const input = {
        orderId: 'ORD-999',
        buyerPhone: '0711788830',
        feePayer: 'MERCHANT',
      }
      const parsed = initiatePaymentInputSchema.parse(input)
      expect(parsed.orderId).toBe('ORD-999')
      expect(parsed.feePayer).toBe('MERCHANT')
    })

    it('validates provider initiation response', () => {
      const response = {
        success: true,
        id: 'MNG-PAY-882190',
        payment_id: 'MNG-PAY-882190',
        gateway_reference: 'GW-TZ-7721',
        status: 'PENDING',
        expires_at: '2026-08-21T08:00:00Z',
      }
      const parsed = mongikeInitiationResponseSchema.parse(response)
      expect(parsed.id).toBe('MNG-PAY-882190')
      expect(parsed.status).toBe('PENDING')
    })
  })
})
