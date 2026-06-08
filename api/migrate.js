// ONE-TIME migration script - run via curl then DELETE this file
const { createClient } = require('@supabase/supabase-js');

const SQL = `
-- 1. Create membership_types table
CREATE TABLE IF NOT EXISTS public.membership_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  prefix TEXT UNIQUE NOT NULL,
  duration_days INTEGER NOT NULL,
  price INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default types
INSERT INTO public.membership_types (name, code, prefix, duration_days, sort_order) VALUES
  ('月度会员', 'monthly', 'MON', 30, 1),
  ('年度会员', 'yearly', 'YEAR', 365, 2),
  ('终身会员', 'lifetime', 'LIFE', 36135, 3)
ON CONFLICT (code) DO NOTHING;

-- 2. Add columns to activation_codes
ALTER TABLE public.activation_codes ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'yearly';
ALTER TABLE public.activation_codes ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 365;

-- 3. Add status column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 4. Drop and recreate redeem_activation_code function
CREATE OR REPLACE FUNCTION public.redeem_activation_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_code_id UUID;
  v_user_id UUID;
  v_membership_type TEXT;
  v_duration_days INTEGER;
  v_current_expire TIMESTAMPTZ;
  v_new_expire TIMESTAMPTZ;
  v_user_status TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '未登录');
  END IF;

  -- Check user status
  SELECT status INTO v_user_status FROM public.profiles WHERE id = v_user_id;
  IF v_user_status = 'disabled' THEN
    RETURN jsonb_build_object('success', false, 'error', '账号已被禁用');
  END IF;

  -- Find activation code
  SELECT id, membership_type, duration_days INTO v_code_id, v_membership_type, v_duration_days
  FROM public.activation_codes
  WHERE code = p_code AND status IN ('unused', 'sold')
  FOR UPDATE;

  IF v_code_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '激活码无效或已使用');
  END IF;

  -- Calculate new expire time
  SELECT membership_expire_at INTO v_current_expire FROM public.profiles WHERE id = v_user_id;

  IF v_membership_type = 'lifetime' THEN
    v_new_expire := NOW() + INTERVAL '99 years';
  ELSE
    v_new_expire := GREATEST(NOW(), COALESCE(v_current_expire, NOW())) + (v_duration_days || ' days')::INTERVAL;
  END IF;

  -- Update activation code
  UPDATE public.activation_codes
  SET status = 'used', used_by = v_user_id, used_at = NOW()
  WHERE id = v_code_id;

  -- Update user profile
  UPDATE public.profiles
  SET membership = 'vip', membership_expire_at = v_new_expire, updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN v_membership_type = 'lifetime' THEN '激活成功，您已成为终身会员！' ELSE '激活成功，您已升级为 VIP 会员' END,
    'membership_expire_at', v_new_expire,
    'membership_type', v_membership_type
  );
END;
$func$;
`;

module.exports = async (req, res) => {
  if (req.query.secret !== (process.env.JWT_SECRET || '')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Execute the SQL via the REST API
    const { error } = await supabase.rpc('exec_sql', { sql: SQL });
    
    if (error && error.message?.includes('function "exec_sql"')) {
      // exec_sql doesn't exist, try direct approach
      // Use Supabase Management API
      const mgmtRes = await fetch(
        `https://api.supabase.com/v1/projects/jprcrpntvotchncmvxbm/sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ query: SQL }),
        }
      );

      const result = await mgmtRes.text();
      return res.json({ success: true, result: result?.substring(0, 200) });
    }

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Migration completed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
