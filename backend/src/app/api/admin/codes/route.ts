import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { success, error } from '@/lib/api-response'
import crypto from 'crypto'

function generateCode(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[crypto.randomInt(chars.length)]).join('')
}

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
  const status = url.searchParams.get('status') || ''

  const where = status ? { status } : {}

  const [codes, total] = await Promise.all([
    prisma.activationCode.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activationCode.count({ where }),
  ])

  const stats = {
    total: await prisma.activationCode.count(),
    unused: await prisma.activationCode.count({ where: { status: 'unused' } }),
    used: await prisma.activationCode.count({ where: { status: 'used' } }),
    sold: await prisma.activationCode.count({ where: { status: 'sold' } }),
  }

  return success({ codes, stats, page, totalPages: Math.ceil(total / pageSize) })
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return error('未授权', 401)

  try {
    const payload = verifyToken(authHeader.slice(7))
    if (payload.role !== 'admin') return error('无权限', 403)
  } catch {
    return error('token 无效', 401)
  }

  const { count, batch } = await request.json()
  const generateCount = Math.min(Math.max(parseInt(count) || 10, 1), 1000)
  const batchName = batch || `batch-${Date.now()}`
  const codeLength = 12

  const codes = Array.from({ length: generateCount }, () => ({
    code: generateCode(codeLength),
    batch: batchName,
    createdBy: 'admin',
  }))

  await prisma.activationCode.createMany({ data: codes })

  return success({ count: generateCount, batch: batchName, message: `成功生成 ${generateCount} 个激活码` }, 201)
}
