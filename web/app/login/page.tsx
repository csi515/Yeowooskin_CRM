'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import LoginForm from '@/app/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-6"><p>로딩 중...</p></main>}>
      <LoginForm />
    </Suspense>
  )
}
