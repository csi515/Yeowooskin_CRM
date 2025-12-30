'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Loader2, Shield } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  // 비밀번호 강도 검증
  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    score = Object.values(checks).filter(Boolean).length

    if (score <= 2) return { level: 'weak', color: 'error', label: '약함' }
    if (score <= 3) return { level: 'medium', color: 'warning', label: '보통' }
    return { level: 'strong', color: 'success', label: '강함' }
  }

  // 이메일 유효성 검증
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const changePassword = async () => {
    if (!supabase) return

    if (!emailInput.trim()) {
      setError('아이디(이메일)를 입력해주세요.')
      return
    }

    if (!isValidEmail(emailInput.trim())) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return
    }

    if (sessionUserEmail && emailInput.trim() !== sessionUserEmail) {
      setError('입력한 이메일이 현재 인증된 계정과 일치하지 않습니다.')
      return
    }

    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    const strength = getPasswordStrength(newPassword)
    if (strength.level === 'weak') {
      setError('비밀번호가 너무 약합니다. 대문자, 소문자, 숫자, 특수문자를 포함해주세요.')
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
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">링크 확인 중</h2>
            <p className="text-neutral-600 mt-1">비밀번호 재설정 링크의 유효성을 확인하고 있습니다...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-xl p-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">비밀번호 재설정</h1>
            <p className="text-sm text-neutral-600 mt-2">안전한 새 비밀번호를 설정해주세요.</p>
          </div>

          {error && (
            <Alert variant="error" title="오류" description={error} />
          )}
          {info && (
            <Alert variant="success" title="성공" description={info} />
          )}

          {sessionReady && (
            <>
              <div className="space-y-5">
                <div>
                  <Input
                    label="아이디 (이메일)"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="가입된 이메일 주소"
                    disabled={busy}
                  />
                  {emailInput && !isValidEmail(emailInput) && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      올바른 이메일 형식을 입력해주세요
                    </p>
                  )}
                  {emailInput && isValidEmail(emailInput) && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      올바른 이메일 형식입니다
                    </p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Input
                      label="새 비밀번호"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="대문자, 소문자, 숫자, 특수문자 포함 8자 이상"
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                      disabled={busy}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 비밀번호 강도 표시 */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">비밀번호 강도</span>
                        <span className={`text-xs font-medium ${
                          getPasswordStrength(newPassword).level === 'strong' ? 'text-green-600' :
                          getPasswordStrength(newPassword).level === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {getPasswordStrength(newPassword).label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full ${
                              level <= (getPasswordStrength(newPassword).level === 'strong' ? 5 :
                                       getPasswordStrength(newPassword).level === 'medium' ? 3 : 1)
                                ? (getPasswordStrength(newPassword).level === 'strong' ? 'bg-green-500' :
                                   getPasswordStrength(newPassword).level === 'medium' ? 'bg-yellow-500' :
                                   'bg-red-500')
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Input
                      label="비밀번호 확인"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="비밀번호를 다시 입력하세요"
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                      disabled={busy}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 비밀번호 일치 표시 */}
                  {confirmPassword && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${
                      newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {newPassword === confirmPassword ?
                        <><CheckCircle className="w-3 h-3" /> 비밀번호가 일치합니다</> :
                        <><XCircle className="w-3 h-3" /> 비밀번호가 일치하지 않습니다</>
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="primary"
                  onClick={changePassword}
                  loading={busy}
                  disabled={
                    !supabase ||
                    !emailInput.trim() ||
                    !isValidEmail(emailInput.trim()) ||
                    newPassword.length < 8 ||
                    getPasswordStrength(newPassword).level === 'weak' ||
                    newPassword !== confirmPassword
                  }
                  className="w-full h-12 text-base font-semibold"
                >
                  {busy ? '비밀번호 변경 중...' : '비밀번호 변경하기'}
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
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">링크가 유효하지 않습니다</h3>
                <p className="text-sm text-gray-600 mt-1">
                  비밀번호 재설정 링크가 만료되었거나 이미 사용되었습니다.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/forgot-password')}
                className="w-full"
              >
                비밀번호 재설정 다시 요청하기
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <p className="text-gray-600">페이지 로딩 중...</p>
        </div>
      </main>
    }>
      <ResetPasswordInner />
    </Suspense>
  )
}
