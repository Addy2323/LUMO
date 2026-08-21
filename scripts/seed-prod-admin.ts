import { PrismaClient, Role, AccountStatus, KycStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

async function main() {
  console.log('🚀 Seeding Production Accounts (Admin, Buyer, Supplier, Logistics)...')

  const defaultPassword = '0987654321'
  const hashedPassword = await hashPassword(defaultPassword)

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

    console.log(`✅ Seeded ${acc.role} account: ${user.email} (Password: ${defaultPassword})`)
  }

  console.log('🎉 Production account seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding production admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
