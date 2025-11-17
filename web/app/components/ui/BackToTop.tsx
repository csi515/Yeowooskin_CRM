'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import Button from './Button'
import clsx from 'clsx'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className={clsx(
        'fixed bottom-6 right-6 z-[1000]',
        'h-12 w-12 rounded-full',
        'bg-action-blue-600 text-white shadow-lg',
        'hover:bg-action-blue-700 active:scale-[0.98]',
        'transition-all duration-200',
        'flex items-center justify-center',
        'focus-visible:ring-2 focus-visible:ring-secondary-400',
        'touch-manipulation'
      )}
      aria-label="맨 위로 이동"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
