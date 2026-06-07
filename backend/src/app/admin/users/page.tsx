'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  membership: string
  status: string
  createdAt: string
  lastLoginAt: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = () => {
    setLoading(true)
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)admin_token\s*=\s*([^;]*).*$)|^.*$/, '$1')
    const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) })
    fetch(`/api/admin/users?${params}`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUsers(res.data.users)
          setTotalPages(res.data.totalPages)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">用户管理</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户名/手机号/邮箱"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
        />
        <button onClick={fetchUsers} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
          搜索
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">手机号</th>
              <th className="px-4 py-3">邮箱</th>
              <th className="px-4 py-3">会员</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="border-b text-sm hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.name || '-'}</td>
                <td className="px-4 py-3">{user.phone || '-'}</td>
                <td className="px-4 py-3">{user.email || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.membership === 'vip' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.membership === 'vip' ? 'VIP' : '免费'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.status === 'active' ? '正常' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
