'use client'

import clsx from 'clsx'
import { useState, useRef, useEffect } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
}

export default function Table({ children, className }: Props) {
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (!scrollRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftShadow(scrollLeft > 0)
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1)
  }

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    handleScroll()
    scrollElement.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <div
      ref={scrollRef}
      className={clsx(
        'relative bg-white rounded-xl border border-neutral-200 overflow-x-auto shadow-sm',
        className
      )}
      onScroll={handleScroll}
    >
      {showLeftShadow && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      )}
      {showRightShadow && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      )}
      <table className="min-w-full text-sm">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200">
      {children}
    </thead>
  )
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-neutral-100">{children}</tbody>
}

export function TR({ 
  children, 
  onClick, 
  clickable,
  selected,
  onSelect,
}: { 
  children: React.ReactNode
  onClick?: () => void
  clickable?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const isClickable = clickable || !!onClick || !!onSelect
  const handleClick = () => {
    onSelect?.()
    onClick?.()
  }
  
  return (
    <tr
      onClick={handleClick}
      className={clsx(
        'divide-x divide-neutral-100 transition-colors',
        selected && 'bg-blue-50 border-l-4 border-l-blue-500',
        isClickable && 'cursor-pointer',
        selected 
          ? 'hover:bg-blue-100 active:bg-blue-200' 
          : isClickable 
            ? 'hover:bg-neutral-50 active:bg-neutral-100'
            : 'hover:bg-neutral-50/50'
      )}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-selected={selected}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {children}
    </tr>
  )
}

export function TH({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={clsx('text-left p-3 text-neutral-600 font-medium', className)}>{children}</th>
}

export function TD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={clsx('p-3 text-neutral-800', className)}>{children}</td>
}


