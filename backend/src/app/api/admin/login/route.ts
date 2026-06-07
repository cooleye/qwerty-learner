import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api-response'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) return error('账号和密码不能为空')

    const admin = await prisma.admin.findUnique({ where: { username } })
    if (!admin || !admin.isActive) return error('账号或密码错误', 401)

    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) return error('账号或密码错误', 401)

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    const token = jwt.sign({ adminId: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' })

    return success({ token, admin: { id: admin.id, username: admin.username, name: admin.name } })
  } catch (e) {
    console.error('管理员登录失败:', e)
    return error('登录失败', 500)
  }
}
