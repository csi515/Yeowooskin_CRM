'use client'

import { Bars3Icon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export default function TopBar({ onMenu }: { onMenu?: () => void }) {
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
    <header className="sticky top-0 z-[1021] bg-white border-b border-neutral-200 shadow-sm safe-area-inset-top">
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 md:px-8 gap-3 sm:gap-4">
        {/* 모바일 메뉴 버튼 */}
        <button
          aria-label="메뉴 열기"
          onClick={onMenu}
          className="md:hidden p-2.5 rounded-lg border border-transparent hover:bg-neutral-50 hover:border-neutral-200 active:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-1 transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Bars3Icon className="h-6 w-6 text-neutral-700" />
        </button>

        {/* 데스크톱 빈 공간 */}
        <div className="hidden md:block flex-1" />

        {/* 사용자 정보 */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {userName && (
            <span className="text-xs sm:text-sm md:text-base font-medium text-neutral-700 whitespace-nowrap">
              {userName}님
            </span>
          )}

        </div>
      </div>
    </header>
  )
}


