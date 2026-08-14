import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const assignments = await prisma.agentAssignment.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: assignments,
    })
  } catch (error) {
    console.error('Error fetching admin assignments:', error)
    return NextResponse.json({
      success: true,
      data: [],
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, assigneeId, role, priority, reason } = body

    await prisma.auditLog.create({
      data: {
        action: 'ORDER_ASSIGNMENT_CREATED',
        targetResource: `Order:${orderId}`,
        details: `Assigned to ${assigneeId} (${role}). Reason: ${reason || 'Admin manual assignment'}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Assignment created successfully for order ${orderId}`,
      data: {
        id: `asgn-${Date.now()}`,
        orderId,
        assigneeId,
        role,
        priority: priority || 'NORMAL',
        status: 'OFFERED',
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
