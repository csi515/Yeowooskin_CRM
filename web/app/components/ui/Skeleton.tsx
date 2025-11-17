'use client'

import clsx from 'clsx'

type Props = {
  className?: string
  shimmer?: boolean
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ 
  className, 
  shimmer = true,
  variant = 'rectangular'
}: Props) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  return (
    <div
      className={clsx(
        'border border-neutral-200 bg-neutral-100',
        variantClasses[variant],
        shimmer ? 'skeleton-shimmer' : 'animate-pulse',
        className,
      )}
      aria-label="로딩 중"
      role="status"
    />
  )
}

export function CardSkeleton({ shimmer = true, lines = 3 }: { shimmer?: boolean; lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 md:p-6 shadow-md">
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" shimmer={shimmer} />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i}
            className={clsx(
              'h-4',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )} 
            shimmer={shimmer} 
          />
        ))}
      </div>
    </div>
  )
}

export function TextSkeleton({ lines = 3, shimmer = true }: { lines?: number; shimmer?: boolean }) {
  return (
    <div className="space-y-2" role="status" aria-label="텍스트 로딩 중">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full',
          )}
          shimmer={shimmer}
          variant="text"
        />
      ))}
    </div>
  )
}

export function TableSkeleton({ 
  rows = 5, 
  cols = 4, 
  shimmer = true,
  showHeader = true 
}: { 
  rows?: number
  cols?: number
  shimmer?: boolean
  showHeader?: boolean
}) {
  return (
    <div className="space-y-2" role="status" aria-label="테이블 로딩 중">
      {showHeader && (
        <div className="flex gap-4 pb-2 border-b border-neutral-200">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={`header-${colIdx}`}
              className="h-5 flex-1"
              shimmer={shimmer}
            />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={`cell-${rowIdx}-${colIdx}`}
              className="h-12 flex-1"
              shimmer={shimmer}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ 
  items = 5, 
  shimmer = true,
  showAvatar = false 
}: { 
  items?: number
  shimmer?: boolean
  showAvatar?: boolean
}) {
  return (
    <div className="space-y-3" role="status" aria-label="리스트 로딩 중">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" shimmer={shimmer} variant="circular" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" shimmer={shimmer} />
            <Skeleton className="h-3 w-1/2" shimmer={shimmer} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function GridSkeleton({ 
  items = 6, 
  shimmer = true,
  cols = 3 
}: { 
  items?: number
  shimmer?: boolean
  cols?: 1 | 2 | 3 | 4
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={clsx('grid gap-4', gridCols[cols])} role="status" aria-label="그리드 로딩 중">
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} shimmer={shimmer} />
      ))}
    </div>
  )
}

export default Skeleton
