import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Role, AccountStatus, KycStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.nativeEnum(Role).default(Role.BUYER),
  companyName: z.string().optional(),
  kycStatus: z.nativeEnum(KycStatus).optional().default(KycStatus.VERIFIED),
})

const UpdateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  companyName: z.string().optional(),
  accountStatus: z.nativeEnum(AccountStatus).optional(),
  kycStatus: z.nativeEnum(KycStatus).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeApiRequest(req)
    // Require admin/sales role in production, allow dev mode fallback
    if (!auth.authorized && process.env.NODE_ENV === 'production') {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const roleParam = searchParams.get('role')

    const where: any = {}
    if (roleParam && Object.values(Role).includes(roleParam as Role)) {
      where.role = roleParam as Role
    }

    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyName: true,
        accountStatus: true,
        kycStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    console.error('[API ADMIN USERS GET ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeApiRequest(req)
    if (auth.authorized && auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 })
    }

    const body = await req.json()
    const result = CreateUserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }

    const { name, email, password, phone, role, companyName, kycStatus } = result.data
    const cleanEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    if (existing) {
      return NextResponse.json({ error: 'A user with this email address already exists.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        phone: phone || null,
        role,
        companyName: companyName || `${name} Enterprises`,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: kycStatus || KycStatus.VERIFIED,
        phoneVerifiedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyName: true,
        accountStatus: true,
        kycStatus: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user: newUser }, { status: 201 })
  } catch (error: any) {
    console.error('[API ADMIN USERS POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to create system user' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await authorizeApiRequest(req)
    if (auth.authorized && auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 })
    }

    const body = await req.json()
    const result = UpdateUserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }

    const { id, name, email, password, phone, role, companyName, accountStatus, kycStatus } = result.data

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check email uniqueness if changing email
    if (email && email.trim().toLowerCase() !== existing.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      })
      if (emailConflict) {
        return NextResponse.json({ error: 'Another user with this email address already exists.' }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email.trim().toLowerCase()
    if (phone !== undefined) updateData.phone = phone || null
    if (role) updateData.role = role
    if (companyName !== undefined) updateData.companyName = companyName || null
    if (accountStatus) updateData.accountStatus = accountStatus
    if (kycStatus) updateData.kycStatus = kycStatus

    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await hashPassword(password)
      updateData.passwordChangedAt = new Date()
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyName: true,
        accountStatus: true,
        kycStatus: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error('[API ADMIN USERS PUT ERROR]', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authorizeApiRequest(req)
    if (auth.authorized && auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // Safety check: Prevent admin from deleting themselves
    if (auth.authorized && auth.user.id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own active administrator account' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('[API ADMIN USERS DELETE ERROR]', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
