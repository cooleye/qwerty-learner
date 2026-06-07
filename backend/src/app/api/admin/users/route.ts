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

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = 20
  const search = url.searchParams.get('search') || ''

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, phone: true, email: true, membership: true, status: true, createdAt: true, lastLoginAt: true },
    }),
    prisma.user.count({ where }),
  ])

  return success({ users, total, page, totalPages: Math.ceil(total / pageSize) })
}
