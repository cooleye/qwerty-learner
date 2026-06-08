import Loading from './components/Loading'
import './index.css'
import { ErrorBook } from './pages/ErrorBook'
import { FriendLinks } from './pages/FriendLinks'
import MobilePage from './pages/Mobile'
import TypingPage from './pages/Typing'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ProfilePage from './pages/Profile'
import MembershipPage from './pages/Profile/MembershipPage'
import AdminLoginPage from './pages/Admin/LoginPage'
import AdminDashboardPage from './pages/Admin/DashboardPage'
import AdminCodesPage from './pages/Admin/CodesPage'
import AdminUsersPage from './pages/Admin/UsersPage'
import AdminOrdersPage from './pages/Admin/OrdersPage'
import { tokenAtom, userAtom } from '@/store/authAtom'
import { isOpenDarkModeAtom } from '@/store'
import { supabase } from '@/lib/supabase'
import { Analytics } from '@vercel/analytics/react'
import 'animate.css'
import { useAtom, useAtomValue } from 'jotai'
import mixpanel from 'mixpanel-browser'
import process from 'process'
import React, { Suspense, lazy, useEffect, useState } from 'react'
import 'react-app-polyfill/stable'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

const AnalysisPage = lazy(() => import('./pages/Analysis'))
const GalleryPage = lazy(() => import('./pages/Gallery-N'))

if (process.env.NODE_ENV === 'production') {
  // for prod
  mixpanel.init('bdc492847e9340eeebd53cc35f321691')
} else {
  // for dev
  mixpanel.init('5474177127e4767124c123b2d7846e2a', { debug: true })
}

function Root() {
  const darkMode = useAtomValue(isOpenDarkModeAtom)
  const [token, setToken] = useAtom(tokenAtom)
  const [, setUser] = useAtom(userAtom)

  // 启动时从 Supabase 恢复 session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token)
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUser({
                id: session.user.id,
                name: profile.name || session.user.email || '用户',
                phone: session.user.phone || null,
                email: session.user.email || null,
                membership: profile.membership || 'free',
                membershipExpireAt: profile.membership_expire_at || null,
              })
            }
          })
      }
    })

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setToken(null)
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setToken, setUser])

  useEffect(() => {
    darkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark')
  }, [darkMode])

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  useEffect(() => {
    let wasMobile = window.innerWidth <= 600
    setIsMobile(wasMobile)

    const handleResize = () => {
      const nowMobile = window.innerWidth <= 600
      // 仅在从移动端切换回桌面端时刷新页面
      if (wasMobile && !nowMobile) {
        window.location.href = '/'
      }
      wasMobile = nowMobile
      setIsMobile(nowMobile)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <React.StrictMode>
      <BrowserRouter basename={REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''}>
        <Suspense fallback={<Loading />}>
          <Routes>
            {isMobile ? (
              <Route path="/*" element={<Navigate to="/mobile" />} />
            ) : (
              <>
                <Route index element={<TypingPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/error-book" element={<ErrorBook />} />
                <Route path="/friend-links" element={<FriendLinks />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/membership" element={<MembershipPage />} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/codes" element={<AdminCodesPage />} />
                <Route path="/*" element={<Navigate to="/" />} />
              </>
            )}
            <Route path="/mobile" element={<MobilePage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Analytics />
    </React.StrictMode>
  )
}

const container = document.getElementById('root')

container && createRoot(container).render(<Root />)
