'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { lockScroll, unlockScroll } from '@/app/lib/utils/scrollLock'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  /** 모바일에서만 바텀 시트로 표시, 데스크톱에서는 모달 */
  mobileOnly?: boolean
  /** 스와이프로 닫기 가능 여부 */
  swipeToClose?: boolean
  /** 최대 높이 (vh 단위) */
  maxHeight?: number
}

/**
 * 모바일 최적화 바텀 시트 컴포넌트
 * 스와이프 제스처 및 터치 최적화 포함
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  mobileOnly = true,
  swipeToClose = true,
  maxHeight = 90,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(open)
  const [exiting, setExiting] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setExiting(false)
      setDragY(0)
      lockScroll()
    } else if (mounted) {
      setExiting(true)
      unlockScroll()
      closeTimer.current = window.setTimeout(() => {
        setMounted(false)
        setExiting(false)
        setDragY(0)
      }, 300)
    }
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
      if (open) unlockScroll()
    }
  }, [open, mounted])

  // 스와이프 제스처 처리
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeToClose || !e.touches[0]) return
    startYRef.current = e.touches[0].clientY
    currentYRef.current = startYRef.current
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeToClose || !isDragging || !e.touches[0]) return
    const sheet = sheetRef.current
    if (!sheet) return

    // 스크롤 가능한 영역에서 스크롤이 맨 위에 있을 때만 드래그 허용
    const scrollTop = sheet.scrollTop
    const isAtTop = scrollTop === 0

    if (!isAtTop) {
      // 스크롤 가능한 경우 드래그 비활성화
      setIsDragging(false)
      return
    }

    currentYRef.current = e.touches[0].clientY
    const deltaY = currentYRef.current - startYRef.current
    if (deltaY > 0) {
      // 아래로 드래그만 허용
      setDragY(deltaY)
      e.preventDefault() // 스크롤 방지
    }
  }

  const handleTouchEnd = () => {
    if (!swipeToClose || !isDragging) return
    setIsDragging(false)
    
    const threshold = 100 // 100px 이상 드래그 시 닫기
    if (dragY > threshold) {
      onClose()
    } else {
      // 스냅백 애니메이션
      setDragY(0)
    }
  }

  // 스크롤 방지 (드래그 중)
  useEffect(() => {
    if (isDragging && dragY > 0) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDragging, dragY])

  if (!mounted) return null

  const dragStyle = isDragging && dragY > 0
    ? { transform: `translateY(${dragY}px)` }
    : {}

  const content = (
    <div
      ref={sheetRef}
      className={`
        fixed inset-x-0 bottom-0 z-[1050]
        bg-white rounded-t-3xl shadow-2xl
        flex flex-col
        transition-transform duration-300 ease-out
        ${exiting ? 'translate-y-full' : 'translate-y-0'}
        ${mobileOnly ? 'md:hidden' : ''}
        safe-area-inset-bottom
      `}
      style={{
        ...dragStyle,
        maxHeight: `${maxHeight}vh`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 드래그 핸들 */}
      {swipeToClose && (
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-neutral-300 rounded-full" aria-hidden="true" />
        </div>
      )}

      {/* 헤더 */}
      {(title || description) && (
        <div className="px-6 pt-2 pb-4 border-b border-neutral-200">
          {title && (
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
              <button
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 transition-colors touch-manipulation"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          {description && (
            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          )}
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth scroll-container px-6 py-4">
        {children}
      </div>
    </div>
  )

  if (mobileOnly) {
    return (
      <>
        {open && (
          <div
            className="fixed inset-0 z-[1049] bg-overlay-60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
            onClick={onClose}
            aria-hidden="true"
            style={{
              opacity: exiting ? 0 : 1,
            }}
          />
        )}
        {content}
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-[1050] flex items-end justify-center md:hidden">
      {open && (
        <div
          className="absolute inset-0 bg-overlay-60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
          style={{
            opacity: exiting ? 0 : 1,
          }}
        />
      )}
      {content}
    </div>
  )
}

