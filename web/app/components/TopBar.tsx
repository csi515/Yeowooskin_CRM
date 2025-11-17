'use client'

import { Bars3Icon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export default function TopBar({ onMenu }: { onMenu?: () => void }) {
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/me')
        if (response.ok) {
          const data = await response.json()
          const profile = data.profile
          if (profile?.name) {
            setUserName(profile.name)
          } else if (profile?.email) {
            setUserName(profile.email.split('@')[0])
          }
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUserProfile()
  }, [])

  return (
    <header className="sticky top-0 z-[1021] bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm">
      <div className="container h-14 md:h-16 flex items-center justify-between px-4 sm:px-5 md:px-6 gap-3">
        {/* 모바일 메뉴 버튼 */}
        <button 
          aria-label="메뉴 열기" 
          onClick={onMenu} 
          className="md:hidden p-2.5 rounded-lg border border-transparent hover:bg-neutral-50 hover:border-neutral-200 active:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 transition-all duration-200 touch-manipulation"
        >
          <Bars3Icon className="h-6 w-6 text-neutral-700" />
        </button>

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 사용자 정보 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
          ) : userName ? (
            <span className="hidden sm:inline text-xs sm:text-sm font-medium text-neutral-700 whitespace-nowrap">
              {userName}님 환영합니다
            </span>
          ) : null}
          <div 
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-[#FDF2F8] to-[#FCE7F3] border-2 border-neutral-200 shadow-sm flex-shrink-0 flex items-center justify-center text-xs font-semibold text-secondary-600"
            aria-label="사용자 아바타"
          >
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}
