-- ==========================================
-- 会员系统 V2 - 数据库迁移脚本
-- 在 Supabase Dashboard → SQL Editor 执行
-- ==========================================

-- 1. 创建会员类型表
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

ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;

-- 插入默认类型
INSERT INTO public.membership_types (name, code, prefix, duration_days, sort_order) VALUES
  ('月度会员', 'monthly', 'MON', 30, 1),
  ('年度会员', 'yearly', 'YEAR', 365, 2),
  ('终身会员', 'lifetime', 'LIFE', 36135, 3)
ON CONFLICT (code) DO NOTHING;

-- 2. activation_codes 追加字段
ALTER TABLE public.activation_codes ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'yearly';
ALTER TABLE public.activation_codes ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 365;

-- 3. profiles 追加 status 字段（active / disabled）
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 4. 重建激活码兑换函数（支持类型累加 + 终身 + 禁用检测）
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

  -- 检测用户状态
  SELECT status INTO v_user_status FROM public.profiles WHERE id = v_user_id;
  IF v_user_status = 'disabled' THEN
    RETURN jsonb_build_object('success', false, 'error', '账号已被禁用');
  END IF;

  -- 查找激活码（未使用和已售出均可被激活）
  SELECT id, membership_type, duration_days INTO v_code_id, v_membership_type, v_duration_days
  FROM public.activation_codes
  WHERE code = p_code AND status IN ('unused', 'sold')
  FOR UPDATE;

  IF v_code_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '激活码无效或已使用');
  END IF;

  -- 计算新到期时间
  SELECT membership_expire_at INTO v_current_expire FROM public.profiles WHERE id = v_user_id;

  IF v_membership_type = 'lifetime' THEN
    v_new_expire := NOW() + INTERVAL '99 years';
  ELSE
    v_new_expire := GREATEST(NOW(), COALESCE(v_current_expire, NOW())) + (v_duration_days || ' days')::INTERVAL;
  END IF;

  -- 更新激活码
  UPDATE public.activation_codes
  SET status = 'used', used_by = v_user_id, used_at = NOW()
  WHERE id = v_code_id;

  -- 更新用户
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

-- 5. profiles 追加 email 字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 6. 更新注册触发器，自动存储 email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, '用户'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 补全已有用户的 email
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
