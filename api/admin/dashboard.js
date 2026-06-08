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

  try {
    const { count: totalUsers } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    const { count: vipUsers } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('membership', 'vip');
    const { count: totalOrders } = await supabaseAdmin.from('payment_orders').select('*', { count: 'exact', head: true });
    const { count: paidOrders } = await supabaseAdmin.from('payment_orders').select('*', { count: 'exact', head: true }).eq('status', 'paid');

    res.json({ success: true, data: { totalUsers: totalUsers || 0, vipUsers: vipUsers || 0, totalOrders: totalOrders || 0, paidOrders: paidOrders || 0 } });
  } catch (e) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
};
