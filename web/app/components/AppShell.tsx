'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import CommandPalette from './CommandPalette'
import QuickTreatmentModal from './modals/QuickTreatmentModal'
import MobileBottomNav from './mobile/MobileBottomNav'
import { useDefaultKeyboardShortcuts } from '@/app/lib/hooks/useKeyboardShortcuts'
import { useState, useEffect, useRef } from 'react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isPublic =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password') ||
    pathname === '/update-password'
  const [navOpen, setNavOpen] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffsetRef = useRef(0)

  // ESC 키로 모바일 네비게이션 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && navOpen) {
        setNavOpen(false)
      }
    }
    if (navOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [navOpen])

  // 전역 키보드 단축키 활성화
  useDefaultKeyboardShortcuts()

  if (isPublic) {
    return <>{children}</>
  }
  return (
    <div className="flex min-h-screen">
      <CommandPalette />
      <QuickTreatmentModal />
      {/* 데스크톱 사이드바 */}
      <Sidebar />
      
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenu={() => setNavOpen(prev => !prev)} />
        <main className="flex-1 overflow-x-hidden scroll-smooth pb-16 md:pb-0">
          <div className="container mx-auto py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 lg:px-10">
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* 모바일 하단 네비게이션 */}
      <MobileBottomNav />

      {/* 모바일 네비게이션 드로어 */}
      {navOpen && (
        <div 
          className="fixed inset-0 z-[1100] md:hidden" 
          role="dialog" 
          aria-modal="true" 
          aria-label="메뉴"
        >
          {/* 오버레이 */}
          <div 
            className="absolute inset-0 bg-overlay-60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
          
          {/* 사이드바 - 스와이프로 닫기 지원 (개선) */}
          <div 
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl border-r border-neutral-200 transform transition-transform duration-300 ease-out"
            style={{
              transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
              transition: isDragging ? 'none' : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              const touch = e.touches[0]
              if (!touch) return
              const startX = touch.clientX
              setIsDragging(true)
              setDragOffset(0)
              dragOffsetRef.current = 0
              
              const handleMove = (moveEvent: TouchEvent) => {
                const touch = moveEvent.touches[0]
                if (!touch) return
                const currentX = touch.clientX
                const deltaX = currentX - startX
                // 왼쪽으로만 드래그 허용
                if (deltaX < 0) {
                  dragOffsetRef.current = deltaX
                  setDragOffset(deltaX)
                  moveEvent.preventDefault()
                }
              }
              
              const handleEnd = () => {
                setIsDragging(false)
                // 임계값(-100px) 이상 드래그 시 닫기
                if (dragOffsetRef.current < -100) {
                  setNavOpen(false)
                } else {
                  // 스냅백
                  setDragOffset(0)
                  dragOffsetRef.current = 0
                }
                document.removeEventListener('touchmove', handleMove)
                document.removeEventListener('touchend', handleEnd)
              }
              
              document.addEventListener('touchmove', handleMove, { passive: false })
              document.addEventListener('touchend', handleEnd, { once: true })
            }}
          >
            <Sidebar mobile onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}


