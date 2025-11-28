'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { lockScroll, unlockScroll } from '@/app/lib/utils/scrollLock'

type Props = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  placement?: 'left' | 'right' | 'top' | 'bottom'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
  closeOnOverlayClick?: boolean
}

export default function Drawer({
  open,
  onClose,
  children,
  placement = 'left',
  size = 'md',
  className,
  closeOnOverlayClick = true,
}: Props) {
  const [mounted, setMounted] = useState(open)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setIsClosing(false)
      lockScroll()
    } else if (mounted) {
      setIsClosing(true)
      const timer = setTimeout(() => {
        setMounted(false)
        setIsClosing(false)
      }, 300)
      unlockScroll()
      return () => clearTimeout(timer)
    }
    return () => {
      if (open) unlockScroll()
    }
  }, [open, mounted])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    } else {
      return undefined
    }
  }, [open, onClose])

  if (!mounted) return null

  const getPlacementClasses = () => {
    const base = 'fixed z-50 bg-white shadow-xl transition-transform duration-300'
    
    switch (placement) {
      case 'right':
        return clsx(
          base,
          'top-0 right-0 bottom-0 h-full',
          isClosing ? 'translate-x-full' : 'translate-x-0'
        )
      case 'left':
        return clsx(
          base,
          'top-0 left-0 bottom-0 h-full',
          isClosing ? '-translate-x-full' : 'translate-x-0'
        )
      case 'top':
        return clsx(
          base,
          'top-0 left-0 right-0 w-full',
          isClosing ? '-translate-y-full' : 'translate-y-0'
        )
      case 'bottom':
        return clsx(
          base,
          'bottom-0 left-0 right-0 w-full',
          isClosing ? 'translate-y-full' : 'translate-y-0'
        )
    }
  }

  const getSizeClasses = () => {
    if (placement === 'left' || placement === 'right') {
      switch (size) {
        case 'sm':
          return 'w-64'
        case 'md':
          return 'w-80'
        case 'lg':
          return 'w-96'
        case 'xl':
          return 'w-[32rem]'
        case 'full':
          return 'w-full'
      }
    } else {
      switch (size) {
        case 'sm':
          return 'h-64'
        case 'md':
          return 'h-80'
        case 'lg':
          return 'h-96'
        case 'xl':
          return 'h-[32rem]'
        case 'full':
          return 'h-full'
      }
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isClosing ? 'opacity-0' : 'opacity-100'
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        className={clsx(
          getPlacementClasses(),
          getSizeClasses(),
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors z-10"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </>
  )
}

export function DrawerHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4 border-b border-neutral-200', className)}>
      {children}
    </div>
  )
}

export function DrawerBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4 overflow-y-auto flex-1', className)}>
      {children}
    </div>
  )
}

export function DrawerFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4 border-t border-neutral-200', className)}>
      {children}
    </div>
  )
}
