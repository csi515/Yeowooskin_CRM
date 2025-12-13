'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginForm from './components/auth/LoginForm'

/**
 * 비밀번호 재설정 리디렉션 로직
 * useSearchParams를 사용하므로 Suspense로 감싸야 함
 */
function PasswordResetHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 비밀번호 재설정 code 파라미터 체크
    const code = searchParams.get('code')
    const type = searchParams.get('type')

    // Supabase 비밀번호 재설정 플로우
    if (code) {
      // type이 명시되지 않았거나 recovery인 경우
      if (!type || type === 'recovery') {
        router.push(`/reset-password?code=${code}`)
        return
      }
    }
  }, [searchParams, router])

  return null
}

/**
 * 홈페이지 클라이언트 컴포넌트
 * 비밀번호 재설정 code 파라미터를 감지하고 리디렉션
 */
function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <PasswordResetHandler />
      </Suspense>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
        <LoginForm />
      </Suspense>
    </>
  )
}

export default HomePage
