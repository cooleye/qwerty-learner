import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
)

function verifyAdmin(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { role: string }
    return payload.role === 'admin'
  } catch { return false }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization
  if (!auth || !verifyAdmin(auth.replace('Bearer ', ''))) {
    return res.status(401).json({ error: '未授权' })
  }

  const { count: totalUsers } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true })
  const { count: vipUsers } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('membership', 'vip')
  const { count: totalOrders } = await supabaseAdmin.from('payment_orders').select('*', { count: 'exact', head: true })
  const { count: paidOrders } = await supabaseAdmin.from('payment_orders').select('*', { count: 'exact', head: true }).eq('status', 'paid')

  res.json({ success: true, data: { totalUsers: totalUsers || 0, vipUsers: vipUsers || 0, totalOrders: totalOrders || 0, paidOrders: paidOrders || 0 } })
}
