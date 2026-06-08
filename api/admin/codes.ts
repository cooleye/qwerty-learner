import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  { auth: { persistSession: false } }
)

function verifyAdmin(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { role: string }
    return payload.role === 'admin'
  } catch { return false }
}

function generateCode(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization
  if (!auth || !verifyAdmin(auth.replace('Bearer ', ''))) {
    return res.status(401).json({ error: '未授权' })
  }

  if (req.method === 'GET') {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = 20
    const status = req.query.status as string || ''

    let query = supabaseAdmin.from('activation_codes').select('*', { count: 'exact' })
    if (status) query = query.eq('status', status)

    const { data: codes, count, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    // 统计
    const { count: total } = await supabaseAdmin.from('activation_codes').select('*', { count: 'exact', head: true })
    const { count: unused } = await supabaseAdmin.from('activation_codes').select('*', { count: 'exact', head: true }).eq('status', 'unused')
    const { count: used } = await supabaseAdmin.from('activation_codes').select('*', { count: 'exact', head: true }).eq('status', 'used')
    const { count: sold } = await supabaseAdmin.from('activation_codes').select('*', { count: 'exact', head: true }).eq('status', 'sold')

    if (error) return res.status(500).json({ error: error.message })

    return res.json({
      success: true,
      data: {
        codes: codes || [],
        stats: { total: total || 0, unused: unused || 0, used: used || 0, sold: sold || 0 },
        page,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  }

  if (req.method === 'POST') {
    const { count, batch } = req.body
    const generateCount = Math.min(Math.max(parseInt(count) || 10, 1), 1000)
    const batchName = batch || `batch-${Date.now()}`

    const codes = Array.from({ length: generateCount }, () => ({
      code: generateCode(),
      batch: batchName,
      created_by: 'admin',
    }))

    const { error } = await supabaseAdmin.from('activation_codes').insert(codes)
    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({ success: true, data: { count: generateCount, batch: batchName } })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
