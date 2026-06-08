const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

function verifyAdmin(token) {
  try { return jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret').role === 'admin'; }
  catch { return false; }
}

function db() {
  return createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );
}

module.exports = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !verifyAdmin(auth)) return res.status(401).json({ error: '未授权' });

  try {
    // GET - list all
    if (req.method === 'GET') {
      const { data, error } = await db().from('membership_types').select('*').order('sort_order', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, data: data || [] });
    }

    // POST - create
    if (req.method === 'POST') {
      const { name, code, prefix, duration_days, price, sort_order } = req.body;
      if (!name || !code || !prefix || !duration_days) return res.status(400).json({ error: '缺少必填字段' });
      const { data, error } = await db().from('membership_types').insert({ name, code, prefix, duration_days, price, sort_order }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ success: true, data });
    }

    // PUT - update
    if (req.method === 'PUT') {
      const { id, name, code, prefix, duration_days, price, sort_order, is_active } = req.body;
      if (!id) return res.status(400).json({ error: '缺少 id' });
      const { data, error } = await db().from('membership_types').update({ name, code, prefix, duration_days, price, sort_order, is_active, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, data });
    }

    // DELETE
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: '缺少 id' });
      // Check if type is in use
      const { count } = await db().from('activation_codes').select('*', { count: 'exact', head: true }).eq('membership_type', id);
      if (count && count > 0) return res.status(400).json({ error: '该会员类型已被使用，无法删除' });
      const { error } = await db().from('membership_types').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
