'use client'

import { useState, useCallback, useRef } from 'react'

export interface RippleEvent {
  x: number
  y: number
  size: number
}

export function useRipple() {
  const [ripples, setRipples] = useState<RippleEvent[]>([])
  const rippleTimeoutRef = useRef<NodeJS.Timeout>()

  const addRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const newRipple: RippleEvent = { x, y, size }
    setRipples((prev) => [...prev, newRipple])

    // ripple 제거 (애니메이션 완료 후)
    if (rippleTimeoutRef.current) {
      clearTimeout(rippleTimeoutRef.current)
    }
    rippleTimeoutRef.current = setTimeout(() => {
      setRipples((prev) => prev.slice(1))
    }, 600)
  }, [])

  return { ripples, addRipple }
}
