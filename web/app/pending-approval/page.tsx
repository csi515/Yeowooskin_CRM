'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Mail, LogOut } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Alert from '../components/ui/Alert'

export default function PendingApprovalPage() {
  const router = useRouter()

  useEffect(() => {
    // 세션 확인 - 승인되면 대시보드로 리다이렉트
    const checkApproval = async () => {
      try {
        const { getAuthApi } = await import('@/app/lib/api/auth')
        const authApi = await getAuthApi()
        const { data: { user } } = await authApi.supabase.auth.getUser()
        
        if (user) {
          const profile = await authApi.checkApproval(user.id)
          if (profile?.approved) {
            router.push('/dashboard')
          }
        }
      } catch (error) {
        // 에러는 무시 (로그인하지 않은 상태일 수 있음)
      }
    }

    checkApproval()
    // 5초마다 승인 상태 확인
    const interval = setInterval(checkApproval, 5000)
    return () => clearInterval(interval)
  }, [router])

  const handleLogout = async () => {
    try {
      const { getAuthApi } = await import('@/app/lib/api/auth')
      const authApi = await getAuthApi()
      await authApi.logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
              승인 대기 중입니다
            </h1>
            <p className="text-neutral-600">
              회원가입이 완료되었습니다. HQ 관리자의 승인을 기다리고 있습니다.
            </p>
          </div>

          <Alert variant="info" title="승인 절차 안내">
            <div className="space-y-2 text-sm text-left mt-2">
              <p>1. 이메일 인증이 완료되었습니다.</p>
              <p>2. HQ 관리자가 계정을 검토하고 승인합니다.</p>
              <p>3. 승인 완료 후 로그인하여 서비스를 이용할 수 있습니다.</p>
            </div>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Mail className="h-4 w-4" />
              <span>승인 완료 시 이메일로 알림을 받습니다.</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Clock className="h-4 w-4" />
              <span>승인 상태는 자동으로 확인됩니다.</span>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <Button
              variant="secondary"
              onClick={handleLogout}
              leftIcon={<LogOut className="h-4 w-4" />}
              className="w-full"
            >
              로그아웃
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              로그인 페이지로 돌아가기
            </Button>
          </div>
        </div>
      </Card>
    </main>
  )
}

