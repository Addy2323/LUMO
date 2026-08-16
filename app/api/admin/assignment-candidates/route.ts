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

    let users: any[] = []
    try {
      users = await prisma.user.findMany({
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

      // Fallback: If no AGENT users exist, include SALES and ADMIN staff
      if (users.length === 0) {
        users = await prisma.user.findMany({
          where: { role: { in: ['SALES', 'ADMIN'] } },
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            role: true,
          },
          take: 15,
        })
      }
    } catch (err) {
      console.warn('PostgreSQL candidates query failed:', err)
    }

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
    console.error('Error fetching assignment candidates:', error)
    return NextResponse.json({
      success: true,
      data: [],
    })
  }
}
