'use client'

import { api } from '@/utils/api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await api.post<{ token: string; admin: unknown }>('/admin/login', { username, password })
    if (!res.success) {
      setError(res.error || '登录失败')
      setLoading(false)
      return
    }

    localStorage.setItem('admin_token', res.data!.token)
    navigate('/admin/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Qwerty Learner 管理后台</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">管理员账号</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none" placeholder="请输入管理员账号" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none" placeholder="请输入密码" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 disabled:opacity-50">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLoginPage
