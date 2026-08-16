import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, rotateSession } from '@/lib/auth/server'
import { prisma } from '@/lib/db'
import { Role } from '@prisma/client'

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  BUYER: '/account',
  CUSTOMER: '/account',
  SUPPLIER: '/supplier',
  SALES: '/sales',
  LOGISTICS: '/logistics',
  AGENT: '/agent',
  ADMIN: '/admin',
}

/**
 * POST /api/session/active-role
 * Switches the user's active role. Validates against UserRoleAssignment or UserRole rows.
 * Rotates the session with the new activeRole embedded in JWT.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthenticatedUser(req)
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { user, sessionToken } = session

  let body: { role?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const requestedRole = (body.role || '').toUpperCase() as Role
  if (!requestedRole || !Object.keys(ROLE_DASHBOARD_MAP).includes(requestedRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const normalizedRole = requestedRole === 'CUSTOMER' ? ('BUYER' as Role) : requestedRole

  // Check database for active UserRoleAssignment or legacy UserRole
  const [roleAssignment, legacyUserRole] = await Promise.all([
    prisma.userRoleAssignment.findUnique({
      where: { userId_role: { userId: user.id, role: normalizedRole as any } },
    }),
    prisma.userRole.findUnique({
      where: { userId_role: { userId: user.id, role: normalizedRole } },
    }),
  ])

  const isRoleActive =
    (roleAssignment && roleAssignment.status === 'ACTIVE') ||
    (legacyUserRole && legacyUserRole.status === 'APPROVED')

  if (!isRoleActive) {
    // Fallback for default primary role if no role assignments recorded yet
    const hasAnyAssignments =
      (await prisma.userRoleAssignment.count({ where: { userId: user.id } })) > 0 ||
      (await prisma.userRole.count({ where: { userId: user.id } })) > 0

    if (!hasAnyAssignments && normalizedRole === user.role) {
      // Default primary role allowed for legacy users
    } else {
      return NextResponse.json(
        { error: `Forbidden: Role "${normalizedRole}" is revoked or not active on your account` },
        { status: 403 }
      )
    }
  }

  // Organization membership checks
  if (normalizedRole === 'ADMIN') {
    const adminMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        organization: { type: 'LUMO_INTERNAL' },
      },
    })
    if (!adminMembership) {
      console.warn(`[SECURITY AUDIT] User ${user.id} switching to ADMIN without LUMO_INTERNAL org membership`)
    }
  }

  if (normalizedRole === 'SUPPLIER' || normalizedRole === 'LOGISTICS') {
    const orgType = normalizedRole === 'SUPPLIER' ? 'SUPPLIER' : 'LOGISTICS_COMPANY'
    const orgMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        organization: { type: orgType as any },
      },
    })
    if (!orgMembership) {
      console.warn(`[SECURITY AUDIT] User ${user.id} switching to ${normalizedRole} without ${orgType} org membership`)
    }
  }

  // Rotate session with new activeRole
  const userAgent = req.headers.get('user-agent') || undefined
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
  await rotateSession(user.id, user.role, user.email, sessionToken, userAgent, ipAddress, normalizedRole)

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userRole: normalizedRole,
      action: 'ROLE_SWITCH',
      targetResource: `session:active-role`,
      details: `Switched active role to ${normalizedRole}`,
      ipAddress: ipAddress || null,
    },
  }).catch((err) => {
    console.error('[AUDIT] Failed to write role switch audit log:', err)
  })

  const redirectPath = ROLE_DASHBOARD_MAP[requestedRole] || ROLE_DASHBOARD_MAP[normalizedRole] || '/account'

  return NextResponse.json({
    success: true,
    activeRole: normalizedRole,
    redirectTo: redirectPath,
  })
}
