'use client'

import { useEffect, useRef, useState } from 'react'

type UsePullToRefreshOptions = {
  onRefresh: () => Promise<void> | void
  threshold?: number // 드래그 임계값 (px)
  enabled?: boolean
}

/**
 * Pull-to-Refresh 훅
 * 모바일에서 아래로 당겨서 새로고침 기능
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startYRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)
  const isRefreshingRef = useRef<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const container = containerRef.current
    if (!container) return

    let touchStartY = 0
    let scrollTop = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return

      if (e.touches.length > 0) {
        const touch = e.touches[0]!
        touchStartY = touch.clientY
        scrollTop = container.scrollTop

        // 맨 위에 있을 때만 활성화
        if (scrollTop === 0) {
          startYRef.current = touchStartY
          currentYRef.current = touchStartY
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshingRef.current || scrollTop > 0) return

      if (e.touches.length > 0) {
        const touch = e.touches[0]!
        currentYRef.current = touch.clientY
        const deltaY = currentYRef.current - startYRef.current

        if (deltaY > 0 && scrollTop === 0) {
          e.preventDefault()
          setIsPulling(true)
          setPullDistance(Math.min(deltaY, threshold * 1.5))
        }
      }
    }

    const handleTouchEnd = async () => {
      if (isRefreshingRef.current) return

      const deltaY = currentYRef.current - startYRef.current

      if (deltaY >= threshold && scrollTop === 0) {
        isRefreshingRef.current = true
        setIsPulling(false)
        setPullDistance(0)

        try {
          await onRefresh()
        } finally {
          isRefreshingRef.current = false
        }
      } else {
        setIsPulling(false)
        setPullDistance(0)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, onRefresh, threshold])

  return {
    containerRef,
    isPulling,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1),
  }
}

