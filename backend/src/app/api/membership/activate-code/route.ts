import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { success, error } from '@/lib/api-response'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return error('未登录', 401)

  try {
    const payload = verifyToken(authHeader.slice(7))
    const { code } = await request.json()

    if (!code) return error('请输入激活码')

    const activationCode = await prisma.activationCode.findUnique({ where: { code } })
    if (!activationCode) return error('激活码不存在')
    if (activationCode.status !== 'unused') return error('激活码已被使用')

    // 会员到期时间：从当前时间起1年
    const expireAt = new Date()
    expireAt.setFullYear(expireAt.getFullYear() + 1)

    await prisma.$transaction([
      prisma.activationCode.update({
        where: { id: activationCode.id },
        data: { status: 'used', usedBy: payload.userId, usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: payload.userId },
        data: { membership: 'vip', membershipExpireAt: expireAt },
      }),
    ])

    return success({ message: '激活成功，您已升级为 VIP 会员', membershipExpireAt: expireAt })
  } catch (e) {
    console.error('激活失败:', e)
    return error('激活失败', 500)
  }
}
