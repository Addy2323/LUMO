import { Prisma, EscrowStatus, OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/db'

export interface EscrowReleaseParams {
  orderId: string
  supplierId?: string
  performedByUserId: string
  userRole: string
}

/**
 * Escrow Ledger Service for LUMO Regulated Financial Holdings
 */
export class EscrowLedgerService {
  /**
   * Lock funds in escrow when payment is successfully confirmed
   */
  async lockInEscrow(orderId: string, transactionRef: string, amountTZS: Prisma.Decimal) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order) throw new Error('Order not found')

      const escrow = await tx.escrowLedger.upsert({
        where: { orderId },
        update: {
          status: EscrowStatus.HELD,
        },
        create: {
          orderId,
          buyerId: order.buyerId,
          amountTZS,
          status: EscrowStatus.HELD,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: order.buyerId,
          userRole: 'BUYER',
          action: 'ESCROW_FUNDS_HELD',
          targetResource: `Order:${order.orderNumber}`,
          details: `Locked TZS ${amountTZS} in Escrow Ledger. Ref: ${transactionRef}`,
        },
      })

      return escrow
    })
  }

  /**
   * Release escrow funds to supplier upon successful delivery confirmation
   */
  async releaseEscrowToSupplier({ orderId, supplierId, performedByUserId, userRole }: EscrowReleaseParams) {
    return prisma.$transaction(async (tx) => {
      const escrow = await tx.escrowLedger.findUnique({ where: { orderId } })
      if (!escrow) throw new Error('Escrow record not found')

      if (escrow.status !== EscrowStatus.HELD) {
        throw new Error(`Cannot release escrow in status ${escrow.status}`)
      }

      const updatedEscrow = await tx.escrowLedger.update({
        where: { orderId },
        data: {
          status: EscrowStatus.RELEASED,
          supplierId,
          releasedAt: new Date(),
        },
      })

      // Mark order as COMPLETED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      })

      await tx.auditLog.create({
        data: {
          userId: performedByUserId,
          userRole,
          action: 'ESCROW_FUNDS_RELEASED',
          targetResource: `Order:${orderId}`,
          details: `Released TZS ${escrow.amountTZS} from Escrow Ledger to Supplier ${supplierId || 'Default'}`,
        },
      })

      return updatedEscrow
    })
  }

  /**
   * Refund escrow funds back to buyer upon order cancellation or dispute resolution
   */
  async refundEscrowToBuyer({ orderId, performedByUserId, userRole }: EscrowReleaseParams) {
    return prisma.$transaction(async (tx) => {
      const escrow = await tx.escrowLedger.findUnique({ where: { orderId } })
      if (!escrow) throw new Error('Escrow record not found')

      const updatedEscrow = await tx.escrowLedger.update({
        where: { orderId },
        data: {
          status: EscrowStatus.REFUNDED,
          releasedAt: new Date(),
        },
      })

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED },
      })

      await tx.auditLog.create({
        data: {
          userId: performedByUserId,
          userRole,
          action: 'ESCROW_FUNDS_REFUNDED',
          targetResource: `Order:${orderId}`,
          details: `Refunded TZS ${escrow.amountTZS} from Escrow Ledger to Buyer ${escrow.buyerId}`,
        },
      })

      return updatedEscrow
    })
  }
}

export const escrowLedger = new EscrowLedgerService()
