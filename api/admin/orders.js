const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

function verifyAdmin(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return payload.role === 'admin';
  } catch { return false; }
}

module.exports = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !verifyAdmin(auth.replace('Bearer ', ''))) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  const { data: orders, error } = await supabaseAdmin
    .from('payment_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });

  res.json({ success: true, data: { orders: orders || [] } });
};
