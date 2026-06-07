import { prisma } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { success, error } from '@/lib/api-response'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { phone, email, password, name } = await request.json()

    if (!password || password.length < 6) {
      return error('密码至少6位')
    }

    if (!phone && !email) {
      return error('手机号或邮箱至少填一个')
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    })

    if (existingUser) {
      if (phone && existingUser.phone === phone) return error('该手机号已注册')
      if (email && existingUser.email === email) return error('该邮箱已注册')
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        phone: phone || null,
        email: email || null,
        passwordHash,
        name: name || (phone ? phone.slice(-4) : email?.split('@')[0]) || '用户',
      },
    })

    const token = signToken({ userId: user.id, role: user.role })

    return success({ token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, membership: user.membership } }, 201)
  } catch (e) {
    console.error('注册失败:', e)
    return error('注册失败，请稍后重试', 500)
  }
}
