import { NextResponse } from 'next/server'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const roleParam = (searchParams.get('role') || 'SALES').toUpperCase()

  try {
    let targetRole: Role = Role.SALES
    if (roleParam.includes('AGENT')) targetRole = Role.AGENT
    else if (roleParam.includes('SUPPLIER')) targetRole = Role.SUPPLIER
    else if (roleParam.includes('LOGISTIC')) targetRole = Role.LOGISTICS
    else if (roleParam.includes('SALE')) targetRole = Role.SALES

    // Query DB strictly for users matching targetRole
    const users = await prisma.user.findMany({
      where: { role: targetRole },
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
        role: true,
      },
      take: 15,
    })

    // Compute workload metrics strictly for matching DB users
    const candidates = await Promise.all(
      users.map(async (u) => {
        let activeAssignments = 0
        try {
          activeAssignments = await prisma.orderAssignment.count({
            where: {
              assigneeId: u.id,
              status: { in: ['OFFERED', 'ACCEPTED', 'IN_PROGRESS'] },
            },
          })
        } catch {
          activeAssignments = 0
        }

        const maxCap = 25
        const pct = Math.min(Math.round((activeAssignments / maxCap) * 100), 100)
        let capacityStatus = 'Good'
        if (pct > 75) capacityStatus = 'High'
        else if (pct > 50) capacityStatus = 'Busy'

        return {
          id: u.id,
          name: u.name || u.companyName || u.email.split('@')[0],
          email: u.email,
          role: u.role,
          workloadCount: activeAssignments,
          maxCapacity: maxCap,
          capacityStatus,
          percentage: pct,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: candidates,
    })
  } catch (error) {
    console.error('Error fetching real assignment candidates:', error)
    return NextResponse.json({
      success: false,
      data: [],
    })
  }
}
