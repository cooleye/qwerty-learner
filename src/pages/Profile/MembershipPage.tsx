import { userAtom, tokenAtom, isVipAtom } from '@/store/authAtom'
import { api } from '@/utils/api'
import { useAtomValue } from 'jotai'
import type React from 'react'
import { useNavigate } from 'react-router-dom'

const MembershipPage: React.FC = () => {
  const isVip = useAtomValue(isVipAtom)
  const navigate = useNavigate()

  const plans = [
    { name: '月卡', price: 29.9, originalPrice: 49.9, duration: '1个月', features: ['解锁所有付费词库', '优先体验新功能', '去除所有广告'] },
    { name: '季卡', price: 79.9, originalPrice: 129.9, duration: '3个月', features: ['含月卡所有权益', '赠送 7 天会员时长', '专属社群资格'], popular: true },
    { name: '年卡', price: 199.9, originalPrice: 399.9, duration: '12个月', features: ['含季卡所有权益', '赠送 30 天会员时长', '终身 VIP 标识', '1对1反馈通道'] },
  ]

  const handlePurchase = (plan: typeof plans[0]) => {
    if (isVip) {
      alert('您已经是 VIP 会员')
      return
    }
    // TODO: 跳转支付页面
    alert(`暂未接入支付，请到个人中心使用激活码兑换\n您选择了: ${plan.name} ¥${plan.price}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-center text-3xl font-bold text-gray-800 dark:text-gray-100">升级会员</h1>
      <p className="mb-10 text-center text-gray-500 dark:text-gray-400">
        解锁全部付费词库，让学习更高效
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md dark:bg-gray-800 ${
              plan.popular ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-medium text-white">
                推荐
              </span>
            )}
            <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-gray-100">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">¥{plan.price}</span>
              <span className="ml-2 text-sm text-gray-400 line-through">¥{plan.originalPrice}</span>
            </div>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{plan.duration}</p>
            <ul className="mb-6 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-indigo-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePurchase(plan)}
              disabled={isVip}
              className={`w-full rounded-lg py-2.5 text-sm font-medium transition ${
                isVip
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                  : plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-900/20'
              }`}
            >
              {isVip ? '已是会员' : '立即开通'}
            </button>
          </div>
        ))}
      </div>

      {/* 激活码入口 */}
      <div className="mt-10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          已有激活码？
          <button
            onClick={() => navigate('/profile')}
            className="ml-1 text-indigo-600 hover:underline dark:text-indigo-400"
          >
            前往激活
          </button>
        </p>
      </div>
    </div>
  )
}

export default MembershipPage
