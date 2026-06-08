import { api } from '@/utils/api'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface DashboardData {
  totalUsers: number
  vipUsers: number
  totalOrders: number
  paidOrders: number
}

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="flex w-60 flex-col bg-white shadow-md">
        <div className="border-b px-6 py-5 text-xl font-bold text-indigo-600">QL Admin</div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {[
            { href: '/admin/dashboard', label: '📊 仪表盘' },
            { href: '/admin/users', label: '👥 用户管理' },
            { href: '/admin/orders', label: '📦 订单管理' },
            { href: '/admin/codes', label: '🔑 激活码管理' },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              {item.label}
            </button>
          ))}
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

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token')

  useEffect(() => {
    if (!token) return
    api.get<DashboardData>('/admin/dashboard').then((res) => {
      if (res.success) setData(res.data!)
      setLoading(false)
    })
  }, [token])

  if (!token) return null

  if (loading) return <AdminLayout><div className="text-gray-500">加载中...</div></AdminLayout>

  const cards = [
    { label: '总用户数', value: data?.totalUsers ?? 0, color: 'bg-blue-500' },
    { label: 'VIP 用户', value: data?.vipUsers ?? 0, color: 'bg-purple-500' },
    { label: '总订单数', value: data?.totalOrders ?? 0, color: 'bg-green-500' },
    { label: '已支付订单', value: data?.paidOrders ?? 0, color: 'bg-amber-500' },
  ]

  return (
    <AdminLayout>
      <h1 className="mb-8 text-2xl font-bold text-gray-800">仪表盘</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-6 shadow-sm">
            <div className={`mb-3 h-2 w-12 rounded ${card.color}`} />
            <div className="text-3xl font-bold text-gray-800">{card.value}</div>
            <div className="mt-1 text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}

export default DashboardPage
