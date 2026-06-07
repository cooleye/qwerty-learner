import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456'

  const existing = await prisma.admin.findUnique({ where: { username: adminUsername } })
  if (existing) {
    console.log('管理员已存在，跳过种子数据')
    return
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12)
  await prisma.admin.create({
    data: {
      username: adminUsername,
      passwordHash,
      name: '管理员',
    },
  })

  console.log(`管理员账号创建成功: ${adminUsername}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
