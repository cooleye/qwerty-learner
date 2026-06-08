const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseAdmin = () => createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

function verifyAdmin(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return payload.role === 'admin';
  } catch { return false; }
}

function generateCode(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !verifyAdmin(auth.replace('Bearer ', ''))) {
    return res.status(401).json({ error: '未授权' });
  }

  const db = supabaseAdmin();

  try {
    if (req.method === 'GET') {
      const page = parseInt(req.query.page) || 1;
      const pageSize = 20;
      const status = req.query.status || '';

      let query = db.from('activation_codes').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);

      const { data: codes, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) return res.status(500).json({ error: error.message });

      const { count: total } = await db.from('activation_codes').select('*', { count: 'exact', head: true });
      const { count: unused } = await db.from('activation_codes').select('*', { count: 'exact', head: true }).eq('status', 'unused');
      const { count: used } = await db.from('activation_codes').select('*', { count: 'exact', head: true }).eq('status', 'used');
      const { count: sold } = await db.from('activation_codes').select('*', { count: 'exact', head: true }).eq('status', 'sold');

      return res.json({
        success: true,
        data: {
          codes: codes || [],
          stats: { total: total || 0, unused: unused || 0, used: used || 0, sold: sold || 0 },
          page,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      });
    }

    if (req.method === 'POST') {
      const { count, batch } = req.body;
      const generateCount = Math.min(Math.max(parseInt(count) || 10, 1), 1000);
      const batchName = batch || `batch-${Date.now()}`;

      const codes = Array.from({ length: generateCount }, () => ({
        code: generateCode(),
        batch: batchName,
        created_by: 'admin',
      }));

      const { error } = await db.from('activation_codes').insert(codes);
      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json({ success: true, data: { count: generateCount, batch: batchName } });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: '服务器错误: ' + e.message });
  }
};
