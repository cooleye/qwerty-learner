'use client'

import { useEffect, useState } from 'react'

interface Order {
  id: string
  orderId: string
  userId: string | null
  channel: string
  amount: number
  subject: string
  status: string
  paidAt: string | null
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchOrders = () => {
    setLoading(true)
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)admin_token\s*=\s*([^;]*).*$)|^.*$/, '$1')
    const params = new URLSearchParams({ page: String(page), ...(status ? { status } : {}) })
    fetch(`/api/admin/orders?${params}`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setOrders(res.data.orders)
          setTotalPages(res.data.totalPages)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [page, status])

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
  }

  const statusLabels: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    failed: '失败',
    refunded: '已退款',
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">订单管理</h1>
      <div className="mb-4 flex gap-2">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">全部状态</option>
          <option value="pending">待支付</option>
          <option value="paid">已支付</option>
          <option value="failed">失败</option>
          <option value="refunded">已退款</option>
        </select>
      </div>

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
                <td className="px-4 py-3 font-mono text-xs">{order.orderId}</td>
                <td className="px-4 py-3 font-medium">¥{(order.amount / 100).toFixed(2)}</td>
                <td className="px-4 py-3">{order.subject}</td>
                <td className="px-4 py-3">{order.channel === 'alipay' ? '支付宝' : '微信支付'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50">上一页</button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50">下一页</button>
        </div>
      )}
    </div>
  )
}
