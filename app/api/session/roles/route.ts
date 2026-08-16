import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/session/roles
 * Returns all approved roles for the authenticated user.
 * Falls back to User.role as primary default if no UserRole rows exist yet (migration compat).
 */
export async function GET(req: NextRequest) {
  const session = await getAuthenticatedUser(req)
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { user, activeRole } = session

  // Fetch approved roles from UserRole table
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id, status: 'APPROVED' },
    select: { role: true, approvedAt: true },
    orderBy: { createdAt: 'asc' },
  })

  let approvedRoles = userRoles.map((ur) => ({
    role: ur.role,
    approvedAt: ur.approvedAt,
  }))

  // Migration fallback: if no UserRole rows exist, use the legacy User.role
  if (approvedRoles.length === 0) {
    approvedRoles = [{ role: user.role, approvedAt: null }]
  }

  return NextResponse.json({
    userId: user.id,
    activeRole: activeRole ?? user.role,
    roles: approvedRoles,
  })
}
