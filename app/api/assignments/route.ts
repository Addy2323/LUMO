import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/db'
import { offerAssignment } from '@/lib/assignments/assignment-service'
import { Role, AssignmentRole } from '@prisma/client'

/**
 * GET /api/assignments — returns assignments filtered by the user's active role and organization
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user, activeRole } = auth
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit

  const where: any = {}

  // Role and Organization scoped tenant filtering
  switch (activeRole) {
    case 'SALES':
      where.OR = [
        { assignmentRole: 'SALES', assigneeId: user.id },
        { assignedById: user.id },
      ]
      break
    case 'AGENT':
      where.assignmentRole = 'AGENT'
      where.assigneeId = user.id
      break
    case 'SUPPLIER': {
      where.assignmentRole = 'SUPPLIER'
      // Strictly scope to user's active organization memberships
      const orgMemberships = await prisma.organizationMember.findMany({
        where: { userId: user.id, isActive: true },
        select: { organizationId: true },
      })
      const orgIds = orgMemberships.map((m) => m.organizationId)
      where.OR = [
        { assigneeId: user.id },
        { assigneeOrganizationId: { in: orgIds } },
      ]
      break
    }
    case 'LOGISTICS': {
      where.assignmentRole = 'LOGISTICS'
      // Strictly scope to user's active logistics organization memberships
      const logOrgMemberships = await prisma.organizationMember.findMany({
        where: { userId: user.id, isActive: true },
        select: { organizationId: true },
      })
      const logOrgIds = logOrgMemberships.map((m) => m.organizationId)
      where.OR = [
        { assigneeId: user.id },
        { assigneeOrganizationId: { in: logOrgIds } },
      ]
      break
    }
    case 'ADMIN':
      // Admin sees all assignments
      break
    default:
      return NextResponse.json({ error: 'Role cannot view assignments' }, { status: 403 })
  }

  if (status) {
    where.status = status.toUpperCase()
  }

  const [assignments, total] = await Promise.all([
    prisma.orderAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        events: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    }),
    prisma.orderAssignment.count({ where }),
  ])

  return NextResponse.json({
    assignments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

/**
 * POST /api/assignments — create/offer a new assignment (Sales/Admin only) with idempotency
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req, ['SALES', 'ADMIN'] as Role[])
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const idempotencyHeader = req.headers.get('x-idempotency-key') || undefined

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { orderId, sourcingRequestId, assignmentRole, assigneeId, assigneeOrganizationId, priority, reason, instructions, idempotencyKey } = body

  if (!orderId || !assignmentRole) {
    return NextResponse.json({ error: 'orderId and assignmentRole are required' }, { status: 400 })
  }

  if (!Object.values(AssignmentRole).includes(assignmentRole)) {
    return NextResponse.json({ error: `Invalid assignmentRole: ${assignmentRole}` }, { status: 400 })
  }

  try {
    const result = await offerAssignment({
      orderId,
      sourcingRequestId,
      assignmentRole,
      assigneeId,
      assigneeOrganizationId,
      assignedById: user.id,
      priority,
      reason,
      instructions,
      idempotencyKey: idempotencyHeader || idempotencyKey,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json(result, { status: result.idempotentDuplicate ? 200 : 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
}
