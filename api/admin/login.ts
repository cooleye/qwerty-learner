import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  { auth: { persistSession: false } }
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: '请输入账号和密码' })

  const { data: admin, error } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !admin) return res.status(401).json({ error: '账号或密码错误' })
  if (!admin.is_active) return res.status(403).json({ error: '账号已被禁用' })

  const valid = await bcrypt.compare(password, admin.password_hash)
  if (!valid) return res.status(401).json({ error: '账号或密码错误' })

  await supabaseAdmin.from('admins').update({ last_login_at: new Date().toISOString() }).eq('id', admin.id)

  const token = jwt.sign({ adminId: admin.id, role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' })

  res.json({ success: true, data: { token, admin: { id: admin.id, username: admin.username, name: admin.name } } })
}
