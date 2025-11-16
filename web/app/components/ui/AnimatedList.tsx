'use client'

import clsx from 'clsx'
import { useEffect, useState } from 'react'

type Props<T> = {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string | number
  className?: string
  animationType?: 'slide' | 'fade' | 'scale'
  duration?: number
  staggerDelay?: number
}

export default function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  animationType = 'slide',
  duration = 300,
  staggerDelay = 50,
}: Props<T>) {
  const [visibleItems, setVisibleItems] = useState<Set<string | number>>(new Set())

  useEffect(() => {
    const newVisible = new Set<string | number>()
    items.forEach((item, index) => {
      const key = keyExtractor(item, index)
      setTimeout(() => {
        newVisible.add(key)
        setVisibleItems(new Set(newVisible))
      }, index * staggerDelay)
    })
  }, [items, keyExtractor, staggerDelay])

  const getAnimationClass = (index: number, isVisible: boolean) => {
    if (!isVisible) {
      switch (animationType) {
        case 'slide':
          return 'opacity-0 translate-y-4'
        case 'fade':
          return 'opacity-0'
        case 'scale':
          return 'opacity-0 scale-95'
        default:
          return 'opacity-0'
      }
    }
    
    return 'opacity-100 translate-y-0 scale-100'
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {items.map((item, index) => {
        const key = keyExtractor(item, index)
        const isVisible = visibleItems.has(key)

        return (
          <div
            key={key}
            className={clsx(
              'transition-all duration-300',
              getAnimationClass(index, isVisible)
            )}
            style={{
              transitionDelay: `${index * staggerDelay}ms`,
              transitionDuration: `${duration}ms`,
            }}
          >
            {renderItem(item, index)}
          </div>
        )
      })}
    </div>
  )
}
