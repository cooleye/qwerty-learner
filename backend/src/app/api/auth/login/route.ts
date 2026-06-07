import { prisma } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { success, error } from '@/lib/api-response'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { account, password } = await request.json()

    if (!account || !password) {
      return error('账号和密码不能为空')
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(account.includes('@') ? [{ email: account }] : [{ phone: account }]),
        ],
      },
    })

    if (!user) {
      return error('账号或密码错误', 401)
    }

    if (user.status === 'disabled') {
      return error('账号已被禁用', 403)
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return error('账号或密码错误', 401)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const token = signToken({ userId: user.id, role: user.role })

    return success({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        membership: user.membership,
        membershipExpireAt: user.membershipExpireAt,
      },
    })
  } catch (e) {
    console.error('登录失败:', e)
    return error('登录失败', 500)
  }
}
