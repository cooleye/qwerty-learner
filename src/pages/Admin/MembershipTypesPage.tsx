import { api } from '@/utils/api'
import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'

interface MembershipType {
  id: string
  name: string
  code: string
  prefix: string
  duration_days: number
  price: number | null
  sort_order: number
  is_active: boolean
}

const MembershipTypesPage: React.FC = () => {
  const [types, setTypes] = useState<MembershipType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MembershipType | null>(null)
  const [form, setForm] = useState({ name: '', code: '', prefix: '', duration_days: 365, price: 0, sort_order: 0 })

  const fetchTypes = () => {
    api.get<MembershipType[]>('/admin/membership-types').then((res) => {
      if (res.success) setTypes(res.data || [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchTypes() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', code: '', prefix: '', duration_days: 365, price: 0, sort_order: 0 }); setShowForm(true) }
  const openEdit = (t: MembershipType) => { setEditing(t); setForm({ name: t.name, code: t.code, prefix: t.prefix, duration_days: t.duration_days, price: t.price || 0, sort_order: t.sort_order }); setShowForm(true) }

  const handleSave = async () => {
    const res = editing
      ? await api.put('/admin/membership-types', { id: editing.id, ...form })
      : await api.post('/admin/membership-types', form)
    if (res.success) { setShowForm(false); setEditing(null); fetchTypes() }
    else alert(res.error || '操作失败')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return
    const res = await fetch(`/api/admin/membership-types?id=${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${localStorage.getItem('admin_token')}` } }).then(r => r.json())
    if (res.success) fetchTypes()
    else alert(res.error || '删除失败')
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">会员类型管理</h1>
        <button onClick={openNew} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">+ 新增</button>
      </div>

      {loading ? <div className="text-gray-400">加载中...</div> : (
        <div className="rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">标识码</th>
                <th className="px-4 py-3">前缀</th>
                <th className="px-4 py-3">有效期(天)</th>
                <th className="px-4 py-3">排序</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : types.map(t => (
                <tr key={t.id} className="border-b text-sm hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{t.code}</td>
                  <td className="px-4 py-3 font-mono">{t.prefix}</td>
                  <td className="px-4 py-3">{t.duration_days === 36135 ? '终身' : t.duration_days}</td>
                  <td className="px-4 py-3">{t.sort_order}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{t.is_active ? '启用' : '禁用'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(t)} className="mr-2 text-indigo-600 hover:underline">编辑</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:underline">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">{editing ? '编辑' : '新增'}会员类型</h2>
            <div className="space-y-3">
              {[
                { label: '名称', key: 'name', type: 'text', ph: '如：年度会员' },
                { label: '标识码', key: 'code', type: 'text', ph: '如：yearly' },
                { label: '前缀', key: 'prefix', type: 'text', ph: '如：YEAR' },
                { label: '有效天数（终身填36135）', key: 'duration_days', type: 'number' },
                { label: '排序', key: 'sort_order', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-600">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: ['duration_days','sort_order','price'].includes(f.key) ? Number(e.target.value) : e.target.value})}
                    placeholder={(f as any).ph} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={handleSave} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default MembershipTypesPage
