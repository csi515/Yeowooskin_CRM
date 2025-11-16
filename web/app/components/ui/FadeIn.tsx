'use client'

import clsx from 'clsx'
import { useIntersectionObserver } from '@/app/lib/hooks/useIntersectionObserver'

type Props = {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  triggerOnce?: boolean
  threshold?: number
}

export default function FadeIn({
  children,
  className,
  delay = 0,
  duration = 500,
  triggerOnce = true,
  threshold = 0.1,
}: Props) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    triggerOnce,
    threshold,
  })

  return (
    <div
      ref={ref}
      className={clsx(
        'transition-opacity duration-500',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}
