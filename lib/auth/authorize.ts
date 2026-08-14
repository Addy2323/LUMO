import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { Role } from '@prisma/client'

export interface AuthorizationResult {
  authorized: boolean
  user?: any
  response?: NextResponse
}

/**
 * Double Boundary API Authorization & Ownership Guard
 * Validates session identity, checks role permissions, and verifies resource ownership.
 */
export async function authorizeApiRequest(
  req: NextRequest,
  allowedRoles?: Role[],
  ownerUserId?: string
): Promise<AuthorizationResult> {
  const session = await getAuthenticatedUser(req)

  if (!session || !session.user) {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    console.warn(`[SECURITY AUDIT 401] Unauthorized access attempt to ${req.method} ${req.nextUrl.pathname} from IP ${clientIp}`)
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    }
  }

  const { user } = session

  // Role hierarchy validation
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      console.warn(
        `[SECURITY AUDIT 403] Forbidden role access attempt to ${req.method} ${req.nextUrl.pathname} by user ${user.id} (${user.email}, role: ${user.role}). Required roles: ${allowedRoles.join(', ')}`
      )
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Forbidden: Insufficient role permissions' }, { status: 403 }),
      }
    }
  }

  // Object ownership verification: Admin bypasses ownership check, other roles must own the resource
  if (ownerUserId && user.role !== 'ADMIN') {
    if (user.id !== ownerUserId) {
      console.warn(
        `[SECURITY AUDIT 403] Forbidden resource ownership attempt to ${req.method} ${req.nextUrl.pathname} by user ${user.id} (${user.email}). Resource owner: ${ownerUserId}`
      )
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Forbidden: You do not own this resource' }, { status: 403 }),
      }
    }
  }

  return { authorized: true, user }
}
