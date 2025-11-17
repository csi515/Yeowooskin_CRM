'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BackToTop from './ui/BackToTop'
import { useState, useEffect } from 'react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isPublic = pathname === '/login' || pathname.startsWith('/auth') || pathname.startsWith('/reset-password') || pathname === '/update-password'
  const [navOpen, setNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  // 태블릿 감지 및 사이드바 자동 접기
  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= 768 && width < 1024)
      // 태블릿에서는 기본적으로 접힌 상태
      if (width >= 768 && width < 1024) {
        setSidebarCollapsed(true)
      }
    }
    checkTablet()
    window.addEventListener('resize', checkTablet)
    return () => window.removeEventListener('resize', checkTablet)
  }, [])

  // 모바일 메뉴 열릴 때 스크롤 잠금
  useEffect(() => {
    if (navOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [navOpen])

  // ESC 키로 모바일 메뉴 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && navOpen) {
        setNavOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navOpen])

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* 데스크톱 사이드바 */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onMenu={() => setNavOpen(true)} />
        <main className="flex-1 container py-4 px-4 sm:py-5 sm:px-5 md:py-6 md:px-6 lg:py-8 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            {children}
          </div>
        </main>
        <BackToTop />
      </div>

      {/* 모바일 오버레이 메뉴 */}
      {navOpen && (
        <div 
          className="fixed inset-0 z-[1050] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="메인 메뉴"
        >
          {/* 오버레이 */}
          <div 
            className="absolute inset-0 bg-overlay-60 backdrop-blur-sm animate-overlay-in"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
          
          {/* 사이드바 */}
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl animate-content-in">
            <Sidebar mobile onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
