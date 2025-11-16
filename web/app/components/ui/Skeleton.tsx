'use client'

import clsx from 'clsx'

type Props = {
  className?: string
  shimmer?: boolean
}

export function Skeleton({ className, shimmer = true }: Props) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-neutral-200 bg-neutral-100',
        shimmer ? 'skeleton-shimmer' : 'animate-pulse',
        className,
      )}
    />
  )
}

export function CardSkeleton({ shimmer = true }: { shimmer?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-md">
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" shimmer={shimmer} />
        <Skeleton className="h-8 w-full" shimmer={shimmer} />
        <Skeleton className="h-32 w-full" shimmer={shimmer} />
      </div>
    </div>
  )
}

export function TextSkeleton({ lines = 3, shimmer = true }: { lines?: number; shimmer?: boolean }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full',
          )}
          shimmer={shimmer}
        />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4, shimmer = true }: { rows?: number; cols?: number; shimmer?: boolean }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className="h-10 flex-1"
              shimmer={shimmer}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Skeleton


