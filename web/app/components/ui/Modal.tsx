'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { lockScroll, unlockScroll } from '@/app/lib/utils/scrollLock'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

type ModalProps = {
  open: boolean
  onClose: () => void
  size?: ModalSize
  children: React.ReactNode
  /**
   * 오버레이 클릭 시 모달을 닫을지 여부입니다.
   * 폼 작성 중 실수로 닫히는 것을 방지하고 싶다면 false로 설정할 수 있습니다.
   */
  closeOnOutsideClick?: boolean
}

export function Modal({
  open,
  onClose,
  size = 'lg',
  children,
  closeOnOutsideClick = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(open)
  const [exiting, setExiting] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null }
      setMounted(true)
      setExiting(false)
      lockScroll()
    } else if (mounted) {
      setExiting(true)
      unlockScroll()
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus()
        previouslyFocusedElementRef.current = null
      }
      // content-out이 180ms, overlay-out이 160ms → 여유 포함
      closeTimer.current = window.setTimeout(() => {
        setMounted(false)
        setExiting(false)
      }, 220)
    }
    return () => {
      if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null }
      if (open) unlockScroll()
    }
  }, [open, mounted])

  // 모달 오픈 시 포커스를 모달 내부로 이동
  useEffect(() => {
    if (!open || !mounted) return
    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

    window.setTimeout(() => {
      const root = contentRef.current
      if (!root) return
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector))
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        root.focus()
      }
    }, 0)
  }, [open, mounted])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const root = contentRef.current
    if (!root) return

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    const focusable = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector))
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const target = e.target as HTMLElement

    if (e.shiftKey) {
      if (target === first || !root.contains(target)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (target === last || !root.contains(target)) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  if (!mounted) return null
  const sizes: Record<string, string> = {
    sm: 'md:max-w-md',
    md: 'md:max-w-lg',
    lg: 'md:max-w-2xl',
    xl: 'md:max-w-4xl',
  }
  return (
    <div 
      className="fixed inset-0 z-[1050] flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div
        className={`absolute inset-0 bg-overlay-60 backdrop-blur-sm ${exiting ? 'animate-overlay-out' : 'animate-overlay-in'}`}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      />
      <div
        ref={contentRef}
        className={`relative bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-[95vw] md:max-w-[min(90vw,960px)] ${sizes[size]} max-h-[calc(100vh-2rem)] md:max-h-[min(80vh,640px)] flex flex-col m-2 md:m-6 overflow-hidden ${exiting ? 'animate-content-out' : 'animate-content-in'}`}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-3 top-3 h-9 w-9 inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white hover:bg-[#F472B6] hover:text-white hover:border-[#F472B6] active:scale-[0.99] transition-all duration-300 z-10"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="px-4 md:px-6 py-4 md:py-6 border-b border-neutral-200 bg-white sticky top-0 z-10">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-[#FDF2F8] text-[#F472B6]" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 id="modal-title" className="text-lg md:text-xl font-medium text-neutral-900 mb-1 truncate">{title}</h3>
          {description && <p className="text-xs md:text-sm text-neutral-600 mt-1 leading-relaxed break-words">{description}</p>}
        </div>
      </div>
    </div>
  )
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="px-4 md:px-6 py-4 md:py-6 overflow-y-auto space-y-4 md:space-y-6">{children}</div>
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 md:px-6 py-3 md:py-4 border-t border-neutral-200 flex flex-col md:flex-row justify-end gap-2 md:gap-3 sticky bottom-0 bg-white">
      {children}
    </div>
  )
}

export default Modal


