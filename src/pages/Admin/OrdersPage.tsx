import { api } from '@/utils/api'
import { useEffect, useState } from 'react'

interface Order {
  id: string
  order_id: string
  channel: string
  amount: number
  subject: string
  status: string
  created_at: string
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ orders: Order[] }>('/admin/orders').then((res) => {
      if (res.success) setOrders(res.data?.orders || [])
      setLoading(false)
    })
  }, [])

  const statusLabels: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' }
  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', paid: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', refunded: 'bg-gray-100 text-gray-600' }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">订单管理</h1>
      <div className="rounded-xl bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">订单号</th>
              <th className="px-4 py-3">金额</th>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">支付方式</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="border-b text-sm hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{order.order_id}</td>
                <td className="px-4 py-3 font-medium">¥{(order.amount / 100).toFixed(2)}</td>
                <td className="px-4 py-3">{order.subject}</td>
                <td className="px-4 py-3">{order.channel === 'alipay' ? '支付宝' : '微信支付'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || ''}`}>{statusLabels[order.status] || order.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OrdersPage
