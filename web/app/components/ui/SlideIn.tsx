'use client'

import clsx from 'clsx'
import { useIntersectionObserver } from '@/app/lib/hooks/useIntersectionObserver'

type Direction = 'up' | 'down' | 'left' | 'right'

type Props = {
  children: React.ReactNode
  className?: string
  direction?: Direction
  delay?: number
  duration?: number
  triggerOnce?: boolean
  threshold?: number
  distance?: number
}

export default function SlideIn({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 500,
  triggerOnce = true,
  threshold = 0.1,
  distance = 20,
}: Props) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    triggerOnce,
    threshold,
  })

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `translateY(${distance}px)`
        case 'down':
          return `translateY(-${distance}px)`
        case 'left':
          return `translateX(${distance}px)`
        case 'right':
          return `translateX(-${distance}px)`
      }
    }
    return 'translate(0, 0)'
  }

  return (
    <div
      ref={ref}
      className={clsx(
        'transition-all duration-500',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        transform: getTransform(),
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}
