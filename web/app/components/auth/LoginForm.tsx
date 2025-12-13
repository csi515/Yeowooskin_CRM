'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/app/components/ui/Modal'
import Alert from '@/app/components/ui/Alert'
import { useAppToast } from '@/app/lib/ui/toast'

export default function LoginForm() {
    const router = useRouter()
    const params = useSearchParams()
    const redirect = params.get('redirect') || '/dashboard'

    const [authApi, setAuthApi] = useState<Awaited<ReturnType<typeof import('@/app/lib/api/auth').getAuthApi>> | null>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [info, setInfo] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [remember, setRemember] = useState(true)
    const [infoModalOpen, setInfoModalOpen] = useState(false)
    const toast = useAppToast()

    useEffect(() => {
        const init = async () => {
            if (typeof window === 'undefined') return
            try {
                const { getAuthApi } = await import('@/app/lib/api/auth')
                const api = await getAuthApi()
                setAuthApi(api)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Supabase 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.'
                setError(errorMessage)
            }
        }
        init()
    }, [])

    const signIn = async () => {
        if (!authApi) { setError('환경설정 오류: 인증 API 초기화에 실패했습니다.'); return }
        const trimmedEmail = email.trim()
        const isEmailValid = /.+@.+\..+/.test(trimmedEmail)
        const isPwValid = password.length >= 6
        if (!isEmailValid || !isPwValid) {
            setError(!isEmailValid ? '유효한 이메일을 입력하세요.' : '비밀번호는 6자 이상이어야 합니다.')
            return
        }
        setError(''); setInfo(''); setBusy(true)
        try {
            const { user, session } = await authApi.login({ email: trimmedEmail, password })

            // 프로필 생성/확인
            try {
                await authApi.ensureProfile()
            } catch {
                // 프로필 생성 실패는 무시 (이미 존재할 수 있음)
            }

            // 승인 여부 확인
            const profile = await authApi.checkApproval(user.id)
            if (!profile?.approved) {
                await authApi.logout()
                setError('관리자 승인 후 로그인할 수 있습니다.')
                setBusy(false)
                return
            }

            // 세션 토큰을 쿠키에 저장하여 미들웨어 통과 보장
            await authApi.setSession(
                {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    expires_in: session.expires_in,
                },
                remember
            )

            // 마지막 로그인 이메일 저장
            localStorage.setItem('lastLoginEmail', trimmedEmail)

            toast.success('로그인 성공')
            router.push(redirect || '/dashboard')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.'
            setError(errorMessage)
        } finally {
            setBusy(false)
        }
    }

    const isEmailInvalid = !!email && !/.+@.+\..+/.test(email)
    const isPasswordInvalid = !!password && password.length < 6
    const canSubmit = !busy && /.+@.+\..+/.test(email.trim()) && password.length >= 6

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <Image
                src="/illustrations/welcome.svg"
                alt=""
                width={160}
                height={160}
                className="pointer-events-none select-none absolute -top-6 right-4 opacity-70 hidden md:block"
                priority
            />
            <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-lg p-7">
                <div className="space-y-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold mb-1">여우스킨 · 로그인</h1>
                        <p className="text-sm text-neutral-500">CRM에 접속하려면 계정 정보를 입력하세요.</p>
                    </div>

                    {error && (
                        <Alert variant="error" title={error} />
                    )}
                    {info && (
                        <Alert variant="success" title={info} />
                    )}

                    <div className="space-y-4">
                        <div>
                            <Input
                                label="이메일"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoFocus
                                {...(isEmailInvalid ? { error: '유효한 이메일을 입력하세요.' } : {})}
                                leftIcon={<Mail className="h-5 w-5 text-neutral-400" />}
                            />
                        </div>

                        <div>
                            <Input
                                label="비밀번호"
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호"
                                onKeyDown={(e) => { if (e.key === 'Enter') signIn() }}
                                {...(isPasswordInvalid ? { error: '비밀번호는 6자 이상이어야 합니다.' } : {})}
                                leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(v => !v)}
                                        aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                                        className="p-1 hover:bg-neutral-100 rounded-md transition-colors"
                                    >
                                        {showPw ? <EyeOff className="h-5 w-5 text-neutral-400" /> : <Eye className="h-5 w-5 text-neutral-400" />}
                                    </button>
                                }
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-300 text-action-blue-600 focus:ring-action-blue-500"
                            />
                            <span className="text-sm text-neutral-700">로그인 유지</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => router.push('/forgot-password')}
                            disabled={busy}
                            className="text-sm text-action-blue-600 hover:text-action-blue-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            비밀번호를 잊으셨나요?
                        </button>
                    </div>

                    <Button
                        variant="primary"
                        onClick={signIn}
                        loading={busy}
                        disabled={!canSubmit}
                        className="w-full"
                    >
                        로그인
                    </Button>

                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/signup')}
                            disabled={busy}
                            className="w-full"
                        >
                            회원가입
                        </Button>
                        <button
                            type="button"
                            onClick={() => setInfoModalOpen(true)}
                            className="w-full text-sm text-action-blue-600 hover:text-action-blue-700 hover:underline"
                        >
                            회원가입 절차는 어떻게 되나요?
                        </button>
                    </div>
                </div>
            </div>

            <Modal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} size="md">
                <ModalHeader title="회원가입 절차 안내" />
                <ModalBody>
                    <div className="space-y-3">
                        <p className="text-base">1) 이름/전화번호/이메일/비밀번호/생년월일을 입력하여 회원가입</p>
                        <p className="text-base">2) 관리자가 승인하면 로그인 가능 상태로 전환</p>
                        <p className="text-base">3) 승인 완료 후 로그인하여 서비스를 이용하세요</p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setInfoModalOpen(false)}>닫기</Button>
                    <Button variant="primary" onClick={() => { setInfoModalOpen(false); router.push('/signup') }}>지금 회원가입</Button>
                </ModalFooter>
            </Modal>

        </div>
    )
}
