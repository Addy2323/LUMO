import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { rejectAssignment } from '@/lib/assignments/assignment-service'

/**
 * POST /api/assignments/[id]/reject
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id } = await params

  let body: { reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const result = await rejectAssignment(id, auth.user.id, body.reason || 'No reason provided')
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
}
