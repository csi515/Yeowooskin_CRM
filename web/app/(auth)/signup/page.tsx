'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import Alert from '@/app/components/ui/Alert'

type UserRole = 'HQ' | 'OWNER' | 'STAFF'

export default function SignupPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [branchCode, setBranchCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchAddress, setNewBranchAddress] = useState('')
  const [newBranchPhone, setNewBranchPhone] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'role' | 'details'>('role')

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

  // 역할 선택 단계 검증
  const canProceedFromRole = role !== ''

  // 세부 정보 단계 검증
  const canSubmit = step === 'details' && !!(
    name.trim() &&
    phone.trim() &&
    /.+@.+\..+/.test(email.trim()) &&
    password.length >= 6 &&
    (
      role === 'HQ' ||
      (role === 'OWNER' && branchCode.trim()) ||
      (role === 'STAFF' && branchCode.trim() && inviteCode.trim())
    ) &&
    (
      role !== 'HQ' ||
      (role === 'HQ' && newBranchName.trim())
    )
  )

  const proceedToDetails = () => {
    if (canProceedFromRole) {
      setStep('details')
      setError('')
    }
  }

  const goBackToRole = () => {
    setStep('role')
    setError('')
    setInfo('')
  }

  const submit = async () => {
    if (!supabase) { setError('환경설정 오류: Supabase 초기화 실패'); return }
    if (!canSubmit) return

    setError('')
    setInfo('')
    setBusy(true)

    try {
      // Supabase Auth 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role,
            invite_code: role === 'STAFF' ? inviteCode : null
          }
        }
      })

      if (authError) {
        setError(authError.message)
        setBusy(false)
        return
      }

      if (!authData.user) {
        setError('회원가입 처리 중 오류가 발생했습니다.')
        setBusy(false)
        return
      }

      // 프로필 및 지점 데이터 생성
      if (role === 'HQ' && newBranchName.trim()) {
        // HQ의 경우 프로필 생성 및 새 지점 생성
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            name,
            phone,
            role: 'HQ',
            approved: false // HQ도 승인 필요
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          setError('프로필 생성 중 오류가 발생했습니다.')
          setBusy(false)
          return
        }

        // 지점 생성
        const { error: branchError } = await supabase
          .from('branches')
          .insert({
            code: `HQ_${Date.now()}`, // 임시 코드
            name: newBranchName,
            address: newBranchAddress || null,
            phone: newBranchPhone || null,
            created_by: authData.user.id
          })

        if (branchError) {
          console.error('Branch creation error:', branchError)
          setError('지점 생성 중 오류가 발생했습니다.')
          setBusy(false)
          return
        }

      } else if (role === 'OWNER') {
        // Owner의 경우 초대 코드 검증 및 프로필 생성
        const { data: branch, error: branchError } = await supabase
          .from('branches')
          .select('id')
          .eq('code', branchCode.trim())
          .single()

        if (branchError || !branch) {
          setError('유효하지 않은 지점 코드입니다.')
          setBusy(false)
          return
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            name,
            phone,
            role: 'OWNER',
            branch_id: branch.id,
            approved: false // Owner는 승인 필요
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          setError('프로필 생성 중 오류가 발생했습니다.')
          setBusy(false)
          return
        }

      } else if (role === 'STAFF') {
        // Staff의 경우 초대 코드 검증
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .select('*, branches(*)')
          .eq('invite_code', inviteCode.trim())
          .eq('email', email)
          .gt('expires_at', new Date().toISOString())
          .is('used_at', null)
          .single()

        if (inviteError || !invitation) {
          setError('유효하지 않은 초대 코드입니다.')
          setBusy(false)
          return
        }

        // 초대 코드 사용 처리
        const { error: updateInviteError } = await supabase
          .from('invitations')
          .update({
            used_at: new Date().toISOString(),
            used_by: authData.user.id
          })
          .eq('id', invitation.id)

        if (updateInviteError) {
          console.error('Invitation update error:', updateInviteError)
        }

        // 프로필 생성
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            name,
            phone,
            role: 'STAFF',
            branch_id: invitation.branch_id,
            invite_code: inviteCode,
            approved: false // Staff도 승인 필요
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          setError('프로필 생성 중 오류가 발생했습니다.')
          setBusy(false)
          return
        }
      }

      setInfo(`${role === 'HQ' ? '본사' : role === 'OWNER' ? '점주' : '직원'} 회원가입이 완료되었습니다. 이메일 인증 후 관리자 승인을 기다려주세요.`)
      setTimeout(() => router.push('/login'), 3000)

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
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold">
            {step === 'role' ? '회원가입 - 역할 선택' : '회원가입 - 정보 입력'}
          </h1>

          {error && (
            <Alert variant="error" title={error} />
          )}
          {info && (
            <Alert variant="success" title={info} />
          )}

          {step === 'role' ? (
            // 역할 선택 단계
            <>
              <p className="text-sm text-neutral-600">어떤 역할로 가입하시겠습니까?</p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setRole('HQ')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    role === 'HQ'
                      ? 'border-[#F472B6] bg-[#FDF2F8] text-[#F472B6]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="font-medium">본사 (HQ)</div>
                  <div className="text-sm text-neutral-600 mt-1">
                    프랜차이즈 본사 운영자 - 모든 지점 관리 및 신규 지점 생성 가능
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('OWNER')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    role === 'OWNER'
                      ? 'border-[#F472B6] bg-[#FDF2F8] text-[#F472B6]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="font-medium">점주 (Owner)</div>
                  <div className="text-sm text-neutral-600 mt-1">
                    매장 점주 - 본인 지점 운영 및 직원 관리 가능
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    role === 'STAFF'
                      ? 'border-[#F472B6] bg-[#FDF2F8] text-[#F472B6]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="font-medium">직원 (Staff)</div>
                  <div className="text-sm text-neutral-600 mt-1">
                    매장 직원 - 고객 관리 및 예약 업무 담당
                  </div>
                </button>
              </div>

              <Button
                variant="primary"
                onClick={proceedToDetails}
                disabled={!canProceedFromRole}
                className="w-full"
              >
                다음 단계로
              </Button>
            </>
          ) : (
            // 세부 정보 입력 단계
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={goBackToRole}
                  className="text-neutral-500 hover:text-neutral-700 p-1"
                  disabled={busy}
                >
                  ←
                </button>
                <span className="text-sm text-neutral-600">
                  {role === 'HQ' ? '본사' : role === 'OWNER' ? '점주' : '직원'} 정보 입력
                </span>
              </div>

              <div className="space-y-4">
                <Input
                  label="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  required
                  disabled={busy}
                />

                <Input
                  label="전화번호"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  required
                  disabled={busy}
                />

                <Input
                  label="이메일"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={busy}
                />

                <Input
                  label="비밀번호"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상"
                  required
                  disabled={busy}
                  helpText="비밀번호는 6자 이상이어야 합니다."
                />

                {role === 'OWNER' && (
                  <Input
                    label="지점 코드"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="지점 코드를 입력하세요"
                    required
                    disabled={busy}
                    helpText="본사에서 제공받은 지점 코드를 입력하세요."
                  />
                )}

                {role === 'STAFF' && (
                  <>
                    <Input
                      label="지점 코드"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      placeholder="지점 코드를 입력하세요"
                      required
                      disabled={busy}
                    />

                    <Input
                      label="초대 코드"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="초대 코드를 입력하세요"
                      required
                      disabled={busy}
                      helpText="점주로부터 받은 초대 코드를 입력하세요."
                    />
                  </>
                )}

                {role === 'HQ' && (
                  <div className="space-y-3 border-t border-neutral-200 pt-4">
                    <h3 className="font-medium text-neutral-900">새 지점 생성</h3>

                    <Input
                      label="지점명"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="지점명을 입력하세요"
                      required
                      disabled={busy}
                    />

                    <Input
                      label="지점 주소"
                      value={newBranchAddress}
                      onChange={(e) => setNewBranchAddress(e.target.value)}
                      placeholder="지점 주소를 입력하세요"
                      disabled={busy}
                    />

                    <Input
                      label="지점 전화번호"
                      value={newBranchPhone}
                      onChange={(e) => setNewBranchPhone(e.target.value)}
                      placeholder="지점 전화번호를 입력하세요"
                      disabled={busy}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={submit}
                  loading={busy}
                  disabled={!canSubmit || busy || !supabase}
                  className="w-full"
                >
                  {role === 'HQ' ? '본사 계정 생성' : role === 'OWNER' ? '점주 계정 생성' : '직원 계정 생성'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  className="w-full"
                  disabled={busy}
                >
                  로그인으로 돌아가기
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
