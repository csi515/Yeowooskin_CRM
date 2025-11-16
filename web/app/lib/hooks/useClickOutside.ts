'use client'

import { useEffect, useRef, type RefObject } from 'react'

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return

    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (!ref.current) return
      
      const target = event.target as Node
      if (!ref.current.contains(target)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [handler, enabled])

  return ref
}
