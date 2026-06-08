import { api } from '@/utils/api'
import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  membership: string
  created_at: string
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    api.get<{ users: User[] }>(`/admin/users${params}`).then((res) => {
      if (res.success) setUsers(res.data?.users || [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchUsers() }, [])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">用户管理</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户名/邮箱"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
        />
        <button onClick={fetchUsers} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">搜索</button>
      </div>
      <div className="rounded-xl bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">邮箱</th>
              <th className="px-4 py-3">会员</th>
              <th className="px-4 py-3">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="border-b text-sm hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.name || '-'}</td>
                <td className="px-4 py-3">{user.email || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.membership === 'vip' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.membership === 'vip' ? 'VIP' : '免费'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UsersPage
