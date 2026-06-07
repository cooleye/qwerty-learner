import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Qwerty Learner 管理后台',
  description: 'Qwerty Learner 管理后台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
