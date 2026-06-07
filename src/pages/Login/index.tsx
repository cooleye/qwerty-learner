import { userAtom, tokenAtom, type UserInfo } from '@/store/authAtom'
import { api } from '@/utils/api'
import { useSetAtom } from 'jotai'
import type React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setToken = useSetAtom(tokenAtom)
  const setUser = useSetAtom(userAtom)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await api.post<{ token: string; user: UserInfo }>('/auth/login', { account, password })
    if (!res.success) {
      setError(res.error || '登录失败')
      setLoading(false)
      return
    }

    setToken(res.data!.token)
    setUser(res.data!.user)
    navigate('/')
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-gray-100">登录</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">邮箱/手机号</label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="请输入邮箱或手机号"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="请输入密码"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          还没有账号？
          <Link to="/register" className="ml-1 text-indigo-600 hover:underline dark:text-indigo-400">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
