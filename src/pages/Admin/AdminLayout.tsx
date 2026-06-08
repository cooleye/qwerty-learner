import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { href: '/admin/dashboard', label: '📊 仪表盘' },
  { href: '/admin/users', label: '👥 用户管理' },
  { href: '/admin/orders', label: '📦 订单管理' },
  { href: '/admin/membership-types', label: '📋 会员类型' },
  { href: '/admin/codes', label: '🔑 激活码管理' },
]

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [cpwd, setCpwd] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  const handleChangePwd = async () => {
    if (cpwd.newPwd.length < 6) { setPwdMsg('新密码至少6位'); return }
    if (cpwd.newPwd !== cpwd.confirm) { setPwdMsg('两次密码不一致'); return }
    setPwdLoading(true); setPwdMsg('')
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: cpwd.current, newPassword: cpwd.newPwd }),
    }).then(r => r.json())
    if (res.success) { setPwdMsg('✅ 密码修改成功'); setTimeout(() => setShowChangePwd(false), 1500) }
    else setPwdMsg(res.error || '修改失败')
    setPwdLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="flex w-60 flex-col bg-white shadow-md">
        <div className="border-b px-6 py-5 text-xl font-bold text-indigo-600">QL Admin</div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="border-t px-4 py-3 space-y-1">
          <button onClick={() => { setCpwd({ current: '', newPwd: '', confirm: '' }); setPwdMsg(''); setShowChangePwd(true) }}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600">
            🔑 修改密码
          </button>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600">
            🚪 退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>

      {showChangePwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowChangePwd(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">修改密码</h2>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-600">当前密码</label><input type="password" value={cpwd.current} onChange={e => setCpwd({...cpwd, current: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
              <div><label className="block text-sm text-gray-600">新密码</label><input type="password" value={cpwd.newPwd} onChange={e => setCpwd({...cpwd, newPwd: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
              <div><label className="block text-sm text-gray-600">确认新密码</label><input type="password" value={cpwd.confirm} onChange={e => setCpwd({...cpwd, confirm: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
              {pwdMsg && <p className={`text-sm ${pwdMsg.includes('✅') ? 'text-green-500' : 'text-red-500'}`}>{pwdMsg}</p>}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowChangePwd(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={handleChangePwd} disabled={pwdLoading} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{pwdLoading ? '修改中...' : '确认修改'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLayout
