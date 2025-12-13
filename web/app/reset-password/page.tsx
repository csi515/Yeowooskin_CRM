'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import Alert from '@/app/components/ui/Alert'

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [sessionUserEmail, setSessionUserEmail] = useState<string | null>(null)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
        const client = createSupabaseBrowserClient()
        setSupabase(client)

        // code 파라미터가 있으면 세션 복구
        const code = searchParams.get('code')
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code)
          if (error) {
            setError('재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청해주세요.')
          } else {
            setSessionReady(true)
          }
        } else {
          // code가 없으면 이미 세션이 있는지 확인
          const { data } = await client.auth.getSession()
          if (data.session) {
            setSessionReady(true)
          } else {
            setError('유효한 재설정 링크가 필요합니다.')
          }
        }

        // 세션이 준비되었다면 사용자 이메일 가져오기
        const { data: { user } } = await client.auth.getUser()
        if (user?.email) {
          setSessionUserEmail(user.email)
        }
      } catch (error) {
        console.error('Supabase 초기화 오류:', error)
        setError('환경설정 오류: Supabase 초기화에 실패했습니다.')
      }
    }
    init()
  }, [searchParams])

  const changePassword = async () => {
    if (!supabase) return

    if (!emailInput) {
      setError('아이디(이메일)를 입력해주세요.')
      return
    }

    if (sessionUserEmail && emailInput.trim() !== sessionUserEmail) {
      setError('입력한 이메일이 현재 인증된 계정과 일치하지 않습니다.')
      return
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setError(''); setInfo(''); setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setBusy(false)

    if (error) {
      setError(error.message)
      return
    }

    setInfo('비밀번호가 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.')
    setTimeout(() => router.push('/login'), 1500)
  }

  if (!sessionReady && !error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <p className="text-neutral-600">재설정 링크를 확인하는 중...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-lg p-7">
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold">비밀번호 변경</h1>
            <p className="text-sm text-neutral-600 mt-1">아이디와 새로운 비밀번호를 입력해주세요.</p>
          </div>

          {error && (
            <Alert variant="error" title={error} />
          )}
          {info && (
            <Alert variant="success" title={info} />
          )}

          {sessionReady && (
            <>
              <div className="space-y-4">
                <Input
                  label="아이디 (이메일)"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="가입된 이메일 주소"
                  disabled={busy}
                />
                <Input
                  label="새 비밀번호"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  disabled={busy}
                />
                <Input
                  label="비밀번호 확인"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  disabled={busy}
                />
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={changePassword}
                  loading={busy}
                  disabled={!supabase || !emailInput || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full"
                >
                  비밀번호 변경하기
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  disabled={busy}
                  className="w-full"
                >
                  로그인으로 돌아가기
                </Button>
              </div>
            </>
          )}

          {!sessionReady && error && (
            <Button
              variant="primary"
              onClick={() => router.push('/forgot-password')}
              className="w-full"
            >
              비밀번호 재설정 다시 요청하기
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p>로딩 중...</p>
      </main>
    }>
      <ResetPasswordInner />
    </Suspense>
  )
}
