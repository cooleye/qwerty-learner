import { userAtom, isLoggedInAtom } from '@/store/authAtom'
import logo from '@/assets/logo.svg'
import { useAtomValue } from 'jotai'
import type { PropsWithChildren } from 'react'
import type React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

const Header: React.FC<PropsWithChildren> = ({ children }) => {
  const user = useAtomValue(userAtom)
  const isLoggedIn = useAtomValue(isLoggedInAtom)
  const navigate = useNavigate()

  return (
    <header className="container z-20 mx-auto w-full px-10 py-6">
      <div className="flex w-full flex-col items-center justify-between space-y-3 lg:flex-row lg:space-y-0">
        <NavLink
          className="flex items-center text-2xl font-bold text-indigo-500 no-underline hover:no-underline lg:text-4xl"
          to="/"
        >
          <img src={logo} className="mr-3 h-16 w-16" alt="Qwerty Learner Logo" />
          <h1>Qwerty Learner</h1>
        </NavLink>
        <nav className="my-card on element flex w-auto content-center items-center justify-end space-x-3 rounded-xl bg-white p-4 transition-colors duration-300 dark:bg-gray-800">
          {children}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
              title="个人中心"
            >
              {(user?.name || user?.email || user?.phone || '?')[0].toUpperCase()}
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
