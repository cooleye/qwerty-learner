import { api } from '@/utils/api'
import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'

interface DashboardData {
  totalUsers: number
  vipUsers: number
  totalOrders: number
  paidOrders: number
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
