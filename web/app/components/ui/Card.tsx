'use client'

import clsx from 'clsx'
import { memo } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

function Card({ 
  children, 
  className, 
  hover = false,
  onClick,
  padding = 'md'
}: Props) {
  const paddingClasses = {
    none: '',
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-5 lg:p-6',
    lg: 'p-6 md:p-8'
  }

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-neutral-200 shadow-md',
        paddingClasses[padding],
        hover && 'hover:shadow-lg transition-shadow duration-300',
        onClick && 'cursor-pointer active:scale-[0.98] transition-all',
        className
      )}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  )
}

export default memo(Card)
