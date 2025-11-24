'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Button from '@/app/components/ui/Button'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function ForbiddenPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.back()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 px-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">접근 권한 없음</h1>
          <p className="text-neutral-600">
            이 페이지에 접근할 권한이 없습니다.<br />
            필요한 권한을 확인해주세요.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-neutral-500">
            {countdown > 0 ? `${countdown}초 후 이전 페이지로 돌아갑니다.` : '이동 중...'}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => router.back()}
              className="w-full"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              이전 페이지로 돌아가기
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              홈으로 이동
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
