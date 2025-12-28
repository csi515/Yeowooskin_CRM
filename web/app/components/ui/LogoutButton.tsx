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
import Button from './Button'

export default function LogoutButton({ collapsed = false, className }: LogoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const toast = useAppToast()

  const handleLogout = async () => {
    // ... logic ...
    if (loading) return

    try {
      setLoading(true)
      const authApi = await getAuthApi()
      await authApi.logout()
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      } catch (error) { console.error(error) }
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear()
        } catch { }
      }
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('로그아웃 오류:', error)
      toast.error('로그아웃 실패', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      loading={loading}
      variant="contrast"
      className={clsx(
        'w-full flex items-center justify-center gap-3',
        collapsed && 'px-2',
        className
      )}
      title={collapsed ? '로그아웃' : undefined}
      aria-label="로그아웃"
      leftIcon={!loading && <LogOut className="h-5 w-5 flex-shrink-0" />}
    >
      {!collapsed && '로그아웃'}
    </Button>
  )
}

