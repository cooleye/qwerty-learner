'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/admin', label: '📊 仪表盘', icon: '📊' },
  { href: '/admin/users', label: '👥 用户管理', icon: '👥' },
  { href: '/admin/orders', label: '📦 订单管理', icon: '📦' },
  { href: '/admin/codes', label: '🔑 激活码管理', icon: '🔑' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // 登录页不使用此布局
  if (pathname === '/admin/login') return <>{children}</>

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0'
    router.push('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 侧栏 */}
      <aside className="flex w-60 flex-col bg-white shadow-md">
        <div className="flex items-center gap-2 border-b px-6 py-5">
          <span className="text-xl font-bold text-indigo-600">QL Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="border-t px-4 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600"
          >
            🚪 退出登录
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
