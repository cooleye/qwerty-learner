import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { href: '/admin/dashboard', label: '📊 仪表盘' },
  { href: '/admin/users', label: '👥 用户管理' },
  { href: '/admin/orders', label: '📦 订单管理' },
  { href: '/admin/membership-types', label: '📋 会员类型' },
  { href: '/admin/codes', label: '🔑 激活码管理' },
]

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="flex w-60 flex-col bg-white shadow-md">
        <div className="border-b px-6 py-5 text-xl font-bold text-indigo-600">QL Admin</div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="border-t px-4 py-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600">
            🚪 退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}

export default AdminLayout
