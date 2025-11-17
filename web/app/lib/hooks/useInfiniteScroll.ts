import { useEffect, useRef, useCallback } from 'react'

type UseInfiniteScrollOptions = {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void | Promise<void>
  threshold?: number
  root?: Element | null
}

export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200,
  root = null
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await onLoadMore()
  }, [hasMore, loading, onLoadMore])

  useEffect(() => {
    if (!hasMore || loading) {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      return
    }

    const options = {
      root,
      rootMargin: `${threshold}px`,
      threshold: 0.1
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        handleLoadMore()
      }
    }, options)

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, handleLoadMore, threshold, root])

  return { sentinelRef }
}
