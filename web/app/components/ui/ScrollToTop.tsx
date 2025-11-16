'use client'

import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { ArrowUp } from 'lucide-react'
import Button from './Button'
import FadeIn from './FadeIn'

type Props = {
  threshold?: number
  className?: string
  smooth?: boolean
}

export default function ScrollToTop({
  threshold = 400,
  className,
  smooth = true,
}: Props) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  const scrollToTop = () => {
    if (smooth) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo(0, 0)
    }
  }

  if (!isVisible) return null

  return (
    <FadeIn triggerOnce={false} className={clsx('fixed bottom-8 right-8 z-50', className)}>
      <Button
        variant="primary"
        size="md"
        onClick={scrollToTop}
        className="rounded-full h-12 w-12 p-0 shadow-lg hover:shadow-xl"
        aria-label="맨 위로 스크롤"
        leftIcon={<ArrowUp className="h-5 w-5" />}
      />
    </FadeIn>
  )
}
