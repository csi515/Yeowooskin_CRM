'use client'

import { GridSkeleton } from './Skeleton'
import LoadingSpinner from './LoadingSpinner'

type Props = {
  type?: 'skeleton' | 'spinner'
  message?: string
}

export default function PageLoading({ type = 'skeleton', message }: Props) {
  if (type === 'spinner') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text={message || '로딩 중...'} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="h-8 w-64 bg-neutral-200 rounded-lg animate-pulse" />
        <div className="h-4 w-96 bg-neutral-200 rounded animate-pulse" />
      </div>
      <GridSkeleton items={6} cols={3} />
    </div>
  )
}
