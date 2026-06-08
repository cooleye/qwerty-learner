const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

function verifyAdmin(auth) {
  try { return jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret').role === 'admin'; }
  catch { return false; }
}
function sup() {
  return createClient(process.env.VITE_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||'', {auth:{persistSession:false}});
}

function generateCode(prefix, length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return prefix + '-' + Array.from({length}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
}

module.exports = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !verifyAdmin(auth)) return res.status(401).json({error:'未授权'});
  const db = sup();

  try {
    if (req.method === 'GET') {
      const page = parseInt(req.query.page)||1, ps=20;
      const q = { mtype: req.query.mtype||'', status: req.query.status||'', batch: req.query.batch||'' };

      let query = db.from('activation_codes').select('*', {count:'exact'}).order('created_at',{ascending:false});
      if (q.mtype) query = query.eq('membership_type', q.mtype);
      if (q.status) query = query.eq('status', q.status);
      if (q.batch) query = query.ilike('batch', `%${q.batch}%`);

      const {data,count,error} = await query.range((page-1)*ps, page*ps-1);
      if (error) return res.status(500).json({error:error.message});

      const {count:total}=await db.from('activation_codes').select('*',{count:'exact',head:true});
      const {count:unused}=await db.from('activation_codes').select('*',{count:'exact',head:true}).eq('status','unused');
      const {count:used}=await db.from('activation_codes').select('*',{count:'exact',head:true}).eq('status','used');
      const {count:sold}=await db.from('activation_codes').select('*',{count:'exact',head:true}).eq('status','sold');

      return res.json({success:true, data:{codes:data||[], stats:{total:total||0,unused:unused||0,used:used||0,sold:sold||0}, page, totalPages:Math.ceil((count||0)/ps)}});
    }

    if (req.method === 'POST') {
      const { count, batch, membershipType } = req.body;
      const gc = Math.min(Math.max(parseInt(count)||10,1),1000);
      const bn = batch||`batch-${Date.now()}`;

      // Get membership type info
      const {data:mt} = await db().from('membership_types').select('*').eq('code', membershipType||'yearly').single();
      if (!mt) return res.status(400).json({error:'会员类型不存在'});

      const codes = Array.from({length:gc}, ()=>({
        code: generateCode(mt.prefix),
        batch: bn,
        membership_type: mt.code,
        duration_days: mt.duration_days,
        created_by: 'admin',
      }));

      const {error} = await db.from('activation_codes').insert(codes);
      if (error) return res.status(500).json({error:error.message});
      return res.status(201).json({success:true, data:{count:gc, batch:bn, membershipType:mt.code}});
    }

    if (req.method === 'PUT') {
      const { id, action } = req.body;
      if (!id || !action) return res.status(400).json({error:'缺少参数'});

      if (action === 'sold') {
        const {error} = await db.from('activation_codes').update({status:'sold'}).eq('id',id).eq('status','unused');
        if (error) return res.status(500).json({error:error.message});
        return res.json({success:true, message:'已标记为已售出'});
      }

      return res.status(400).json({error:'未知操作'});
    }

    return res.status(405).json({error:'Method not allowed'});
  } catch(e) { return res.status(500).json({error:e.message}); }
};
