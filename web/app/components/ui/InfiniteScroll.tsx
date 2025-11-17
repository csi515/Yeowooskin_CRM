'use client'

import { ReactNode } from 'react'
import { useInfiniteScroll } from '@/app/lib/hooks/useInfiniteScroll'
import LoadingSpinner from './LoadingSpinner'

type Props = {
  children: ReactNode
  onLoadMore: () => void | Promise<void>
  hasMore: boolean
  loading?: boolean
  threshold?: number
  className?: string
}

export default function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  loading = false,
  threshold = 200,
  className
}: Props) {
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore,
    threshold
  })

  return (
    <div className={className}>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="h-16 flex items-center justify-center py-4">
          {loading && (
            <LoadingSpinner size="sm" text="더 불러오는 중..." />
          )}
        </div>
      )}
    </div>
  )
}
