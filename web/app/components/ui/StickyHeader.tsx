'use client'

import clsx from 'clsx'
import { useEffect, useState, useRef } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  offset?: number
  zIndex?: number
  shadow?: boolean
}

export default function StickyHeader({
  children,
  className,
  offset = 0,
  zIndex = 50,
  shadow = true,
}: Props) {
  const [isSticky, setIsSticky] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current) return
      
      const rect = headerRef.current.getBoundingClientRect()
      setIsSticky(rect.top <= offset)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [offset])

  return (
    <div
      ref={headerRef}
      className={clsx(
        'sticky transition-all duration-200',
        isSticky && shadow && 'shadow-md',
        className
      )}
      style={{
        top: `${offset}px`,
        zIndex,
      }}
    >
      {children}
    </div>
  )
}

export function StickyFooter({
  children,
  className,
  offset = 0,
  zIndex = 50,
  shadow = true,
}: Props) {
  const [isSticky, setIsSticky] = useState(false)
  const footerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current) return
      
      const rect = footerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      setIsSticky(rect.bottom >= windowHeight - offset)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [offset])

  return (
    <div
      ref={footerRef}
      className={clsx(
        'sticky transition-all duration-200',
        isSticky && shadow && 'shadow-md',
        className
      )}
      style={{
        bottom: `${offset}px`,
        zIndex,
      }}
    >
      {children}
    </div>
  )
}
