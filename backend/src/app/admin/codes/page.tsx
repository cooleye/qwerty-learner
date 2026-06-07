'use client'

import { useEffect, useState } from 'react'

interface Code {
  id: string
  code: string
  batch: string
  status: string
  source: string
  usedBy: string | null
  createdAt: string
}

interface Stats {
  total: number
  unused: number
  used: number
  sold: number
}

export default function CodesPage() {
  const [codes, setCodes] = useState<Code[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, unused: 0, used: 0, sold: 0 })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generateCount, setGenerateCount] = useState(10)
  const [generateBatch, setGenerateBatch] = useState('')

  const token = () => document.cookie.replace(/(?:(?:^|.*;\s*)admin_token\s*=\s*([^;]*).*$)|^.*$/, '$1')

  const fetchCodes = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), ...(status ? { status } : {}) })
    fetch(`/api/admin/codes?${params}`, { headers: { authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setCodes(res.data.codes)
          setStats(res.data.stats)
          setTotalPages(res.data.totalPages)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCodes() }, [page, status])

  const handleGenerate = async () => {
    const res = await fetch('/api/admin/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token()}` },
      body: JSON.stringify({ count: generateCount, batch: generateBatch || undefined }),
    })
    const data = await res.json()
    if (data.success) {
      setShowGenerate(false)
      fetchCodes()
    }
  }

  const statusColors: Record<string, string> = {
    unused: 'bg-green-100 text-green-700',
    used: 'bg-gray-100 text-gray-600',
    sold: 'bg-blue-100 text-blue-700',
  }

  const statusLabels: Record<string, string> = {
    unused: '未使用',
    used: '已使用',
    sold: '已售',
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">激活码管理</h1>
        <button
          onClick={() => setShowGenerate(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          + 生成激活码
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: '总计', value: stats.total, color: 'bg-blue-500' },
          { label: '未使用', value: stats.unused, color: 'bg-green-500' },
          { label: '已使用', value: stats.used, color: 'bg-gray-500' },
          { label: '已售', value: stats.sold, color: 'bg-blue-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-white p-4 shadow-sm">
            <div className={`mb-2 h-1.5 w-8 rounded ${s.color}`} />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div className="mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-lg border border-gray-300 px-4 py-2">
          <option value="">全部</option>
          <option value="unused">未使用</option>
          <option value="used">已使用</option>
          <option value="sold">已售</option>
        </select>
      </div>

      {/* 列表 */}
      <div className="rounded-xl bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">激活码</th>
              <th className="px-4 py-3">批次</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">来源</th>
              <th className="px-4 py-3">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : codes.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : codes.map((code) => (
              <tr key={code.id} className="border-b text-sm hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium">{code.code}</td>
                <td className="px-4 py-3 text-gray-500">{code.batch}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[code.status]}`}>
                    {statusLabels[code.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{code.source === 'payment' ? '支付' : '管理端'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(code.createdAt).toLocaleDateString()}</td>
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

      {/* 生成激活码弹窗 */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">生成激活码</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600">数量</label>
                <input type="number" value={generateCount} onChange={(e) => setGenerateCount(Number(e.target.value))} min={1} max={1000} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600">批次名称（可选）</label>
                <input type="text" value={generateBatch} onChange={(e) => setGenerateBatch(e.target.value)} placeholder="如：2024年第一批" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowGenerate(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={handleGenerate} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">确认生成</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
