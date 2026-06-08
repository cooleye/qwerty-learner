const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

function verifyAdmin(auth) {
  try { return jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret').role === 'admin'; }
  catch { return false; }
}
function sup() {
  return createClient(process.env.VITE_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'', {auth:{persistSession:false}});
}

module.exports = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !verifyAdmin(auth)) return res.status(401).json({error:'未授权'});
  const db = sup();

  try {
    if (req.method === 'GET') {
      const page = parseInt(req.query.page)||1, ps=20;
      const search = req.query.search||'';
      const userId = req.query.id;

      // Single user detail
      if (userId) {
        const {data:user} = await db.from('profiles').select('*').eq('id', userId).single();
        if (!user) return res.status(404).json({error:'用户不存在'});
        const {data:codes} = await db.from('activation_codes').select('*').eq('used_by', userId).order('created_at',{ascending:false});
        return res.json({success:true, data:{user, activationRecords:codes||[]}});
      }

      // List
      let query = db.from('profiles').select('*', {count:'exact'}).order('created_at',{ascending:false});
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      const {data, count, error} = await query.range((page-1)*ps, page*ps-1);
      if (error) return res.status(500).json({error:error.message});
      return res.json({success:true, data:{users:data||[], total:count||0, page, totalPages:Math.ceil((count||0)/ps)}});
    }

    if (req.method === 'PUT') {
      const { id, action } = req.body;
      if (!id||!action) return res.status(400).json({error:'缺少参数'});

      if (action === 'disable') {
        const {error} = await db.from('profiles').update({status:'disabled', membership:'free', updated_at:new Date().toISOString()}).eq('id',id);
        if (error) return res.status(500).json({error:error.message});
        return res.json({success:true, message:'已禁用'});
      }
      if (action === 'enable') {
        const {data:u} = await db.from('profiles').select('membership_expire_at').eq('id',id).single();
        const isVip = u?.membership_expire_at && new Date(u.membership_expire_at) > new Date();
        const {error} = await db.from('profiles').update({
          status:'active',
          membership: isVip ? 'vip' : 'free',
          updated_at:new Date().toISOString()
        }).eq('id',id);
        if (error) return res.status(500).json({error:error.message});
        return res.json({success:true, message:'已启用'});
      }

      return res.status(400).json({error:'未知操作'});
    }

    return res.status(405).json({error:'Method not allowed'});
  } catch(e) { return res.status(500).json({error:e.message}); }
};
