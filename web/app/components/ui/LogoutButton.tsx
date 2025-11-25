'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import clsx from 'clsx'
import { useAppToast } from '@/app/lib/ui/toast'
import { getAuthApi } from '@/app/lib/api/auth'

type LogoutButtonProps = {
  collapsed?: boolean
  className?: string
}

/**
 * 로그아웃 버튼 컴포넌트
 * - 즉시 signOut() 수행
 * - 세션/쿠키 정리
 * - 로그인 페이지로 리다이렉트
 */
export default function LogoutButton({ collapsed = false, className }: LogoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const toast = useAppToast()

  const handleLogout = async () => {
    if (loading) return
    
    try {
      setLoading(true)
      
      // 1. Supabase signOut() 즉시 수행
      const authApi = await getAuthApi()
      await authApi.logout()
      
      // 2. 쿠키 정리 (API 호출)
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        console.error('쿠키 정리 실패:', error)
      }
      
      // 3. 로컬 스토리지 정리
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear()
        } catch (error) {
          console.error('로컬 스토리지 정리 실패:', error)
        }
      }
      
      // 4. 즉시 로그인 페이지로 이동
      router.push('/login')
      router.refresh() // 라우트 캐시 갱신
      
    } catch (error) {
      console.error('로그아웃 오류:', error)
      toast.error('로그아웃 실패', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={clsx(
        'w-full flex items-center justify-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg text-sm sm:text-base border border-neutral-300 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-900 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-1 touch-manipulation min-h-[48px] sm:min-h-[44px] font-medium disabled:opacity-50 disabled:cursor-not-allowed',
        collapsed && 'px-2',
        className
      )}
      title={collapsed ? '로그아웃' : undefined}
      aria-label="로그아웃"
      aria-disabled={loading}
    >
      {loading ? (
        <span className="flex-shrink-0">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      ) : (
        <LogOut className="h-5 w-5 flex-shrink-0" />
      )}
      {!collapsed && <span className="truncate">{loading ? '로그아웃 중...' : '로그아웃'}</span>}
    </button>
  )
}

