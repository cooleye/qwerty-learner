import { api } from '@/utils/api'
import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'

interface Code { id: string; code: string; batch: string; status: string; membership_type: string; duration_days: number; created_at: string }
interface Stats { total: number; unused: number; used: number; sold: number }
interface MType { code: string; name: string; prefix: string; duration_days: number }

const statusColors: Record<string, string> = { unused: 'bg-green-100 text-green-700', sold: 'bg-blue-100 text-blue-700', used: 'bg-gray-100 text-gray-600', void: 'bg-red-100 text-red-700' }
const statusLabels: Record<string, string> = { unused: '未使用', sold: '已售出', used: '已使用', void: '已作废' }
const PAGE_SIZE = 10

const CodesPage: React.FC = () => {
  const [codes, setCodes] = useState<Code[]>([]); const [stats, setStats] = useState<Stats>({ total: 0, unused: 0, used: 0, sold: 0 })
  const [loading, setLoading] = useState(true); const [types, setTypes] = useState<MType[]>([])
  const [showGenerate, setShowGenerate] = useState(false); const [generateCount, setGenerateCount] = useState(10); const [generateType, setGenerateType] = useState('yearly')
  const [filterType, setFilterType] = useState(''); const [filterStatus, setFilterStatus] = useState(''); const [filterBatch, setFilterBatch] = useState('')
  const [shipCode, setShipCode] = useState<Code | null>(null); const [copied, setCopied] = useState('')
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const token = localStorage.getItem('admin_token')

  const fetchCodes = () => {
    setLoading(true); setSelectedIds(new Set())
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    if (filterType) params.set('mtype', filterType)
    if (filterStatus) params.set('status', filterStatus)
    if (filterBatch) params.set('batch', filterBatch)
    api.get<{ codes: Code[]; stats: Stats; totalPages: number }>(`/admin/codes?${params}`).then(res => {
      if (res.success) { setCodes(res.data!.codes); setStats(res.data!.stats); setTotalPages(res.data!.totalPages) }
      setLoading(false)
    })
  }

  useEffect(() => { fetchCodes(); api.get<MType[]>('/admin/membership-types').then(res => { if (res.success) setTypes(res.data || []) }) }, [page])
  useEffect(() => { setPage(1) }, [filterType, filterStatus, filterBatch])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  const toggleAll = () => {
    if (selectedIds.size === codes.filter(c => c.status === 'unused').length) { setSelectedIds(new Set()); return }
    setSelectedIds(new Set(codes.filter(c => c.status === 'unused').map(c => c.id)))
  }

  const batchSold = async () => {
    if (selectedIds.size === 0) return
    let success = 0
    for (const id of selectedIds) {
      const r = await fetch('/api/admin/codes', { method: 'PUT', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ id, action: 'sold' }) }).then(r => r.json())
      if (r.success) success++
    }
    alert(`批量标记完成：成功 ${success} 个`)
    fetchCodes()
  }

  const handleGenerate = async () => {
    const res = await api.post('/admin/codes', { count: generateCount, membershipType: generateType })
    if (res.success) { setShowGenerate(false); fetchCodes() } else alert(res.error || '生成失败')
  }

  const markSold = async (id: string, action = 'sold') => {
    const res = await fetch('/api/admin/codes', { method: 'PUT', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ id, action }) }).then(r => r.json())
    if (res.success) fetchCodes(); else alert(res.error || '操作失败')
  }

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 2000) }

  const exportCodes = () => {
    if (codes.length === 0) { alert('当前列表为空'); return }
    const text = codes.map(c => c.code).join('\n'); const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `激活码-${new Date().toISOString().slice(0, 10)}.txt`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">激活码管理</h1>
        <div className="flex gap-2">
          <button onClick={exportCodes} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">📥 导出</button>
          <button onClick={() => setShowGenerate(true)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">+ 生成激活码</button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: '总计', value: stats.total, color: 'bg-blue-500' }, { label: '未使用', value: stats.unused, color: 'bg-green-500' },
          { label: '已售出', value: stats.sold, color: 'bg-blue-500' }, { label: '已使用', value: stats.used, color: 'bg-gray-500' },
        ].map(s => (
          <div key={s.label} className="rounded-lg bg-white p-4 shadow-sm">
            <div className={`mb-2 h-1.5 w-8 rounded ${s.color}`} /><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-3">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">全部类型</option>{types.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">全部状态</option><option value="unused">未使用</option><option value="sold">已售出</option><option value="used">已使用</option><option value="void">已作废</option>
        </select>
        <input value={filterBatch} onChange={e => setFilterBatch(e.target.value)} placeholder="批次搜索" className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1" />
        <button onClick={() => { setPage(1); fetchCodes() }} className="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700">搜索</button>
      </div>

      {/* Batch actions */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-2 text-sm">
          <span className="font-medium text-blue-700">已选 {selectedIds.size} 项</span>
          <button onClick={batchSold} className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700">批量标记已售</button>
          <button onClick={() => setSelectedIds(new Set())} className="text-gray-500 hover:text-gray-700">取消选择</button>
        </div>
      )}

      {loading ? <div className="text-gray-400">加载中...</div> : (
        <div className="rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="w-10 px-2 py-3"><input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === codes.filter(c => c.status === 'unused').length} onChange={toggleAll} className="h-4 w-4" /></th>
                <th className="px-4 py-3">激活码</th><th className="px-4 py-3">会员类型</th><th className="px-4 py-3">批次</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : codes.map(code => (
                <tr key={code.id} className="border-b text-sm hover:bg-gray-50">
                  <td className="px-2 py-3">
                    {code.status === 'unused' && <input type="checkbox" checked={selectedIds.has(code.id)} onChange={() => toggleSelect(code.id)} className="h-4 w-4" />}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-medium">{code.code}</td>
                  <td className="px-4 py-3">{types.find(t => t.code === code.membership_type)?.name || code.membership_type}</td>
                  <td className="px-4 py-3 text-gray-500">{code.batch}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[code.status] || ''}`}>{statusLabels[code.status] || code.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => copyCode(code.code)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100" title="复制">{copied === code.code ? '✅' : '📋'}</button>
                      {code.status === 'unused' && <button onClick={() => markSold(code.id)} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100">标记已售</button>}
                      {(code.status === 'unused' || code.status === 'sold') ? <button onClick={() => setShipCode(code)} className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100">📦发货</button> : null}
                      {(code.status === 'unused' || code.status === 'sold') && <button onClick={() => markSold(code.id, 'void')} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100">作废</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50">上一页</button>
          <span className="px-4 py-2 text-sm text-gray-500">{page}/{totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50">下一页</button>
        </div>
      )}

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowGenerate(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">生成激活码</h2>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-600">数量</label><input type="number" value={generateCount} onChange={e => setGenerateCount(Number(e.target.value))} min={1} max={1000} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
              <div><label className="block text-sm text-gray-600">会员类型</label>
                <select value={generateType} onChange={e => setGenerateType(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2">
                  {types.map(t => <option key={t.code} value={t.code}>{t.name}（{t.duration_days === 36135 ? '终身' : t.duration_days + '天'}）</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowGenerate(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={handleGenerate} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">确认生成</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {shipCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShipCode(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">📦 发货信息</h2>
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">激活码：</span><span className="font-mono text-base font-bold text-indigo-600">{shipCode.code}</span></p>
              <p><span className="font-medium">学习网址：</span>https://qwerty.listenup.top</p>
              <div className="rounded-lg bg-gray-50 p-3"><p className="font-medium">使用说明:</p><p className="mt-1 text-gray-600">手机、平板或者电脑浏览器输入上方网址，注册登录，然后使用激活码（上方那个卡号）激活即可。</p></div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShipCode(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600">关闭</button>
                <button onClick={async () => {
                  const text = `激活码：${shipCode.code}\n学习网址：https://qwerty.listenup.top\n使用说明：手机、平板或者电脑浏览器输入上方网址，注册登录，然后使用激活码（上方那个卡号）激活即可。`
                  navigator.clipboard.writeText(text)
                  if (shipCode.status === 'unused') { await fetch('/api/admin/codes', { method: 'PUT', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ id: shipCode.id, action: 'sold' }) }) }
                  alert('已复制'); setShipCode(null); fetchCodes()
                }} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">复制信息</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
export default CodesPage
