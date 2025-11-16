'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import clsx from 'clsx'
import Spinner from './Spinner'

type Props = {
  children: ReactNode
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void | Promise<void>
  threshold?: number
  loader?: ReactNode
  endMessage?: ReactNode
  className?: string
}

export default function InfiniteScroll({
  children,
  hasMore,
  loading,
  onLoadMore,
  threshold = 100,
  loader,
  endMessage,
  className,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoading) {
          setIsLoading(true)
          Promise.resolve(onLoadMore()).finally(() => {
            setIsLoading(false)
          })
        }
      },
      {
        threshold: 0.1,
        rootMargin: `${threshold}px`,
      }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loading, isLoading, onLoadMore, threshold])

  const defaultLoader = (
    <div className="flex items-center justify-center py-4">
      <Spinner size="md" />
    </div>
  )

  return (
    <div className={clsx('w-full', className)}>
      {children}
      <div ref={observerTarget}>
        {loading || isLoading ? (
          <div>{loader || defaultLoader}</div>
        ) : !hasMore && endMessage ? (
          <div className="text-center py-4 text-neutral-500 text-sm">
            {endMessage}
          </div>
        ) : null}
      </div>
    </div>
  )
}
