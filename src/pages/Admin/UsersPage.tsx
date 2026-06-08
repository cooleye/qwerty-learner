import { api } from '@/utils/api'
import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'

interface User {
  id: string; name: string | null; phone: string | null; email: string | null
  membership: string; membership_expire_at: string | null; status: string; created_at: string
}
interface CodeRecord { code: string; membership_type: string; duration_days: number; status: string; created_at: string }

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState(''); const [detailUser, setDetailUser] = useState<User | null>(null)
  const [detailCodes, setDetailCodes] = useState<CodeRecord[]>([])
  const token = localStorage.getItem('admin_token')

  const fetchUsers = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '10', ...(search ? { search } : {}) })
    api.get<{ users: User[]; totalPages: number }>(`/admin/users?${params}`).then(res => {
      if (res.success) { setUsers(res.data!.users); setTotalPages(res.data!.totalPages) }
      setLoading(false)
    })
  }

  useEffect(() => { fetchUsers() }, [page])

  const toggleUser = async (id: string, action: 'disable' | 'enable') => {
    const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ id, action }) }).then(r => r.json())
    if (res.success) fetchUsers()
    else alert(res.error || '操作失败')
  }

  const showDetail = async (user: User) => {
    setDetailUser(user)
    const res = await api.get<{ user: User; activationRecords: CodeRecord[] }>(`/admin/users?id=${user.id}`)
    if (res.success) setDetailCodes(res.data?.activationRecords || [])
    else setDetailCodes([])
  }

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">用户管理</h1>
      <div className="mb-4 flex gap-2">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户名/邮箱/手机号" className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none" onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
        <button onClick={fetchUsers} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">搜索</button>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">邮箱</th>
              <th className="px-4 py-3">会员</th>
              <th className="px-4 py-3">到期时间</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">注册时间</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b text-sm hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name || '-'}</td>
                <td className="px-4 py-3">{u.email || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.membership === 'vip' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.membership === 'vip' ? 'VIP' : '免费'}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{u.membership_expire_at ? new Date(u.membership_expire_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status === 'active' ? '正常' : '禁用'}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => showDetail(u)} className="mr-2 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">详情</button>
                  {u.status === 'active' ? (
                    <button onClick={() => toggleUser(u.id, 'disable')} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">禁用</button>
                  ) : (
                    <button onClick={() => toggleUser(u.id, 'enable')} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50">启用</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50">上一页</button>
          <span className="px-4 py-2 text-sm text-gray-500">{page}/{totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50">下一页</button>
        </div>
      )}

      {/* Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDetailUser(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">用户详情</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">姓名：</span>{detailUser.name || '-'}</p>
              <p><span className="text-gray-500">邮箱：</span>{detailUser.email || '-'}</p>
              <p><span className="text-gray-500">手机：</span>{detailUser.phone || '-'}</p>
              <p><span className="text-gray-500">会员：</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${detailUser.membership === 'vip' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{detailUser.membership === 'vip' ? 'VIP' : '免费'}</span></p>
              <p><span className="text-gray-500">到期时间：</span>{detailUser.membership_expire_at ? new Date(detailUser.membership_expire_at).toLocaleDateString() : '-'}</p>
              <p><span className="text-gray-500">状态：</span>{detailUser.status === 'active' ? '正常' : '禁用'}</p>
            </div>
            {detailCodes.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-700">激活记录</h3>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {detailCodes.map(c => (
                    <div key={c.code} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-xs">
                      <span className="font-mono">{c.code}</span>
                      <span className="text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setDetailUser(null)} className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">关闭</button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default UsersPage
