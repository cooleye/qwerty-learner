import { api } from '@/utils/api'
import { useEffect, useCallback, useRef, useState } from 'react'
import AdminLayout from './AdminLayout'

interface Code { id: string; code: string; batch: string; status: string; membership_type: string; duration_days: number; created_at: string }
interface Stats { total: number; unused: number; used: number; sold: number }
interface MType { code: string; name: string; prefix: string; duration_days: number }

const statusColors: Record<string, string> = { unused:'bg-green-100 text-green-700', sold:'bg-blue-100 text-blue-700', used:'bg-gray-100 text-gray-600', void:'bg-red-100 text-red-700' }
const statusLabels: Record<string, string> = { unused:'未使用', sold:'已售出', used:'已使用', void:'已作废' }
const PAGE_SIZE = 10

const CodesPage: React.FC = () => {
  const [codes, setCodes] = useState<Code[]>([]); const [stats, setStats] = useState<Stats>({ total:0, unused:0, used:0, sold:0 })
  const [loading, setLoading] = useState(true); const [types, setTypes] = useState<MType[]>([])
  const [showGenerate, setShowGenerate] = useState(false); const [gc, setGc] = useState(10); const [gt, setGt] = useState('yearly')
  const [ft, setFt] = useState(''); const [fs, setFs] = useState(''); const [fb, setFb] = useState('')
  const [ship, setShip] = useState<Code|null>(null); const [copied, setCopied] = useState('')
  const [page, setPage] = useState(1); const [tp, setTp] = useState(0); const [sel, setSel] = useState<Set<string>>(new Set())
  const token = localStorage.getItem('admin_token')
  const stale = useRef(false)

  const fetchCodes = useCallback(async (p?: number) => {
    setLoading(true); setSel(new Set())
    const params = new URLSearchParams({ page: String(p??page), pageSize: String(PAGE_SIZE) })
    if (ft) params.set('mtype', ft); if (fs) params.set('status', fs); if (fb) params.set('batch', fb)
    const res = await api.get<{ codes: Code[]; stats: Stats; totalPages: number }>(`/admin/codes?${params}`)
    if (res.success) { setCodes(res.data!.codes); setStats(res.data!.stats); setTp(res.data!.totalPages); stale.current = false }
    setLoading(false)
  }, [page, ft, fs, fb])

  useEffect(() => { fetchCodes(); api.get<MType[]>('/admin/membership-types').then(r => { if (r.success) setTypes(r.data||[]) }) }, [page])
  useEffect(() => { if (ft||fs||fb) setPage(1) }, [ft, fs, fb])

  // Lazy refetch when stale
  useEffect(() => { if (stale.current && !loading) fetchCodes() }, [loading])

  const updateCodeStatus = (id: string, status: string) => {
    setCodes(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    setStats(prev => {
      const old = codes.find(c => c.id === id)
      const dec = (s: string) => s === 'unused' ? 'unused' : s === 'sold' ? 'sold' : 'used'
      const inc = status
      return {
        ...prev,
        [old?.status === 'unused' ? 'unused' : old?.status === 'sold' ? 'sold' : 'used']: Math.max(0, prev[old?.status === 'unused' ? 'unused' : old?.status === 'sold' ? 'sold' : 'used'] - 1),
        [inc === 'unused' ? 'unused' : inc === 'sold' ? 'sold' : inc === 'used' ? 'used' : 'total']: (prev[inc === 'unused' ? 'unused' : inc === 'sold' ? 'sold' : 'total'] || 0) + 1,
      } as Stats
    })
  }

  const apiCall = async (id: string, action: string) => {
    updateCodeStatus(id, action === 'sold' ? 'sold' : 'void')
    const res = await fetch('/api/admin/codes', { method: 'PUT', headers: { 'Content-Type':'application/json', authorization:`Bearer ${token}` }, body: JSON.stringify({ id, action }) }).then(r => r.json())
    if (!res.success) { stale.current = true }
  }

  const batchSold = async () => {
    if (sel.size === 0) return
    const ids = [...sel]; let succ = 0
    ids.forEach(id => updateCodeStatus(id, 'sold'))
    for (const id of ids) {
      const r = await fetch('/api/admin/codes', { method: 'PUT', headers: { 'Content-Type':'application/json', authorization:`Bearer ${token}` }, body: JSON.stringify({ id, action:'sold' }) }).then(r => r.json())
      if (r.success) succ++
    }
    setSel(new Set())
    if (succ < ids.length) stale.current = true
  }

  const toggle = (id: string) => { setSel(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s }) }
  const toggleAll = () => { setSel(sel.size === codes.filter(c => c.status === 'unused').length ? new Set() : new Set(codes.filter(c => c.status === 'unused').map(c => c.id))) }
  const copy = (code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 2000) }

  const exp = () => {
    if (codes.length === 0) { alert('当前列表为空'); return }
    const text = codes.map(c => c.code).join('\n'); const blob = new Blob([text], { type:'text/plain' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `激活码-${new Date().toISOString().slice(0,10)}.txt`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">激活码管理</h1>
        <div className="flex gap-2">
          <button onClick={exp} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">📥 导出</button>
          <button onClick={() => setShowGenerate(true)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">+ 生成激活码</button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        {[{l:'总计',v:stats.total,c:'bg-blue-500'},{l:'未使用',v:stats.unused,c:'bg-green-500'},{l:'已售出',v:stats.sold,c:'bg-blue-500'},{l:'已使用',v:stats.used,c:'bg-gray-500'}].map(s => (
          <div key={s.l} className="rounded-lg bg-white p-4 shadow-sm">
            <div className={`mb-2 h-1.5 w-8 rounded ${s.c}`} /><div className="text-2xl font-bold">{s.v}</div><div className="text-sm text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-3">
        <select value={ft} onChange={e => setFt(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">全部类型</option>{types.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
        </select>
        <select value={fs} onChange={e => setFs(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">全部状态</option><option value="unused">未使用</option><option value="sold">已售出</option><option value="used">已使用</option><option value="void">已作废</option>
        </select>
        <input value={fb} onChange={e => setFb(e.target.value)} placeholder="批次搜索" className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1" />
        <button onClick={() => fetchCodes(1)} className="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700">搜索</button>
      </div>

      {sel.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-2 text-sm">
          <span className="font-medium text-blue-700">已选 {sel.size} 项</span>
          <button onClick={batchSold} className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700">批量标记已售</button>
          <button onClick={() => setSel(new Set())} className="text-gray-500 hover:text-gray-700">取消选择</button>
        </div>
      )}

      {loading ? <div className="text-gray-400">加载中...</div> : (
        <div className="rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead><tr className="border-b text-left text-sm text-gray-500">
              <th className="w-10 px-2 py-3"><input type="checkbox" checked={sel.size>0&&sel.size===codes.filter(c=>c.status==='unused').length} onChange={toggleAll} className="h-4 w-4" /></th>
              <th className="px-4 py-3">激活码</th><th className="px-4 py-3">会员类型</th><th className="px-4 py-3">批次</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">操作</th>
            </tr></thead>
            <tbody>
              {codes.length === 0 ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : codes.map(c => (
                <tr key={c.id} className="border-b text-sm hover:bg-gray-50">
                  <td className="px-2 py-3">{c.status === 'unused' && <input type="checkbox" checked={sel.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4" />}</td>
                  <td className="px-4 py-3 font-mono text-xs font-medium">{c.code}</td>
                  <td className="px-4 py-3">{types.find(t=>t.code===c.membership_type)?.name||c.membership_type}</td>
                  <td className="px-4 py-3 text-gray-500">{c.batch}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status]||''}`}>{statusLabels[c.status]||c.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => copy(c.code)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">{copied===c.code?'✅':'📋'}</button>
                      {c.status === 'unused' && <button onClick={() => apiCall(c.id, 'sold')} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100">标记已售</button>}
                      {(c.status === 'unused' || c.status === 'sold') && <button onClick={() => setShip(c)} className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100">📦发货</button>}
                      {(c.status === 'unused' || c.status === 'sold') && <button onClick={() => apiCall(c.id, 'void')} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100">作废</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tp > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50">上一页</button>
          <span className="px-4 py-2 text-sm text-gray-500">{page}/{tp}</span>
          <button disabled={page>=tp} onClick={() => setPage(p=>p+1)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50">下一页</button>
        </div>
      )}

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={()=>setShowGenerate(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e=>e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">生成激活码</h2>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-600">数量</label><input type="number" value={gc} onChange={e=>setGc(Number(e.target.value))} min={1} max={1000} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
              <div><label className="block text-sm text-gray-600">会员类型</label><select value={gt} onChange={e=>setGt(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2">{types.map(t=><option key={t.code} value={t.code}>{t.name}（{t.duration_days===36135?'终身':t.duration_days+'天'}）</option>)}</select></div>
              <div className="flex gap-2">
                <button onClick={()=>setShowGenerate(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={async()=>{const r=await api.post('/admin/codes',{count:gc,membershipType:gt});if(r.success){setShowGenerate(false);fetchCodes()}else alert(r.error||'生成失败')}} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">确认生成</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={()=>setShip(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e=>e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">📦 发货信息</h2>
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">激活码：</span><span className="font-mono text-base font-bold text-indigo-600">{ship.code}</span></p>
              <p><span className="font-medium">学习网址：</span>https://qwerty.listenup.top</p>
              <div className="rounded-lg bg-gray-50 p-3"><p className="font-medium">使用说明:</p><p className="mt-1 text-gray-600">手机、平板或者电脑浏览器输入上方网址，注册登录，然后使用激活码（上方那个卡号）激活即可。</p></div>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>setShip(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600">关闭</button>
                <button onClick={async()=>{
                  const text=`激活码：${ship.code}\n学习网址：https://qwerty.listenup.top\n使用说明：手机、平板或者电脑浏览器输入上方网址，注册登录，然后使用激活码（上方那个卡号）激活即可。`
                  navigator.clipboard.writeText(text)
                  if (ship.status === 'unused') { updateCodeStatus(ship.id, 'sold'); fetch('/api/admin/codes',{method:'PUT',headers:{'Content-Type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({id:ship.id,action:'sold'})}).then(r=>r.json()).then(r=>{if(!r.success)stale.current=true}) }
                  alert('已复制'); setShip(null)
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
