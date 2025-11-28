'use client'

import { useRef, useCallback } from 'react'

type UseLongPressOptions = {
  onLongPress: () => void
  onClick?: () => void
  delay?: number // 밀리초 단위
  threshold?: number // 터치 이동 허용 거리 (px)
}

/**
 * 롱프레스 제스처 훅
 * 모바일에서 길게 누르기 기능 제공
 */
export function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
  threshold = 10,
}: UseLongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const isLongPressRef = useRef(false)

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      isLongPressRef.current = false

      // 터치 시작 위치 저장
      if ('touches' in e) {
        if (e.touches.length > 0) {
          startPosRef.current = {
            x: e.touches[0]!.clientX,
            y: e.touches[0]!.clientY,
          }
        } else {
          return
        }
      } else {
        startPosRef.current = {
          x: e.clientX,
          y: e.clientY,
        }
      }

      timeoutRef.current = setTimeout(() => {
        isLongPressRef.current = true
        onLongPress()
      }, delay)
    },
    [onLongPress, delay]
  )

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    startPosRef.current = null
  }, [])

  const handleMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!startPosRef.current) return

      let currentX: number
      let currentY: number

      if ('touches' in e) {
        if (e.touches.length > 0) {
          currentX = e.touches[0]!.clientX
          currentY = e.touches[0]!.clientY
        } else {
          return
        }
      } else {
        currentX = e.clientX
        currentY = e.clientY
      }

      const deltaX = Math.abs(currentX - startPosRef.current.x)
      const deltaY = Math.abs(currentY - startPosRef.current.y)

      // 임계값을 넘으면 롱프레스 취소
      if (deltaX > threshold || deltaY > threshold) {
        clear()
      }
    },
    [threshold, clear]
  )

  const handleEnd = useCallback(
    (_: React.TouchEvent | React.MouseEvent) => {
      clear()

      // 롱프레스가 아니었으면 클릭 처리
      if (!isLongPressRef.current && onClick) {
        onClick()
      }

      isLongPressRef.current = false
    },
    [onClick, clear]
  )

  return {
    onTouchStart: start,
    onTouchMove: handleMove,
    onTouchEnd: handleEnd,
    onMouseDown: start,
    onMouseMove: handleMove,
    onMouseUp: handleEnd,
    onMouseLeave: clear,
  }
}

