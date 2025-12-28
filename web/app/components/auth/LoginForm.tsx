'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link' // MUI Link for styling, or next/link for routing
import NextLink from 'next/link'

import Button from '@/app/components/ui/Button' // Still using our wrapper for consistency if desired, or switch to MUI Button
import Input from '@/app/components/ui/Input'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/app/components/ui/Modal'
import Alert from '@/app/components/ui/Alert'
import { useAppToast } from '@/app/lib/ui/toast'
import { useTheme } from '@mui/material/styles'

export default function LoginForm() {
    const router = useRouter()
    const params = useSearchParams()
    const redirect = params.get('redirect') || '/dashboard'
    const theme = useTheme()

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
            const { session } = await authApi.login({ email: trimmedEmail, password })

            try {
                await authApi.ensureProfile()
            } catch {
                // Ignore
            }

            // 승인 체크 제거 - 모든 사용자는 회원가입 시 자동 승인됨

            await authApi.setSession(
                {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    expires_in: session.expires_in,
                },
                remember
            )

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

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 2,
                position: 'relative'
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: -24,
                    right: 16,
                    opacity: 0.7,
                    display: { xs: 'none', md: 'block' },
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}
            >
                {/* Image handling - using next/image in Box requires distinct layout or wrapper */}
                {/* For simplicity we keep it or replace with styled Box */}
                <Image
                    src="/illustrations/welcome.svg"
                    alt=""
                    width={160}
                    height={160}
                    priority
                />
            </Box>

            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    maxWidth: 440,
                    p: 4,
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.palette.divider}`
                }}
            >
                <Stack spacing={3}>
                    <Box textAlign="center">
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            BeautyHub · 로그인
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            CRM에 접속하려면 계정 정보를 입력하세요.
                        </Typography>
                    </Box>

                    {error && (
                        <Alert variant="error" title={error} />
                    )}
                    {info && (
                        <Alert variant="success" title={info} />
                    )}

                    <Stack spacing={2}>
                        <Input
                            label="이메일"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoFocus
                            {...(isEmailInvalid ? { error: '유효한 이메일을 입력하세요.' } : {})}
                            leftIcon={<Mail size={20} className="text-neutral-400" />}
                        />

                        <Input
                            label="비밀번호"
                            type={showPw ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호"
                            onKeyDown={(e) => { if (e.key === 'Enter') signIn() }}
                            {...(isPasswordInvalid ? { error: '비밀번호는 6자 이상이어야 합니다.' } : {})}
                            leftIcon={<Lock size={20} className="text-neutral-400" />}
                            rightIcon={
                                <IconButton
                                    onClick={() => setShowPw(v => !v)}
                                    aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                                    edge="end"
                                    size="small"
                                >
                                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                                </IconButton>
                            }
                        />
                    </Stack>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2">로그인 유지</Typography>}
                        />
                        <Link
                            component={NextLink}
                            href="/forgot-password"
                            variant="body2"
                            underline="hover"
                            color="primary"
                            sx={{ cursor: 'pointer' }}
                        >
                            비밀번호를 잊으셨나요?
                        </Link>
                    </Box>

                    <Stack spacing={1.5}>
                        <Button
                            variant="primary"
                            onClick={signIn}
                            loading={busy}
                            disabled={busy}
                            fullWidth
                            size="lg"
                        >
                            로그인
                        </Button>
                    </Stack>

                    <Stack spacing={1} sx={{ pt: 1 }}>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/')}
                            disabled={busy}
                            fullWidth
                        >
                            홈으로
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/signup')}
                            disabled={busy}
                            fullWidth
                        >
                            회원가입
                        </Button>
                        <Typography variant="body2" align="center">
                            <Link
                                component="button"
                                variant="body2"
                                onClick={() => setInfoModalOpen(true)}
                                underline="hover"
                                color="primary"
                            >
                                회원가입 절차는 어떻게 되나요?
                            </Link>
                        </Typography>
                    </Stack>
                </Stack>
            </Paper>

            <Modal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} size="md">
                <ModalHeader title="회원가입 절차 안내" onClose={() => setInfoModalOpen(false)} />
                <ModalBody>
                    <Stack spacing={1.5}>
                        <Typography>1) 이름/전화번호/이메일/비밀번호/생년월일을 입력하여 회원가입</Typography>
                        <Typography>2) 이메일로 발송된 인증 메일을 확인하여 인증 완료</Typography>
                        <Typography>3) 회원가입 완료 후 바로 로그인하여 서비스를 이용하세요</Typography>
                        <Box pt={1}>
                            <Typography variant="caption" color="text.secondary">
                                * 신규 회원가입 문의는 <Link href="mailto:csi515@naver.com" color="inherit" underline="always">csi515@naver.com</Link>으로 메일을 보내주세요.
                            </Typography>
                        </Box>
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setInfoModalOpen(false)}>닫기</Button>
                    <Button variant="primary" onClick={() => { setInfoModalOpen(false); router.push('/signup') }}>지금 회원가입</Button>
                </ModalFooter>
            </Modal>

        </Box >
    )
}
