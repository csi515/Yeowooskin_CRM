'use client'

import { useCallback, useRef } from 'react'

type SwipeDirection = 'up' | 'down' | 'left' | 'right'

type UseSwipeOptions = {
  onSwipe?: (direction: SwipeDirection) => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number // 최소 스와이프 거리 (px)
  velocityThreshold?: number // 최소 스와이프 속도 (px/ms)
}

/**
 * 스와이프 제스처 훅
 * 모바일 터치 제스처 감지
 */
export function useSwipe(options: UseSwipeOptions = {}) {
  const {
    onSwipe,
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocityThreshold = 0.3,
  } = options

  const startXRef = useRef<number>(0)
  const startYRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const isTrackingRef = useRef<boolean>(false)

  const handleTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    const touch = 'touches' in e ? (e.touches.length > 0 ? e.touches[0] : null) : e
    if (!touch) return

    startXRef.current = touch.clientX
    startYRef.current = touch.clientY
    startTimeRef.current = Date.now()
    isTrackingRef.current = true
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!isTrackingRef.current) return

    const touch = 'changedTouches' in e ? (e.changedTouches.length > 0 ? e.changedTouches[0] : null) : e
    if (!touch) return

    const endX = touch.clientX
    const endY = touch.clientY
    const endTime = Date.now()

    const deltaX = endX - startXRef.current
    const deltaY = endY - startYRef.current
    const deltaTime = endTime - startTimeRef.current

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = distance / deltaTime

    // 최소 거리 및 속도 체크
    if (distance < threshold || velocity < velocityThreshold) {
      isTrackingRef.current = false
      return
    }

    // 방향 결정
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    let direction: SwipeDirection

    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    // 콜백 실행
    onSwipe?.(direction)

    switch (direction) {
      case 'up':
        onSwipeUp?.()
        break
      case 'down':
        onSwipeDown?.()
        break
      case 'left':
        onSwipeLeft?.()
        break
      case 'right':
        onSwipeRight?.()
        break
    }

    isTrackingRef.current = false
  }, [onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, threshold, velocityThreshold])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  }
}

