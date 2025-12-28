'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import Alert from '@/app/components/ui/Alert'

export default function SignupPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [name, setName] = useState('')
  const [branchName, setBranchName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthdate, setBirthdate] = useState('')
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

  const canSubmit =
    !!name.trim() &&
    !!branchName.trim() &&
    !!phone.trim() &&
    /.+@.+\..+/.test(email.trim()) &&
    password.length >= 6 &&
    !!birthdate

  const submit = async () => {
    if (!supabase) { setError('환경설정 오류: Supabase 초기화 실패'); return }
    if (!canSubmit) return
    setError(''); setInfo(''); setBusy(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, branch_name: branchName, phone, birthdate }
          // emailRedirectTo를 제거하여 이메일 확인 비활성화
        }
      })
      if (error) { setError(error.message); setBusy(false); return }
      setInfo('회원가입이 완료되었습니다. 관리자 승인 후 로그인하여 서비스를 이용하세요.')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '회원가입 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-lg p-7">
        <div className="flex flex-col space-y-5">
          <h1 className="text-2xl font-semibold">회원가입</h1>
          <p className="text-sm text-neutral-600">이름, 지점명, 전화번호, 이메일, 비밀번호, 생년월일을 입력하세요.</p>

          {error && (
            <Alert variant="error" title={error} />
          )}
          {info && (
            <Alert variant="success" title={info} />
          )}

          <div className="flex flex-col space-y-4">
            <Input
              label="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              required
              {...((!name.trim() && !!name) ? { error: '이름을 입력하세요.' } : {})}
            />

            <Input
              label="지점명"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="강남점"
              required
              {...((!branchName.trim() && !!branchName) ? { error: '지점명을 입력하세요.' } : {})}
            />

            <Input
              label="전화번호"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              required
              {...((!phone.trim() && !!phone) ? { error: '전화번호를 입력하세요.' } : {})}
            />

            <Input
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              {...((!!email && !/.+@.+\..+/.test(email)) ? { error: '유효한 이메일을 입력하세요.' } : {})}
            />

            <Input
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
              {...((!!password && password.length < 6) ? { error: '비밀번호는 6자 이상이어야 합니다.' } : {})}
            />

            <Input
              label="생년월일"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
              {...((!birthdate && !!birthdate) ? { error: '생년월일을 선택하세요.' } : {})}
            />
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              variant="primary"
              onClick={submit}
              loading={busy}
              disabled={!canSubmit || busy || !supabase}
              className="w-full relative z-10"
              style={{
                position: 'relative',
                zIndex: 10,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              회원가입하기
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="w-full relative z-10"
              style={{
                position: 'relative',
                zIndex: 10,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              로그인으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
