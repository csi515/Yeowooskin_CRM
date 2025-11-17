'use client'

import clsx from 'clsx'

type Props = {
  children: React.ReactNode
  className?: string
  sticky?: boolean
}

export default function FilterBar({ children, className, sticky = true }: Props) {
  return (
    <div 
      className={clsx(
        'bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-xl border-2 border-pink-200 p-3 md:p-4 flex flex-wrap items-end gap-3 shadow-md',
        sticky && 'sticky top-14 md:top-16 z-[1020]',
        className
      )}
    >
      {children}
    </div>
  )
}
