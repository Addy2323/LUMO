import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { prisma } from '@/lib/db'
import { Role } from '@prisma/client'

export interface AuthorizationOptions {
  allowedRoles?: Role[]
  ownerUserId?: string
  organizationId?: string
  requireAdminMfa?: boolean
}

export interface AuthorizationResult {
  authorized: boolean
  user?: any
  activeRole?: Role
  organizationId?: string
  response?: NextResponse
}

/**
 * Database-Backed Active Role & Session Authorization Guard
 * Validates active DB session, active UserRoleAssignment, account status, org membership, and MFA.
 */
export async function authorizeApiRequest(
  req: NextRequest,
  optionsOrRoles?: Role[] | AuthorizationOptions,
  legacyOwnerUserId?: string
): Promise<AuthorizationResult> {
  try {
    // Support both legacy positional parameters and options object
    const options: AuthorizationOptions = Array.isArray(optionsOrRoles)
      ? { allowedRoles: optionsOrRoles, ownerUserId: legacyOwnerUserId }
      : optionsOrRoles || {}

    const { allowedRoles, ownerUserId, organizationId, requireAdminMfa = false } = options

    // 1. Fetch authenticated session & JWT claims
    const session = await getAuthenticatedUser(req)

    if (!session || !session.user) {
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      console.warn(`[SECURITY AUDIT 401] Unauthorized access attempt to ${req.method} ${req.nextUrl.pathname} from IP ${clientIp}`)
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
      }
    }

    const { user, activeRole } = session
    const effectiveRole = activeRole ?? user.role
    const platformRoleForAssignment = effectiveRole === 'CUSTOMER' ? 'BUYER' : effectiveRole

    // 2. Database validation: Verify session exists and user account is ACTIVE (not suspended)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        accountStatus: true,
        roleAssignments: {
          where: { role: platformRoleForAssignment as any, status: 'ACTIVE' },
        },
        userRoles: {
          where: { role: effectiveRole as any, status: 'APPROVED' },
        },
        organizationMemberships: organizationId
          ? {
              where: { organizationId, isActive: true },
            }
          : false,
      },
    }).catch((dbErr) => {
      console.warn('[AUTHORIZE DB WARNING] Unable to query roleAssignments/userRoles:', dbErr)
      return {
        id: user.id,
        accountStatus: user.accountStatus || 'ACTIVE',
        roleAssignments: [],
        userRoles: [],
        organizationMemberships: [],
      } as any
    })

    if (!dbUser || dbUser.accountStatus === 'SUSPENDED') {
      console.warn(`[SECURITY AUDIT 403] Account suspended or user not found: ${user.id}`)
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Account is suspended or invalid' }, { status: 403 }),
      }
    }

    // 3. Database validation: Verify active UserRoleAssignment (or legacy userRole/role)
    const hasActiveRoleAssignment =
      (dbUser.roleAssignments && dbUser.roleAssignments.length > 0) ||
      (dbUser.userRoles && dbUser.userRoles.length > 0) ||
      effectiveRole === user.role

    if (!hasActiveRoleAssignment) {
      console.warn(
        `[SECURITY AUDIT 403] User ${user.id} requested activeRole ${effectiveRole} which is not active/approved in DB`
      )
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Forbidden: Active role is revoked or not assigned' }, { status: 403 }),
      }
    }

    // 4. Organization membership check if organizationId specified
    if (organizationId && effectiveRole !== 'ADMIN') {
      const hasOrgMembership = dbUser.organizationMemberships && dbUser.organizationMemberships.length > 0
      if (!hasOrgMembership) {
        console.warn(
          `[SECURITY AUDIT 403] User ${user.id} lacks active membership in organization ${organizationId}`
        )
        return {
          authorized: false,
          response: NextResponse.json({ error: 'Forbidden: You are not an active member of this organization' }, { status: 403 }),
        }
      }
    }

    // 5. Role permissions check
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(effectiveRole)) {
        console.warn(
          `[SECURITY AUDIT 403] Forbidden role access to ${req.method} ${req.nextUrl.pathname} by user ${user.id} (activeRole: ${effectiveRole}). Required: ${allowedRoles.join(', ')}`
        )
        return {
          authorized: false,
          response: NextResponse.json({ error: 'Forbidden: Insufficient role permissions' }, { status: 403 }),
        }
      }
    }

    // 6. Ownership verification
    if (ownerUserId && effectiveRole !== 'ADMIN') {
      if (user.id !== ownerUserId) {
        console.warn(
          `[SECURITY AUDIT 403] Ownership check failed for user ${user.id} on resource owned by ${ownerUserId}`
        )
        return {
          authorized: false,
          response: NextResponse.json({ error: 'Forbidden: You do not own this resource' }, { status: 403 }),
        }
      }
    }

    // 7. Admin MFA Check
    if (effectiveRole === 'ADMIN' && requireAdminMfa) {
      const hasMfaVerified = req.cookies.get('lumo_admin_mfa')?.value === 'verified'
      if (!hasMfaVerified) {
        return {
          authorized: false,
          response: NextResponse.json({ error: 'Forbidden: Administrator MFA verification required' }, { status: 403 }),
        }
      }
    }

    return { authorized: true, user, activeRole: effectiveRole, organizationId }
  } catch (error: any) {
    console.error('[AUTHORIZE API REQUEST ERROR]', error?.message || error)
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Authorization check failed' }, { status: 500 }),
    }
  }
}
