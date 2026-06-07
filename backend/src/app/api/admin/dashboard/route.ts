import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { success, error } from '@/lib/api-response'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return error('未授权', 401)

  try {
    const payload = verifyToken(authHeader.slice(7))
    if (payload.role !== 'admin') return error('无权限', 403)
  } catch {
    return error('token 无效', 401)
  }

  const [totalUsers, vipUsers, totalOrders, paidOrders] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { membership: 'vip' } }),
    prisma.paymentOrder.count(),
    prisma.paymentOrder.count({ where: { status: 'paid' } }),
  ])

  return success({
    totalUsers,
    vipUsers,
    totalOrders,
    paidOrders,
  })
}
