'use client'

import { useEffect, useRef } from 'react'

type SwipeDirection = 'left' | 'right' | 'up' | 'down'

type TouchGesturesOptions = {
  onSwipe?: (direction: SwipeDirection) => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  enabled?: boolean
}

export function useTouchGestures(options: TouchGesturesOptions) {
  const { onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50, enabled = true } = options
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX < threshold && absY < threshold) return

      let direction: SwipeDirection | null = null

      if (absX > absY) {
        direction = deltaX > 0 ? 'right' : 'left'
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
      }

      if (direction) {
        onSwipe?.(direction)
        if (direction === 'left') onSwipeLeft?.()
        if (direction === 'right') onSwipeRight?.()
        if (direction === 'up') onSwipeUp?.()
        if (direction === 'down') onSwipeDown?.()
      }

      touchStartRef.current = null
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])
}
