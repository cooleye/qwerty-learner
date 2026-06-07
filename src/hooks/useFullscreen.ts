import { useCallback, useEffect, useState } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => {
      // 延迟状态更新，避免在全屏过渡期间触发 React 重渲染打断过渡
      requestAnimationFrame(() => {
        setIsFullscreen(!!document.fullscreenElement)
      })
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.body.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  return { isFullscreen, toggle }
}
