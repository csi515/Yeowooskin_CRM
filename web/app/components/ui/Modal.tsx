'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
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
  /**
   * 모바일에서 자동 포커스를 비활성화합니다.
   * 키보드가 자동으로 올라오는 것을 방지합니다.
   */
  disableAutoFocus?: boolean
}

export function Modal({
  open,
  onClose,
  size = 'lg',
  children,
  closeOnOutsideClick = true,
  disableAutoFocus = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(open)
  const [exiting, setExiting] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragY, setDragY] = useState(0)
  const dragStartYRef = useRef(0)
  const dragYRef = useRef(0)
  const scrollPositionRef = useRef(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const bodyScrollLockRef = useRef(false)

  // 뷰포트 높이 추적 (키보드 처리용)
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight)
    }
    updateViewportHeight()
    window.visualViewport?.addEventListener('resize', updateViewportHeight)
    window.addEventListener('resize', updateViewportHeight)
    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('resize', updateViewportHeight)
    }
  }, [])

  // ESC 키 처리
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    if (open) {
      window.addEventListener('keydown', onKey, true)
    }
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null }
      // 스크롤 위치 저장
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop
      setMounted(true)
      setExiting(false)
      setIsDragging(false)
      setDragY(0)
      dragYRef.current = 0
      
      // 모바일에서 더 나은 스크롤 잠금
      if (!bodyScrollLockRef.current) {
        lockScroll()
        bodyScrollLockRef.current = true
        // 모바일에서 스크롤 위치 고정
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollPositionRef.current}px`
        document.body.style.width = '100%'
      }
    } else if (mounted) {
      setExiting(true)
      setIsDragging(false)
      setDragY(0)
      dragYRef.current = 0
      
      // 스크롤 잠금 해제
      if (bodyScrollLockRef.current) {
        unlockScroll()
        bodyScrollLockRef.current = false
        // 스크롤 위치 복원
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollPositionRef.current)
      }
      
      if (previouslyFocusedElementRef.current) {
        // 약간의 지연 후 포커스 복원 (애니메이션 완료 후)
        setTimeout(() => {
          if (previouslyFocusedElementRef.current) {
            previouslyFocusedElementRef.current.focus()
            previouslyFocusedElementRef.current = null
          }
        }, 100)
      }
      // content-out이 180ms, overlay-out이 160ms → 여유 포함
      closeTimer.current = window.setTimeout(() => {
        setMounted(false)
        setExiting(false)
      }, 220)
    }
    return () => {
      if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null }
      if (open && bodyScrollLockRef.current) {
        unlockScroll()
        bodyScrollLockRef.current = false
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
      }
    }
  }, [open, mounted])

  // 모달 오픈 시 포커스를 모달 내부로 이동 (자동 포커스 비활성화 옵션)
  useEffect(() => {
    if (!open || !mounted || disableAutoFocus) return
    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

    // 모바일에서는 약간의 지연을 두어 키보드가 자동으로 올라오는 것을 방지
    const delay = typeof window !== 'undefined' && window.innerWidth < 768 ? 100 : 0
    
    window.setTimeout(() => {
      const root = contentRef.current
      if (!root) return
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector))
      // 입력 필드가 아닌 버튼이나 링크를 우선적으로 포커스
      const nonInputFocusable = focusable.filter(el => 
        el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && el.tagName !== 'SELECT'
      )
      const target = nonInputFocusable.length > 0 ? nonInputFocusable[0] : focusable[0]
      
      if (target) {
        target.focus({ preventScroll: true })
      } else {
        root.focus({ preventScroll: true })
      }
    }, delay)
  }, [open, mounted, disableAutoFocus])

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && e.target === e.currentTarget && !isDragging) {
      onClose()
    }
  }, [closeOnOutsideClick, isDragging, onClose])

  // 터치 이벤트 처리 (오버레이 클릭)
  const handleOverlayTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && e.target === e.currentTarget && !isDragging && dragYRef.current < 10) {
      onClose()
    }
  }, [closeOnOutsideClick, isDragging, onClose])

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
        last?.focus()
      }
    } else {
      if (target === last || !root.contains(target)) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  // 모바일에서 동적 높이 계산 (키보드 고려)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  if (!mounted) return null
  const sizes: Record<string, string> = {
    sm: 'md:max-w-md',
    md: 'md:max-w-lg',
    lg: 'md:max-w-2xl',
    xl: 'md:max-w-4xl',
  }
  
  const mobileMaxHeight = viewportHeight > 0 && isMobile
    ? `calc(${viewportHeight}px - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1rem)`
    : 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem)'
  
  return (
    <div 
      className="fixed inset-0 z-[1050] flex items-end md:items-center justify-center"
      onClick={handleOverlayClick}
      onTouchEnd={handleOverlayTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <div
        className={`absolute inset-0 bg-overlay-60 backdrop-blur-sm transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          backgroundColor: isDragging ? `rgba(0, 0, 0, ${Math.max(0.2, 0.5 - Math.min(dragY / 400, 0.3))})` : 'rgba(0, 0, 0, 0.5)',
          backdropFilter: isDragging ? 'blur(2px)' : 'blur(4px)',
          WebkitBackdropFilter: isDragging ? 'blur(2px)' : 'blur(4px)',
          willChange: isDragging ? 'background-color, backdrop-filter' : 'auto',
          transition: isDragging ? 'none' : 'background-color 0.2s ease-out, backdrop-filter 0.2s ease-out',
        }}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={`relative bg-white rounded-t-2xl md:rounded-xl border border-neutral-200 shadow-2xl w-full md:w-auto max-w-full md:max-w-[min(90vw,960px)] ${sizes[size]} flex flex-col m-0 md:m-3 overflow-hidden safe-area-inset-bottom min-h-[200px] ${
          exiting 
            ? 'md:animate-content-out animate-slide-down' 
            : 'md:animate-content-in animate-slide-up'
        }`}
        style={{
          maxHeight: isMobile ? mobileMaxHeight : 'min(85vh, 640px)',
          transform: isDragging && dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: isDragging ? 'transform, opacity' : 'auto',
          opacity: isDragging ? Math.max(0.7, 1 - dragY / 300) : 1,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* 모바일 드래그 핸들 - 더 큰 터치 영역 */}
        <div 
          ref={dragHandleRef}
          className="md:hidden flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none -mx-4 px-4"
          style={{ 
            minHeight: '44px',
            touchAction: 'pan-y',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0]
            if (!touch) return
            dragStartYRef.current = touch.clientY
            dragYRef.current = 0
            setIsDragging(true)
            setDragY(0)
            e.stopPropagation()
          }}
          onTouchMove={(e) => {
            if (!isDragging) return
            const touch = e.touches[0]
            if (!touch) return
            const deltaY = touch.clientY - dragStartYRef.current
            // 아래로만 드래그 허용
            if (deltaY > 0) {
              dragYRef.current = deltaY
              setDragY(deltaY)
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          onTouchEnd={(e) => {
            setIsDragging(false)
            // 임계값(80px) 이상 드래그 시 닫기 (더 민감하게)
            if (dragYRef.current > 80) {
              onClose()
            } else {
              // 스냅백 애니메이션
              dragYRef.current = 0
              setDragY(0)
            }
            e.stopPropagation()
          }}
          aria-label="모달 드래그 핸들"
        >
          <div 
            className="w-14 h-1.5 bg-neutral-400 rounded-full transition-colors duration-200" 
            style={{
              backgroundColor: isDragging ? '#9CA3AF' : '#D1D5DB',
            }}
            aria-hidden="true" 
          />
        </div>
        
        <button
          type="button"
          aria-label="모달 닫기"
          onClick={onClose}
          className="absolute right-2 top-2 md:right-2 md:top-2 h-11 w-11 md:h-9 md:w-9 inline-flex items-center justify-center rounded-lg border-2 border-neutral-300 bg-white hover:bg-[#F472B6] hover:text-white hover:border-[#F472B6] active:scale-[0.95] active:bg-[#EC4899] transition-all duration-200 z-20 touch-manipulation shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F472B6] focus-visible:ring-offset-2"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <X className="h-6 w-6 md:h-4 md:w-4" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5 border-b-2 border-neutral-200 bg-white sticky top-0 z-10 safe-area-inset-top">
      <div className="flex items-start gap-3 sm:gap-4 pr-12 md:pr-0">
        {icon && (
          <div className="mt-0.5 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg border-2 border-neutral-200 bg-[#FDF2F8] text-[#F472B6] flex-shrink-0 shadow-sm" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 id="modal-title" className="text-xl sm:text-2xl font-semibold text-neutral-900 break-words leading-tight">{title}</h3>
          {description && (
            <p id="modal-description" className="text-sm sm:text-base text-neutral-600 mt-2 sm:mt-2.5 leading-relaxed break-words">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="px-4 py-5 sm:px-6 sm:py-6 overflow-y-auto space-y-4 sm:space-y-5 overscroll-contain scroll-smooth scroll-container flex-1 min-h-0"
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        willChange: 'scroll-position',
      }}
    >
      {children}
    </div>
  )
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5 border-t-2 border-neutral-200 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.1)] flex flex-row justify-end gap-3 sm:gap-4 sticky bottom-0 bg-white safe-area-inset-bottom z-10">
      <div className="flex flex-row gap-3 sm:gap-4 w-full sm:w-auto">
        {/* 모바일에서도 가로 정렬, 버튼 크기 조정 */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement<{ className?: string }>(child)) {
            return React.cloneElement(child, {
              className: `flex-1 sm:flex-none sm:w-auto min-w-0 min-h-[44px] ${child.props.className || ''}`,
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

export default Modal


