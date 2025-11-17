'use client'

import LoadingSpinner from './LoadingSpinner'
import { TextSkeleton, GridSkeleton, TableSkeleton } from './Skeleton'
import clsx from 'clsx'

type LoadingStateProps = {
  type?: 'spinner' | 'skeleton' | 'table' | 'grid' | 'text'
  message?: string
  lines?: number
  items?: number
  cols?: 1 | 2 | 3 | 4
  className?: string
}

export default function LoadingState({
  type = 'spinner',
  message = '로딩 중...',
  lines = 3,
  items = 6,
  cols = 3,
  className
}: LoadingStateProps) {
  if (type === 'spinner') {
    return (
      <div className={clsx('flex items-center justify-center min-h-[200px]', className)}>
        <LoadingSpinner size="lg" text={message} />
      </div>
    )
  }

  if (type === 'skeleton' || type === 'grid') {
    return <GridSkeleton items={items} cols={cols} />
  }

  if (type === 'table') {
    return <TableSkeleton rows={5} cols={4} />
  }

  if (type === 'text') {
    return <TextSkeleton lines={lines} />
  }

  return null
}
