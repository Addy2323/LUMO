import { prisma } from '@/lib/db'
import { normalizeTanzanianPhone } from '@/lib/sms/phone-normalizer'

export interface StaffRecipient {
  userId: string
  fullName: string
  phone: string
  e164: string
  role: 'ADMIN' | 'SALES'
}

/**
 * Resolves active Sales and Admin recipients for operational alerts.
 * Strictly deduplicates phone numbers so staff assigned multiple roles (e.g. ADMIN & SALES)
 * receive exactly ONE notification.
 */
export async function getSalesAndAdminRecipients(): Promise<StaffRecipient[]> {
  try {
    // 1. Fetch Users with primary role ADMIN or SALES
    const primaryStaff = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SALES'] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    })

    const recipientsMap = new Map<string, StaffRecipient>()

    const processUser = (user: { id: string; name: string | null; phone: string | null; role: any }, assignedRole?: 'ADMIN' | 'SALES') => {
      if (!user || !user.phone) return
      const norm = normalizeTanzanianPhone(user.phone)
      if (!norm.isValid) return

      // Deduplicate by e164 phone number
      if (!recipientsMap.has(norm.e164)) {
        recipientsMap.set(norm.e164, {
          userId: user.id,
          fullName: user.name || 'Lumo Team Member',
          phone: user.phone,
          e164: norm.e164,
          role: assignedRole || (user.role as 'ADMIN' | 'SALES') || 'SALES',
        })
      }
    }

    for (const u of primaryStaff) {
      processUser(u)
    }

    // Fallback: If no staff phone found in DB, use default internal sales duty phone
    if (recipientsMap.size === 0) {
      const fallbackPhone = process.env.INTERNAL_SALES_DUTY_PHONE || '255768828247'
      const normFallback = normalizeTanzanianPhone(fallbackPhone)
      if (normFallback.isValid) {
        recipientsMap.set(normFallback.e164, {
          userId: 'system_duty_group',
          fullName: 'Lumo Duty Manager',
          phone: fallbackPhone,
          e164: normFallback.e164,
          role: 'SALES',
        })
      }
    }

    return Array.from(recipientsMap.values())
  } catch (error) {
    console.error('[RECIPIENT RESOLVER ERROR]', error)
    return []
  }
}
