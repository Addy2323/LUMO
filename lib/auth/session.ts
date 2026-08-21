import { NextRequest } from 'next/server'
import { getAuthenticatedUser, getCurrentUser } from './server'

export async function getSessionUser(req?: Request | NextRequest) {
  const nextReq = req instanceof NextRequest ? req : undefined
  const auth = await getAuthenticatedUser(nextReq)
  return auth?.user ?? null
}
