import { useChapterStats } from '../hooks/useChapterStats'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import { useEffect, useRef } from 'react'
import IconCheckCircle from '~icons/heroicons/check-circle-solid'

export default function Chapter({
  index,
  checked,
  dictID,
  isLocked,
  onChange,
}: {
  index: number
  checked: boolean
  dictID: string
  isLocked?: boolean
  onChange: (index: number) => void
}) {
  const ref = useRef<HTMLTableRowElement>(null)

  const entry = useIntersectionObserver(ref, {})
  const isVisible = !!entry?.isIntersecting
  const chapterStatus = useChapterStats(index, dictID, isVisible)

  useEffect(() => {
    if (checked && ref.current !== null) {
      const button = ref.current
      const container = button.parentElement?.parentElement?.parentElement
      container?.scroll({
        top: button.offsetTop - container.offsetTop - 300,
        behavior: 'smooth',
      })
    }
  }, [checked])

  return (
    <div
      ref={ref}
      className={`relative flex h-16 w-40 cursor-pointer flex-col items-start justify-center overflow-hidden rounded-xl px-3 py-2 ${
        isLocked ? 'bg-gray-200 dark:bg-gray-700' : 'bg-slate-100 dark:bg-slate-800'
      }`}
      onClick={() => onChange(index)}
    >
      {isLocked && (
        <span className="absolute right-2 top-1 rounded bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          VIP
        </span>
      )}
      <h1 className={isLocked ? 'text-gray-400' : ''}>第 {index + 1} 章</h1>
      <p className={`pt-[2px] text-xs ${isLocked ? 'text-gray-400' : 'text-slate-600'}`}>
        {isLocked ? '开通会员' : (chapterStatus ? (chapterStatus.exerciseCount > 0 ? `练习 ${chapterStatus.exerciseCount} 次` : '未练习') : '加载中...')}
      </p>
      {checked && (
        <IconCheckCircle className="absolute -bottom-4 -right-4 h-18 w-18 text-6xl text-green-500 opacity-40 dark:text-green-300" />
      )}
    </div>
  )
}
