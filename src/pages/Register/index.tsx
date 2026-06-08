import { userAtom, tokenAtom, type UserInfo } from '@/store/authAtom'
import { supabase } from '@/lib/supabase'
import { useSetAtom } from 'jotai'
import type React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registerType, setRegisterType] = useState<'email' | 'phone'>('email')
  const setToken = useSetAtom(tokenAtom)
  const setUser = useSetAtom(userAtom)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: authError } = registerType === 'email'
      ? await supabase.auth.signUp({ email, password, options: { data: { name } } })
      : await supabase.auth.signUp({ phone, password, options: { data: { name } } })

    // 注册成功（有 user 就说明注册成功了）
    if (data?.user) {
      if (data.session) {
        // 自动确认模式 → 直接登录
        setToken(data.session.access_token)
        setUser({
          id: data.user.id,
          name: name || data.user.email?.split('@')[0] || '用户',
          phone: data.user.phone || null,
          email: data.user.email || null,
          membership: 'free',
        })
        navigate('/')
        return
      }
      // 邮箱确认模式 → 提示检查邮箱
      alert('注册成功！请检查您的邮箱完成验证后再登录。')
      navigate('/login')
      return
    }

    // 用户已存在
    if (authError?.message?.includes('already')) {
      setError('该账号已注册，请直接登录')
      setLoading(false)
      return
    }

    // 真正的错误
    setError(authError?.message || '注册失败')
    setLoading(false)
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-gray-100">注册</h2>

        <div className="mb-6 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
          <button
            type="button"
            onClick={() => setRegisterType('email')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              registerType === 'email' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-600 dark:text-indigo-400' : 'text-gray-500'
            }`}
          >
            邮箱注册
          </button>
          <button
            type="button"
            onClick={() => setRegisterType('phone')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              registerType === 'phone' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-600 dark:text-indigo-400' : 'text-gray-500'
            }`}
          >
            手机号注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {registerType === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">邮箱</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="请输入邮箱" required />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">手机号</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="请输入手机号" required />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">昵称（选填）</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="给自己取个名字" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="至少6位密码" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-white transition hover:bg-indigo-700 disabled:opacity-50">
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          已有账号？
          <Link to="/login" className="ml-1 text-indigo-600 hover:underline dark:text-indigo-400">立即登录</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
