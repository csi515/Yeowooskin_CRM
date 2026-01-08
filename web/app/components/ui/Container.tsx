'use client'

import clsx from 'clsx'
import type { ReactNode } from 'react'

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

type Props = {
  children: ReactNode
  size?: ContainerSize
  className?: string
  padding?: boolean
}

export default function Container({
  children,
  size = 'xl',
  className,
  padding = true,
}: Props) {
  const sizeClasses: Record<ContainerSize, string> = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  }

  return (
    <div
      className={clsx(
        'w-full mx-auto',
        sizeClasses[size],
        padding && 'px-3 sm:px-4 md:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}
