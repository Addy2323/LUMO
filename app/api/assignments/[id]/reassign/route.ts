import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { reassignAssignment } from '@/lib/assignments/assignment-service'
import { Role } from '@prisma/client'

/**
 * POST /api/assignments/[id]/reassign — Sales/Admin only
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req, ['SALES', 'ADMIN'] as Role[])
  if (!auth.authorized) return auth.response!

  const { id } = await params

  let body: { newAssigneeId?: string; newAssigneeOrganizationId?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.newAssigneeId && !body.newAssigneeOrganizationId) {
    return NextResponse.json({ error: 'newAssigneeId or newAssigneeOrganizationId required' }, { status: 400 })
  }

  try {
    const result = await reassignAssignment(
      id,
      auth.user.id,
      body.newAssigneeId,
      body.newAssigneeOrganizationId,
      body.reason
    )
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
}
