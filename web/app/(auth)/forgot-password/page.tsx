'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import Alert from '@/app/components/ui/Alert'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
        const client = createSupabaseBrowserClient()
        setSupabase(client)
      } catch (error) {
        console.error('Supabase 초기화 오류:', error)
        setError('환경설정 오류: Supabase 초기화에 실패했습니다.')
      }
    }
    init()
  }, [])

  const submit = async () => {
    if (!supabase) { setError('환경설정 오류: Supabase 초기화 실패'); return }
    if (!/.+@.+\..+/.test(email.trim())) return
    setError(''); setInfo(''); setBusy(true)
    try {
      const { getEnv } = await import('@/app/lib/env')
      const siteUrl = getEnv.siteUrl() || (typeof window !== 'undefined' ? window.location.origin : '')
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/update-password`
      })
      if (error) { setError(error.message); setBusy(false); return }
      setInfo('비밀번호 재설정 이메일을 확인해 주세요.')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '요청 처리 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setBusy(false)
    }
  }

  const isEmailInvalid = !!email && !/.+@.+\..+/.test(email)
  const canSubmit = !busy && /.+@.+\..+/.test(email.trim()) && !!supabase

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-lg p-7">
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold">비밀번호 재설정</h1>
          <p className="text-sm text-neutral-600">계정 이메일을 입력하면 재설정 링크를 보내드립니다.</p>

          {error && (
            <Alert variant="error" title={error} />
          )}
          {info && (
            <Alert variant="success" title={info} />
          )}

          <Input
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            {...(isEmailInvalid ? { error: '유효한 이메일을 입력하세요.' } : {})}
          />

          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={submit}
              loading={busy}
              disabled={!canSubmit}
              className="w-full"
            >
              재설정 메일 보내기
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              로그인으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
