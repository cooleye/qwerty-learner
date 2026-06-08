import { userAtom, tokenAtom, isVipAtom } from '@/store/authAtom'
import { supabase } from '@/lib/supabase'
import { useAtom, useAtomValue } from 'jotai'
import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ProfilePage: React.FC = () => {
  const [user, setUser] = useAtom(userAtom)
  const [, setToken] = useAtom(tokenAtom)
  const isVip = useAtomValue(isVipAtom)
  const [activateCode, setActivateCode] = useState('')
  const [activateMsg, setActivateMsg] = useState('')
  const [activating, setActivating] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setToken(null)
    setUser(null)
    navigate('/')
  }

  const handleActivate = async () => {
    if (!activateCode.trim()) return
    setActivating(true)
    setActivateMsg('')

    const { data, error: rpcError } = await supabase.rpc('redeem_activation_code', {
      p_code: activateCode.trim(),
    })

    if (data?.success) {
      setActivateMsg(data.message || '激活成功')
      setUser((prev) => prev ? { ...prev, membership: 'vip', membershipExpireAt: data.membership_expire_at } : prev)
      setActivateCode('')
    } else {
      setActivateMsg(data?.error || rpcError?.message || '激活失败')
    }
    setActivating(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-800 dark:text-gray-100">个人中心</h1>

      {/* 用户信息卡片 */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
            {(user?.name || user?.email || user?.phone || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">{user?.name || '未设置昵称'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email || user?.phone}</div>
          </div>
        </div>

        {/* 会员信息 */}
        <div className={`rounded-xl p-4 ${isVip ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">会员状态</span>
              <div className="mt-1 flex items-center gap-2">
                {isVip ? (
                  <>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">VIP 会员</span>
                    {user?.membershipExpireAt && (
                      <span className="text-xs text-gray-400">到期 {new Date(user.membershipExpireAt).toLocaleDateString()}</span>
                    )}
                  </>
                ) : (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500 dark:bg-gray-600 dark:text-gray-400">免费用户</span>
                )}
              </div>
            </div>
            {!isVip && (
              <button
                onClick={() => navigate('/profile/membership')}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                升级会员
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 激活码兑换 */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">激活码兑换</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={activateCode}
            onChange={(e) => setActivateCode(e.target.value)}
            placeholder="请输入激活码"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            onClick={handleActivate}
            disabled={activating || !activateCode.trim()}
            className="rounded-lg bg-purple-600 px-6 py-2 text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {activating ? '兑换中...' : '兑换'}
          </button>
        </div>
        {activateMsg && (
          <p className={`mt-2 text-sm ${activateMsg.includes('成功') ? 'text-green-500' : 'text-red-500'}`}>{activateMsg}</p>
        )}
      </div>

      {/* 退出登录 */}
      <div className="text-center">
        <button onClick={handleLogout} className="text-sm text-gray-400 underline hover:text-red-500">
          退出登录
        </button>
      </div>
    </div>
  )
}

export default ProfilePage
