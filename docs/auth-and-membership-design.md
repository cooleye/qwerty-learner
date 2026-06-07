# Qwerty Learner 注册登录与会员系统设计文档

## 一、概述

### 1.1 项目背景
Qwerty Learner 是一个基于 Vite + React + TypeScript 的静态 SPA 应用（键盘工作者单词记忆与肌肉记忆锻炼工具）。目前所有词典内容免费访问，无用户系统。

### 1.2 本次目标
1. 增加**用户注册登录系统**（手机号 / 邮箱）
2. 区分**免费课程**和**付费课程**，付费课程需要登录/会员权限
3. 增加**个人中心页面**，支持升级会员（付费 / 激活码）
4. 增加**后台管理端**（仪表盘、用户管理、订单管理、激活码管理）
5. 使用 **Docker 部署**到阿里云服务器，与 `english-learning-app` 共存互不影响

---

## 二、技术架构

### 2.1 技术栈选择

| 模块 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | React 18 + TypeScript | 沿用当前项目技术栈 |
| 构建工具 | Vite | 沿用当前配置 |
| 后端框架 | Next.js 14 (App Router) | 参考 english-learning-app，输出 standalone |
| 数据库 | PostgreSQL 16 | 与 english-learning-app 共用同一 PostgreSQL 实例，但使用不同的 database |
| 缓存 | Redis 7 | 与 english-learning-app 共用同一 Redis 实例，使用不同的 db index |
| ORM | Prisma | 参考 english-learning-app |
| JWT | jsonwebtoken | 用户认证 |
| 验证码 | svg-captcha + nodemailer + SMS | 图形验证码 + 邮箱验证码 |
| 支付 | 支付宝/微信支付 | 参考 english-learning-app 的 payment 模块 |
| 部署 | Docker + Docker Compose | 独立项目，独立容器命名前缀 |

### 2.2 与 english-learning-app 的隔离方案

| 资源 | english-learning-app | qwerty-learner 新系统 | 隔离方式 |
|------|--------------------|---------------------|---------|
| PostgreSQL | database: `english_learning_app` | database: `qwerty_learner` | 不同 database |
| Redis | 默认 db 0 | db 1 | 不同 db index |
| Docker 容器 | 前缀 `english-learning-` | 前缀 `qwerty-learner-` | 不同容器名 |
| Docker 网络 | `app-network` | 新建 `ql-network`（不共用） | 不同 Docker 网络 |
| Nginx 端口 | 80/443 | 80/443（通过不同域名区分） | 共用一个 nginx，location 分流 |

### 2.3 域名规划

假设服务器已有 nginx 反代 `english-learning-app（listenup.top）`，新增配置：

```nginx
# 原有 english-learning-app 配置
server_name listenup.top;

# qwerty-learner 的 API 和后端管理
# 通过 /admin 路径前缀区分
# 或者使用子域名 qwerty.listenup.top（推荐，更清晰）
```

**推荐方案**：使用子域名区分
- 用户端：`qwerty.listenup.top`（当前 Vercel 部署的前端）
- 后端 API 及管理端：`api-qwerty.listenup.top`（Docker 部署的 Next.js）

---

## 三、数据库设计

### 3.1 数据库划分

```sql
-- 在现有的 PostgreSQL 实例上新建 database
CREATE DATABASE qwerty_learner;
```

### 3.2 数据模型 (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===== 用户表 =====
model User {
  id                 String   @id @default(uuid())
  phone              String?  @unique
  email              String?  @unique
  passwordHash       String
  name               String?
  avatarUrl          String?
  role               String   @default("user")     // user | admin
  status             String   @default("active")    // active | disabled
  membership         String   @default("free")      // free | vip
  membershipExpireAt DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  lastLoginAt        DateTime?

  activationCode     ActivationCode? @relation(fields: [activationCodeId], references: [id])
  activationCodeId   String?
  paymentOrders      PaymentOrder[]

  @@map("users")
}

// ===== 管理员表 =====
model Admin {
  id           String   @id @default(uuid())
  username     String   @unique
  passwordHash String
  name         String?
  email        String?
  role         String   @default("admin")
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("admins")
}

// ===== 激活码表 =====
model ActivationCode {
  id         String   @id @default(uuid())
  code       String   @unique
  batch      String
  status     String   @default("unused")  // unused | used | sold
  source     String   @default("admin")   // admin | payment
  usedBy     String?
  usedAt     DateTime?
  createdBy  String?
  createdAt  DateTime @default(now())

  user       User?    @relation(fields: [usedBy], references: [id])
  paymentOrder PaymentOrder?

  @@index([status])
  @@index([batch])
  @@index([code])
  @@map("activation_codes")
}

// ===== 支付订单表 =====
model PaymentOrder {
  id               String    @id @default(uuid())
  orderId          String    @unique
  userId           String?
  channel          String    // alipay | wechat
  amount           Int
  subject          String
  status           String    @default("pending")  // pending | paid | failed | refunded
  tradeNo          String?
  activationCodeId String?   @unique
  paidAt           DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  user             User?     @relation(fields: [userId], references: [id])
  activationCode   ActivationCode? @relation(fields: [activationCodeId], references: [id])

  @@index([orderId])
  @@index([status])
  @@index([channel])
  @@index([userId])
  @@map("payment_orders")
}

// ===== 系统配置表 =====
model SystemConfig {
  id    String @id @default(uuid())
  key   String @unique
  value String @db.Text
  updatedAt DateTime @updatedAt

  @@map("system_configs")
}
```

---

## 四、前端功能设计 (React SPA)

### 4.1 页面路由结构

```bash
# 现有路由（保持不变）
/                        # 首页（主练习页）
/gallery                 # 词库列表
/analysis                # 学习分析
/error-book              # 错词本
/friend-links            # 友链
/mobile                  # 移动端

# 新增路由
/login                   # 登录页
/register                # 注册页
/profile                 # 个人中心（需要登录）
/profile/membership      # 会员升级页面
```

### 4.2 首页注册/登录按钮

在 Header 右侧（当前 nav 区域），增加两个按钮：

```
[Qwerty Learner Logo]                              [登录] [注册] [头像·个人中心]
```

- 未登录：显示「登录」「注册」按钮
- 已登录：显示用户头像下拉菜单（个人中心 | 退出）

### 4.3 课程付费标记

**免费课程**：当前所有词库，无需登录即可访问

**付费课程**：在 `dictionary.ts` 索引中增加 `isPaid` 字段标记：

```ts
{
  id: "premium-vocabulary",
  name: "高级商务英语",
  description: "BEC 高级商务英语词库",
  category: "英语学习",
  url: "/dicts/bec-premium.json",
  length: 3000,
  language: "en",
  isPaid: true,          // ← 新增字段，标记为付费
}
```

**显示效果**：
- 付费课程在词库卡片右上角显示「VIP」角标（金色/Badge）
- 用户点击付费课程时：
  - 未登录 → 弹出提示"该课程需要登录后查看"，提供「去登录」按钮
  - 已登录但非会员 → 弹出提示"该课程需要会员权限"，提供「升级会员」按钮
  - 已登录且是会员 → 正常打开

### 4.4 注册/登录

**注册支持**：
- 邮箱注册：输入邮箱 → 获取验证码 → 设置密码 → 注册
- 手机号注册：输入手机号 → 获取短信验证码 → 设置密码 → 注册
- 两种方式可切换（Tab 切换）

**登录支持**：
- 邮箱/手机号 + 密码登录
- 登录成功后跳转回原页面

### 4.5 个人中心

| 功能 | 说明 |
|------|------|
| 个人资料 | 头像、昵称、绑定手机/邮箱 |
| 会员状态 | 显示当前会员等级、到期时间 |
| 升级会员 | 跳转会员升级页面 |
| 激活码兑换 | 输入框 + "兑换"按钮 |

### 4.6 会员升级页面

- 展示会员价格方案（如：月卡 ¥29.9、季卡 ¥79.9、年卡 ¥199.9）
- 选择方案 → 选择支付方式（支付宝/微信）→ 生成支付二维码/跳转
- 激活码兑换输入框

---

## 五、后端 API 设计 (Next.js App Router)

### 5.1 目录结构

```bash
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts              # 初始化管理员账号
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts     # POST 注册
│   │   │   │   ├── login/route.ts        # POST 登录
│   │   │   │   ├── logout/route.ts       # POST 退出
│   │   │   │   ├── send-code/route.ts    # POST 发送验证码
│   │   │   │   └── me/route.ts           # GET 获取当前用户
│   │   │   ├── user/
│   │   │   │   └── profile/route.ts      # PUT 更新个人信息
│   │   │   ├── membership/
│   │   │   │   ├── activate-code/route.ts # POST 激活码兑换
│   │   │   │   └── plans/route.ts        # GET 会员方案列表
│   │   │   ├── payment/
│   │   │   │   ├── create/route.ts       # POST 创建订单
│   │   │   │   └── notify/route.ts       # POST 支付回调
│   │   │   ├── captcha/route.ts          # GET 图形验证码
│   │   │   └── admin/
│   │   │       ├── login/route.ts        # POST 管理员登录
│   │   │       ├── dashboard/route.ts    # GET 仪表盘数据
│   │   │       ├── users/route.ts        # GET 用户列表
│   │   │       ├── orders/route.ts       # GET 订单列表
│   │   │       ├── codes/route.ts        # GET/POST 激活码管理
│   │   │       └── stats/route.ts        # GET 统计数据
│   │   ├── admin/
│   │   │   ├── login/page.tsx            # 管理员登录页
│   │   │   ├── layout.tsx                # 后台布局（侧栏菜单）
│   │   │   ├── page.tsx                  # 仪表盘
│   │   │   ├── users/page.tsx            # 用户管理
│   │   │   ├── orders/page.tsx           # 订单管理
│   │   │   └── codes/page.tsx           # 激活码管理
│   │   └── layout.tsx
│   ├── middleware.ts                     # 路由保护（admin 路径检查 token）
│   └── lib/
│       ├── db.ts                         # Prisma 客户端
│       ├── jwt.ts                        # JWT 工具函数
│       ├── email.ts                      # 邮件发送
│       ├── sms.ts                        # 短信发送
│       ├── payment.ts                    # 支付集成
│       ├── captcha.ts                    # 图形验证码
│       └── api-response.ts              # API 响应封装
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

### 5.2 API 接口列表

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | 否 |
| POST | /api/auth/login | 用户登录 | 否 |
| POST | /api/auth/send-code | 发送验证码 | 否 |
| GET | /api/auth/me | 获取当前用户 | JWT |
| PUT | /api/user/profile | 更新个人资料 | JWT |
| POST | /api/membership/activate-code | 激活码兑换 | JWT |
| GET | /api/membership/plans | 会员方案 | 否 |
| POST | /api/payment/create | 创建支付订单 | JWT |
| POST | /api/payment/notify | 支付回调 | 否(签名验证) |
| GET | /api/captcha | 图形验证码 | 否 |
| POST | /api/admin/login | 管理员登录 | 否 |
| GET | /api/admin/dashboard | 仪表盘数据 | Admin |
| GET | /api/admin/users | 用户列表 | Admin |
| GET | /api/admin/orders | 订单列表 | Admin |
| GET/POST | /api/admin/codes | 激活码管理 | Admin |

### 5.3 后端管理页面

管理端基于 Next.js 的服务端渲染 + 客户端组件实现：

**布局**：
```
┌─────────────────────────────────────┐
│  Logo                 用户名 ▼      │
├──────────┬──────────────────────────┤
│  📊 仪表盘  │                        │
│  👥 用户管理  │     主内容区域          │
│  📦 订单管理  │                        │
│  🔑 激活码管理 │                        │
│            │                        │
└──────────┴──────────────────────────┘
```

**仪表盘**：总用户数、付费用户数、今日订单、总订单数、日活跃趋势图

**用户管理**：用户列表（搜索、分页）、禁用/启用、查看详情

**订单管理**：订单列表（筛选状态、支付方式）、查看详情

**激活码管理**：
- 查看所有激活码（分页、搜索、状态筛选）
- 批量生成激活码（数量、批次名称）
- 标记已售（线下售出）
- 查看统计（总数、已用、未用、已售）

---

## 六、部署方案 (Docker)

### 6.1 目录结构

```bash
# 在服务器上新建
/opt/qwerty-learner/
├── backend/
│   ├── Dockerfile
│   ├── docker-compose.yml        # 仅 qwerty-learner 的服务
│   ├── .env
│   └── ssl/                      # SSL 证书
│       ├── listenup.top.pem
│       └── listenup.top.key
├── nginx/
│   └── conf.d/
│       ├── english-learning.conf  # 已有的 english-learning-app 配置
│       └── qwerty-learner.conf   # 新增的 qwerty-learner 配置
```

### 6.2 docker-compose.yml

```yaml
services:
  # ===== qwerty-learner 后端 =====
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: qwerty-learner-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/qwerty_learner?schema=public
      - REDIS_URL=redis://redis:6379/1
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - PAYMENT_NOTIFY_URL=${PAYMENT_NOTIFY_URL}
      - PAYMENT_SANDBOX=${PAYMENT_SANDBOX:-false}
      - ALIPAY_APP_ID=${ALIPAY_APP_ID}
      - ALIPAY_PRIVATE_KEY=${ALIPAY_PRIVATE_KEY}
      - ALIPAY_PUBLIC_KEY=${ALIPAY_PUBLIC_KEY}
      - WECHAT_APP_ID=${WECHAT_APP_ID}
      - WECHAT_MCH_ID=${WECHAT_MCH_ID}
      - WECHAT_API_KEY_V3=${WECHAT_API_KEY_V3}
      - WECHAT_PRIVATE_KEY=${WECHAT_PRIVATE_KEY}
      - WECHAT_SERIAL_NO=${WECHAT_SERIAL_NO}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT:-465}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - ALIBABA_CLOUD_ACCESS_KEY_ID=${ALIBABA_CLOUD_ACCESS_KEY_ID}
      - ALIBABA_CLOUD_ACCESS_KEY_SECRET=${ALIBABA_CLOUD_ACCESS_KEY_SECRET}
      - SMS_SIGN_NAME=${SMS_SIGN_NAME}
      - SMS_TEMPLATE_CODE=${SMS_TEMPLATE_CODE}
    depends_on:
      - postgres
      - redis
    networks:
      - ql-network

  # ===== PostgreSQL (复用 english-learning-app 的实例？或独立部署) =====
  # 注意：如果 english-learning-app 已有 postgres，可以在同一个实例上创建 qwerty_learner database
  # 但为了完全隔离，建议独立部署 postgres
  postgres:
    image: postgres:16-alpine
    container_name: qwerty-learner-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-qwerty2026}
      - POSTGRES_DB=qwerty_learner
    volumes:
      - ql-postgres-data:/var/lib/postgresql/data
    networks:
      - ql-network

  redis:
    image: redis:7-alpine
    container_name: qwerty-learner-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    networks:
      - ql-network

  # ===== Nginx 反向代理 =====
  # 方案 A：独立 nginx（与 english-learning-app 共享同一个 nginx，通过不同 server_name 分流）
  # 方案 B：共用已有 nginx，在已有配置中增加 location
  # 推荐方案 B —— 在 /opt/qwerty-learner/nginx/ 下准备 conf 文件，挂载到 english-learning-app 的 nginx 容器

networks:
  ql-network:
    driver: bridge

volumes:
  ql-postgres-data:
```

### 6.3 Nginx 配置

```nginx
# /opt/qwerty-learner/nginx/conf.d/qwerty-learner.conf

# === qwerty-learner API 和管理端 ===
server {
    listen 80;
    server_name api-qwerty.listenup.top;

    # HTTP → HTTPS 重定向
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api-qwerty.listenup.top;

    ssl_certificate /etc/nginx/ssl/listenup.top.pem;
    ssl_certificate_key /etc/nginx/ssl/listenup.top.key;

    location / {
        proxy_pass http://qwerty-learner-backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 600s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 600s;
    }
}
```

### 6.4 与 Vercel 的协作

- **用户前端页面**（首页/练习/词库等）继续使用 **Vercel** 部署（`qwerty.listenup.top`）
- **后端 API 和管理端**用 Docker 部署到阿里云（`api-qwerty.listenup.top`）
- Vercel 前端通过 `/api/*` 路径代理到阿里云后端（在 Vercel 项目设置中配置 Rewrite Rules）

---

## 七、开发计划

### 第一阶段：后端基础
1. 初始化 Next.js 项目 + Prisma + 数据库
2. 实现用户注册/登录 API
3. 实现管理员登录 + JWT 中间件
4. 搭建管理后台页面框架（布局、侧栏、路由）

### 第二阶段：会员与支付
1. 实现会员方案配置
2. 实现激活码生成/兑换 API
3. 对接支付宝/微信支付
4. 管理端用户/订单/激活码管理页面

### 第三阶段：前端集成
1. 前端增加登录/注册页面
2. 前端增加个人中心页面
3. 词库增加付费标记和角标
4. 付费课程权限校验

### 第四阶段：部署
1. 编写 Dockerfile + docker-compose.yml
2. 配置 Nginx 反向代理
3. 配置 SSL 证书
4. 服务器部署测试
5. Vercel 代理配置

---

## 八、注意事项

### 8.1 与 english-learning-app 的隔离要点
- 所有容器名称以 `qwerty-learner-` 为前缀
- 使用独立 Docker 网络 `ql-network`
- PostgreSQL 使用不同 database（`qwerty_learner`）
- Redis 使用不同 db index（db 1）
- 不要修改 `english-learning-app` 的任何配置文件

### 8.2 安全要点
- 密码使用 bcrypt 哈希存储
- JWT token 设置合理过期时间
- API 添加速率限制（rate limit）
- 管理端路由需要 middleware 保护
- 支付回调需验证签名

### 8.3 参考文件
- `../english-learning-app/docker-compose.yml` — Docker 编排参考
- `../english-learning-app/Dockerfile` — Next.js Docker 构建参考
- `../english-learning-app/nginx.conf` — Nginx 反向代理配置
- `../english-learning-app/prisma/schema.prisma` — 数据库模型参考
- `../english-learning-app/src/middleware.ts` — 管理端路由保护参考
- `../english-learning-app/.env.example` — 环境变量配置参考
