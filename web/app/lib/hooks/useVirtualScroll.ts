import { useState, useEffect, useRef, useMemo } from 'react'

type VirtualScrollOptions<T> = {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3
}: VirtualScrollOptions<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      offset: (startIndex + index) * itemHeight
    }))
  }, [items, startIndex, endIndex, itemHeight])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return {
    containerRef,
    totalHeight,
    visibleItems,
    startIndex,
    endIndex,
    onScroll: handleScroll
  }
}
