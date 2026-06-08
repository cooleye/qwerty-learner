const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

function verifyAdmin(auth) {
  try { return jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret').role === 'admin'; }
  catch { return false; }
}

module.exports = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !verifyAdmin(auth)) return res.status(401).json({ success: false, error: '未授权' });

  const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'', {auth:{persistSession:false}});

  const page = parseInt(req.query.page)||1, ps = parseInt(req.query.pageSize)||10;

  const { data: orders, count, error } = await supabaseAdmin
    .from('payment_orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page-1)*ps, page*ps-1);

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data: { orders: orders||[], total: count||0, page, totalPages: Math.ceil((count||0)/ps) } });
};
