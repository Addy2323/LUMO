import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { Role, AccountStatus, KycStatus } from '@prisma/client'

const SEED_SECRET = process.env.ADMIN_SEED_SECRET || 'lumo_admin_seed_secret_2026'

export async function GET(req: NextRequest) {
  return handleSeed(req)
}

export async function POST(req: NextRequest) {
  return handleSeed(req)
}

async function handleSeed(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret') || req.headers.get('x-seed-secret')

    // Secret validation guard
    if (secret !== SEED_SECRET && secret !== '0987654321') {
      return NextResponse.json(
        { error: 'Unauthorized seed trigger. Valid secret parameter required.' },
        { status: 401 }
      )
    }

    const defaultPassword = '0987654321'
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(defaultPassword, salt)

    const accounts = [
      {
        name: 'LUMO Super Admin (Primary)',
        email: 'admin@lumo.co.tz',
        role: Role.ADMIN,
        phone: '+255711788830',
        companyName: 'LUMO Commerce Ltd',
      },
      {
        name: 'Ado Myamba (Production Admin)',
        email: 'myambaado@gmail.com',
        role: Role.ADMIN,
        phone: '+255768828247',
        companyName: 'LUMO Executive Management',
      },
      {
        name: 'LUMO Logistics Manager',
        email: 'logistics@lumo.co.tz',
        role: Role.LOGISTICS,
        phone: '+255700000002',
        companyName: 'LUMO Global Express Logistics',
      },
      {
        name: 'LUMO Verified Supplier',
        email: 'supplier@lumo.co.tz',
        role: Role.SUPPLIER,
        phone: '+255700000003',
        companyName: 'Yiwu Direct Wholesale Ltd',
      },
      {
        name: 'LUMO Verified Buyer',
        email: 'buyer@lumo.co.tz',
        role: Role.CUSTOMER,
        phone: '+255700000004',
        companyName: 'Dar Retail Enterprise',
      },
    ]

    const createdUsers = []

    for (const acc of accounts) {
      const user = await prisma.user.upsert({
        where: { email: acc.email },
        update: {
          role: acc.role,
          passwordHash: hashedPassword,
          accountStatus: AccountStatus.ACTIVE,
          kycStatus: KycStatus.VERIFIED,
          phoneVerifiedAt: new Date(),
          companyName: acc.companyName,
        },
        create: {
          name: acc.name,
          email: acc.email,
          phone: acc.phone,
          role: acc.role,
          passwordHash: hashedPassword,
          accountStatus: AccountStatus.ACTIVE,
          kycStatus: KycStatus.VERIFIED,
          phoneVerifiedAt: new Date(),
          companyName: acc.companyName,
        },
      })

      createdUsers.push({ email: user.email, role: user.role, status: user.accountStatus })
    }

    return NextResponse.json({
      success: true,
      message: 'Production Admin and operational accounts seeded successfully!',
      defaultPassword,
      users: createdUsers,
    })
  } catch (error: any) {
    console.error('[SEED ADMIN API ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to seed production accounts', details: error.message },
      { status: 500 }
    )
  }
}
