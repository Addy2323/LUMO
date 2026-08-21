import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { Role, AccountStatus, OtpPurpose } from '@prisma/client'

const JWT_SECRET_BYTES = new TextEncoder().encode(env.JWT_SECRET)
export const COOKIE_NAME = 'lumo_session'
export const RESET_COOKIE_NAME = 'lumo_reset_token'
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// Fixed pre-computed dummy hash using bcrypt cost 12 to equalize timing for unknown accounts
export const DUMMY_PASSWORD_HASH = '$2a$12$e8p1O6JvPzDq20.2sT8cce2V/ZJtD1mC/5eOq30wN/J6H7K8L9M0O'

export interface JWTPayload {
  userId: string
  role: Role
  activeRole: Role
  email: string
  sessionToken: string
}

/**
 * Hash a plain text password using bcrypt (cost 12)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

/**
 * Verify password against bcrypt hash using central function
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

/**
 * Sign Edge-compatible JWT
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET_BYTES)
}

/**
 * Verify Edge-compatible JWT
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET_BYTES)
    return verified.payload as unknown as JWTPayload
  } catch {
    return null
  }
}

/**
 * Create a database-backed revocable session & set httpOnly session cookie
 */
export async function createSession(
  userId: string,
  userRole: Role,
  email: string,
  userAgent?: string,
  ipAddress?: string,
  activeRole?: Role
): Promise<{ token: string; expiresAt: Date }> {
  const resolvedActiveRole = activeRole ?? userRole
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const sessionToken = `sess_${crypto.randomUUID()}`

  try {
    await prisma.session.create({
      data: {
        userId,
        sessionToken,
        activeRole: resolvedActiveRole,
        expiresAt,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
      },
    })
  } catch (error) {
    console.error('[AUTH DB ERROR] Unable to write session record to database:', error)
    throw new Error('Session creation failed: database unavailable')
  }

  const jwt = await signJWT({
    userId,
    role: userRole,
    activeRole: resolvedActiveRole,
    email,
    sessionToken,
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })

  return { token: jwt, expiresAt }
}

/**
 * Rotate an existing session to prevent session fixation attacks
 */
export async function rotateSession(
  userId: string,
  userRole: Role,
  email: string,
  oldSessionToken?: string,
  userAgent?: string,
  ipAddress?: string,
  activeRole?: Role
): Promise<{ token: string; expiresAt: Date }> {
  if (oldSessionToken) {
    await prisma.session.deleteMany({
      where: { sessionToken: oldSessionToken },
    }).catch(() => {})
  }
  return createSession(userId, userRole, email, userAgent, ipAddress, activeRole)
}

/**
 * Revoke ALL active sessions & refresh tokens for a user (e.g. after password reset)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  }).catch(() => {})

  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  cookieStore.delete(RESET_COOKIE_NAME)
}

/**
 * Issue single-use password reset authorization transport via HttpOnly cookie
 */
export async function issuePasswordResetTokenCookie(
  userId: string,
  challengeId: string
): Promise<{ token: string; expiresAt: Date }> {
  const rawToken = `rst_${crypto.randomBytes(32).toString('hex')}`
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.passwordResetAuthorization.create({
    data: {
      userId,
      challengeId,
      tokenHash,
      purpose: OtpPurpose.PASSWORD_RESET,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(RESET_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })

  return { token: rawToken, expiresAt }
}

/**
 * Read and verify password reset token cookie
 */
export async function verifyPasswordResetTokenCookie(): Promise<{
  userId: string
  challengeId: string
  authId: string
} | null> {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(RESET_COOKIE_NAME)?.value

  if (!rawToken) return null

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const resetAuth = await prisma.passwordResetAuthorization.findUnique({
    where: { tokenHash },
  })

  if (
    !resetAuth ||
    resetAuth.consumedAt ||
    resetAuth.expiresAt < new Date() ||
    resetAuth.purpose !== OtpPurpose.PASSWORD_RESET
  ) {
    return null
  }

  return {
    userId: resetAuth.userId,
    challengeId: resetAuth.challengeId,
    authId: resetAuth.id,
  }
}

/**
 * Clear password reset token cookie and mark authorization consumed
 */
export async function clearPasswordResetTokenCookie(authId?: string): Promise<void> {
  if (authId) {
    await prisma.passwordResetAuthorization.update({
      where: { id: authId },
      data: { consumedAt: new Date() },
    }).catch(() => {})
  }

  const cookieStore = await cookies()
  cookieStore.delete(RESET_COOKIE_NAME)
}

/**
 * Get authenticated user & active session from request/cookies.
 */
export async function getAuthenticatedUser(req?: Request | NextRequest) {
  let token: string | undefined

  if (req) {
    if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
      token = (req as NextRequest).cookies.get(COOKIE_NAME)?.value
    } else {
      const cookieHeader = req.headers.get('cookie')
      if (cookieHeader) {
        const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
        if (match) token = match.split('=')[1]?.trim()
      }
    }
    if (!token) {
      const authHeader = req.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
  } else {
    const cookieStore = await cookies()
    token = cookieStore.get(COOKIE_NAME)?.value
  }

  if (!token) return null

  const payload = await verifyJWT(token)
  if (!payload || !payload.sessionToken) return null

  try {
    const dbSession = await prisma.session.findUnique({
      where: { sessionToken: payload.sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            companyName: true,
            kycStatus: true,
            phoneVerifiedAt: true,
            accountStatus: true,
            authenticationHoldUntil: true,
          },
        },
      },
    })

    if (dbSession) {
      if (dbSession.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: dbSession.id } }).catch(() => {})
        return null
      }

      return {
        user: dbSession.user,
        sessionToken: dbSession.sessionToken,
        activeRole: dbSession.activeRole ?? dbSession.user.role,
      }
    }
  } catch (error) {
    console.error('[AUTH SECURITY ERROR] Database query failed during session verification. Failing closed:', error)
    return null
  }

  return null
}

export async function getCurrentUser(req?: Request | NextRequest) {
  const auth = await getAuthenticatedUser(req)
  return auth?.user ?? null
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    const payload = await verifyJWT(token)
    if (payload?.sessionToken) {
      await prisma.session.deleteMany({
        where: { sessionToken: payload.sessionToken },
      }).catch(() => {})
    }
  }

  cookieStore.delete(COOKIE_NAME)
}
