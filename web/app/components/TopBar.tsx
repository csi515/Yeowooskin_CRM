'use client'

import { Bars3Icon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export default function TopBar({ title, onMenu }: { title: string; onMenu?: () => void }) {
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // API 엔드포인트를 통해 사용자 프로필 가져오기
        const response = await fetch('/api/user/me')
        if (response.ok) {
          const data = await response.json()
          const profile = data.profile
          if (profile?.name) {
            setUserName(profile.name)
          } else if (profile?.email) {
            // 이름이 없으면 이메일의 @ 앞부분 사용
            setUserName(profile.email.split('@')[0])
          }
        }
      } catch (error) {
        // 에러는 무시 (로그인하지 않은 경우 등)
        console.error('Failed to load user profile:', error)
      }
    }
    loadUserProfile()
  }, [])

  return (
    <header className="sticky top-0 z-[1021] bg-white border-b border-neutral-200 shadow-md">
      <div className="container h-14 flex items-center justify-between px-4 gap-2 sm:gap-3">
        <button 
          aria-label="메뉴" 
          onClick={onMenu} 
          className="md:hidden p-2.5 rounded-lg border border-transparent hover:bg-neutral-50 hover:border-neutral-200 active:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-1 transition-all duration-300 touch-manipulation"
        >
          <Bars3Icon className="h-5 w-5 text-neutral-700" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-3">
          <h1 className="text-base sm:text-lg md:text-xl font-medium tracking-tight truncate text-neutral-900">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {userName && (
            <span className="text-xs sm:text-sm font-medium text-neutral-700 whitespace-nowrap">
              {userName}님 환영합니다.
            </span>
          )}
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-[#FDF2F8] to-[#FCE7F3] border border-neutral-200 shadow-sm flex-shrink-0" aria-label="사용자 아바타" />
        </div>
      </div>
    </header>
  )
}


