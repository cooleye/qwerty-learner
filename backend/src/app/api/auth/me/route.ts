import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { success, error } from '@/lib/api-response'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return error('未登录', 401)
  }

  try {
    const payload = verifyToken(authHeader.slice(7))
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, phone: true, email: true, role: true, membership: true, membershipExpireAt: true, createdAt: true },
    })

    if (!user) return error('用户不存在', 404)

    return success({ user })
  } catch {
    return error('token 无效或已过期', 401)
  }
}
