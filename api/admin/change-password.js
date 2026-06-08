const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

function verifyAdmin(auth) {
  try { return jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret'); }
  catch { return null; }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  const payload = verifyAdmin(auth);
  if (!payload) return res.status(401).json({ error: '未授权' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: '请填写当前密码和新密码' });
  if (newPassword.length < 6) return res.status(400).json({ error: '新密码至少6位' });

  const db = createClient(process.env.VITE_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'', {auth:{persistSession:false}});

  const { data: admin } = await db.from('admins').select('*').eq('id', payload.adminId).single();
  if (!admin) return res.status(404).json({ error: '管理员不存在' });

  const valid = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!valid) return res.status(400).json({ error: '当前密码错误' });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.from('admins').update({ password_hash: passwordHash, updated_at: new Date().toISOString() }).eq('id', admin.id);

  res.json({ success: true, message: '密码修改成功' });
};
