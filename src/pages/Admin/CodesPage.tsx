import { api } from '@/utils/api'
import { useEffect, useState } from 'react'

interface Code {
  id: string
  code: string
  batch: string
  status: string
  createdAt?: string
}

interface Stats {
  total: number
  unused: number
  used: number
  sold: number
}

const CodesPage: React.FC = () => {
  const [codes, setCodes] = useState<Code[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, unused: 0, used: 0, sold: 0 })
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generateCount, setGenerateCount] = useState(10)

  const fetchCodes = () => {
    api.get<{ codes: Code[]; stats: Stats }>('/admin/codes').then((res) => {
      if (res.success) {
        setCodes(res.data!.codes)
        setStats(res.data!.stats)
      }
      setLoading(false)
    })
  }

  useEffect(() => { fetchCodes() }, [])

  const handleGenerate = async () => {
    const res = await api.post('/admin/codes', { count: generateCount })
    if (res.success) {
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
        <button onClick={() => setShowGenerate(true)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
          + 生成激活码
        </button>
      </div>

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

      {loading ? (
        <div className="text-gray-400">加载中...</div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-4 py-3">激活码</th>
                <th className="px-4 py-3">批次</th>
                <th className="px-4 py-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : codes.map((code) => (
                <tr key={code.id} className="border-b text-sm hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium">{code.code}</td>
                  <td className="px-4 py-3 text-gray-500">{code.batch}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[code.status] || ''}`}>
                      {statusLabels[code.status] || code.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">生成激活码</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600">数量</label>
                <input type="number" value={generateCount} onChange={(e) => setGenerateCount(Number(e.target.value))} min={1} max={1000} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" />
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

export default CodesPage
