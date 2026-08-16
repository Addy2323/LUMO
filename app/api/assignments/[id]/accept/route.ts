import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { acceptAssignment, rejectAssignment, reassignAssignment } from '@/lib/assignments/assignment-service'

/**
 * POST /api/assignments/[id]/accept
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id } = await params

  try {
    const result = await acceptAssignment(id, auth.user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
}
