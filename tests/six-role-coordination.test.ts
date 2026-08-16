import { describe, it, expect, beforeAll } from 'vitest'
import { canRolePerformTransition, ALLOWED_TRANSITIONS } from '../lib/orders/state-machine'
import { publishDomainEvent } from '../lib/events/domain-event-service'

describe('Lumo Six-Role Coordination System', () => {
  describe('State Machine & RBAC Gating', () => {
    it('allows BUYER or ADMIN to move order from PENDING_PAYMENT to PAID', () => {
      expect(canRolePerformTransition('BUYER', 'PENDING_PAYMENT', 'PAID')).toBe(true)
      expect(canRolePerformTransition('ADMIN', 'PENDING_PAYMENT', 'PAID')).toBe(true)
      expect(canRolePerformTransition('SUPPLIER', 'PENDING_PAYMENT', 'PAID')).toBe(false)
    })

    it('allows SUPPLIER to move order from PAID to PROCESSING', () => {
      expect(canRolePerformTransition('SUPPLIER', 'PAID', 'PROCESSING')).toBe(true)
      expect(canRolePerformTransition('LOGISTICS', 'PAID', 'PROCESSING')).toBe(false)
      expect(canRolePerformTransition('BUYER', 'PAID', 'PROCESSING')).toBe(false)
    })

    it('allows LOGISTICS to move order from IN_TRANSIT to DELIVERED', () => {
      expect(canRolePerformTransition('LOGISTICS', 'IN_TRANSIT', 'DELIVERED')).toBe(true)
      expect(canRolePerformTransition('SUPPLIER', 'IN_TRANSIT', 'DELIVERED')).toBe(false)
    })

    it('prevents invalid transition states', () => {
      expect(canRolePerformTransition('BUYER', 'PENDING_PAYMENT', 'DELIVERED')).toBe(false)
      expect(canRolePerformTransition('LOGISTICS', 'CANCELLED', 'SHIPPED')).toBe(false)
    })
  })

  describe('Allowed Role Transitions Audit', () => {
    it('contains valid role mappings for all defined transitions', () => {
      for (const [fromState, targetMap] of Object.entries(ALLOWED_TRANSITIONS)) {
        for (const [toState, roles] of Object.entries(targetMap)) {
          expect(Array.isArray(roles)).toBe(true)
          expect(roles.length).toBeGreaterThan(0)
        }
      }
    })
  })
})
