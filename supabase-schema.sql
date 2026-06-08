-- ========================================
-- Qwerty Learner - Supabase 数据库表结构
-- 在 Supabase Dashboard → SQL Editor 执行
-- ========================================

-- 1. 用户扩展表（存储会员信息）
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  membership TEXT DEFAULT 'free' CHECK (membership IN ('free', 'vip')),
  membership_expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能看自己的 profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 用户只能更新自己的 profile（不能改 membership）
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 新用户注册时自动创建 profile
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, '用户'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- 2. 激活码表
CREATE TABLE public.activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  batch TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'sold')),
  source TEXT DEFAULT 'admin',
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有激活码，普通用户只能看自己的
CREATE POLICY "Admins can view all codes"
  ON public.activation_codes FOR SELECT
  USING (auth.role() = 'service_role' OR used_by = auth.uid());

-- 允许兑换（更新状态）
CREATE POLICY "Users can redeem codes"
  ON public.activation_codes FOR UPDATE
  USING (status = 'unused' AND used_by IS NULL)
  WITH CHECK (used_by = auth.uid() AND status = 'used');


-- 3. 支付订单表
CREATE TABLE public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  channel TEXT NOT NULL DEFAULT 'alipay',
  amount INTEGER NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  trade_no TEXT,
  activation_code_id UUID REFERENCES public.activation_codes(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.payment_orders FOR SELECT
  USING (auth.uid() = user_id);


-- 4. 激活码兑换函数（事务性：更新激活码状态 + 升级用户会员）
CREATE OR REPLACE FUNCTION public.redeem_activation_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_id UUID;
  v_user_id UUID;
  v_expire_at TIMESTAMPTZ;
BEGIN
  -- 获取当前用户 ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '未登录');
  END IF;

  -- 查找激活码
  SELECT id INTO v_code_id
  FROM public.activation_codes
  WHERE code = p_code AND status = 'unused'
  FOR UPDATE;

  IF v_code_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '激活码无效或已使用');
  END IF;

  -- 计算到期时间（从当前时间 + 1 年）
  v_expire_at := NOW() + INTERVAL '1 year';

  -- 更新激活码状态
  UPDATE public.activation_codes
  SET status = 'used', used_by = v_user_id, used_at = NOW()
  WHERE id = v_code_id;

  -- 更新用户会员
  UPDATE public.profiles
  SET membership = 'vip', membership_expire_at = v_expire_at, updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', '激活成功，您已升级为 VIP 会员',
    'membership_expire_at', v_expire_at
  );
END;
$$;


-- 5. 管理后台用表（管理员账号）
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 只有 service_role 可以访问 admins 表（通过 Edge Function）
