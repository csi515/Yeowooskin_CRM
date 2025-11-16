'use client'

import clsx from 'clsx'
import type { ReactNode, MouseEvent } from 'react'

type Props = {
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  clickable?: boolean
  hover?: boolean
  divider?: boolean
  compact?: boolean
}

export default function Card({ 
  children, 
  className = '',
  onClick,
  clickable = false,
  hover = true,
  divider = false,
  compact = false,
}: Props) {
  const isClickable = clickable || !!onClick

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-lg border border-neutral-200 shadow-md transition-all duration-300',
        compact ? 'p-5' : 'p-6',
        hover && 'hover:shadow-lg hover:border-neutral-300',
        isClickable && 'cursor-pointer active:scale-[0.99] focus-visible:ring-[2px] focus-visible:ring-pink-300 focus-visible:ring-offset-2',
        divider && 'divide-y divide-neutral-200',
        className,
      )}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.(e as unknown as MouseEvent<HTMLDivElement>)
        }
      }}
    >
      {children}
    </div>
  )
}


