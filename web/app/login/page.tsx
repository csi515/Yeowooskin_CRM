'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  useToast,
  Alert,
  AlertIcon,
  VStack,
  HStack,
} from '@chakra-ui/react'
import { EmailIcon, LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

function LoginInner() {
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
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

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

      toast({ title: '로그인 성공', status: 'success', duration: 1500, isClosable: true })
      router.push(redirect || '/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setBusy(false)
    }
  }

  const signUp = async () => {
    if (!authApi) { setError('환경설정 오류: 인증 API 초기화에 실패했습니다.'); return }
    setError(''); setInfo(''); setBusy(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      await authApi.signup({
        email,
        password,
        redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirect || '/dashboard')}`,
      })
      setInfo('회원가입 메일을 확인해주세요. 이메일 링크로 로그인 완료됩니다.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async () => {
    if (!authApi) { setError('환경설정 오류: 인증 API 초기화에 실패했습니다.'); return }
    setError(''); setInfo(''); setBusy(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      await authApi.resetPassword({
        email,
        redirectTo: `${origin}/reset-password`,
      })
      setInfo('이메일로 임시 비밀번호(링크)가 전송되었습니다.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '비밀번호 재설정 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--neutral-50)] px-4">
      <img src="/illustrations/welcome.svg" alt="" className="pointer-events-none select-none absolute -top-6 right-4 w-40 opacity-70 hidden md:block" />
      <Box w="full" maxW="md" bg="whiteAlpha.900" borderWidth="1px" borderColor="blackAlpha.100" rounded="2xl" shadow="lg" p={7}>
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="md" mb={1}>여우스킨 · 로그인</Heading>
            <Text fontSize="sm" color="gray.500">CRM에 접속하려면 계정 정보를 입력하세요.</Text>
          </Box>

          {error && (
            <Alert status="error" rounded="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          {info && (
            <Alert status="success" rounded="md">
              <AlertIcon />
              {info}
            </Alert>
          )}

          <FormControl isInvalid={!!email && !/.+@.+\..+/.test(email)}>
            <FormLabel>이메일</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <EmailIcon color="gray.400" />
              </InputLeftElement>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />
            </InputGroup>
            <FormErrorMessage>유효한 이메일을 입력하세요.</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!password && password.length < 6}>
            <FormLabel>비밀번호</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <LockIcon color="gray.400" />
              </InputLeftElement>
              <Input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호"
                onKeyDown={(e) => { if (e.key === 'Enter') signIn() }}
              />
              <InputRightElement>
                <Button size="sm" variant="ghost" onClick={() => setShowPw(v => !v)} aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}>
                  {showPw ? <ViewOffIcon /> : <ViewIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>비밀번호는 6자 이상이어야 합니다.</FormErrorMessage>
          </FormControl>

          <HStack justify="space-between">
            <Checkbox isChecked={remember} onChange={(e) => setRemember(e.target.checked)}>로그인 유지</Checkbox>
            <Button
              variant="link"
              size="sm"
              onClick={() => router.push('/forgot-password')}
              isDisabled={busy}
            >비밀번호를 잊으셨나요?</Button>
          </HStack>

          <Button
            colorScheme="brand"
            onClick={signIn}
            isLoading={busy}
            isDisabled={busy || !/.+@.+\..+/.test(email.trim()) || password.length < 6}
          >로그인</Button>

          <VStack spacing={2} align="stretch">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/signup')}
              isDisabled={busy}
            >회원가입</Button>
            <Button
              variant="link"
              size="sm"
              onClick={onOpen}
            >회원가입 절차는 어떻게 되나요?</Button>
          </VStack>
        </VStack>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>회원가입 절차 안내</ModalHeader>
          <ModalBody>
            <VStack align="start" spacing={3}>
              <Text>1) 이름/전화번호/이메일/비밀번호/생년월일을 입력하여 회원가입</Text>
              <Text>2) 관리자가 승인하면 로그인 가능 상태로 전환</Text>
              <Text>3) 승인 완료 후 로그인하여 서비스를 이용하세요</Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button onClick={onClose} variant="ghost">닫기</Button>
              <Button colorScheme="brand" onClick={() => { onClose(); router.push('/signup') }}>지금 회원가입</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-6"><p>로딩 중...</p></main>}>
      <LoginInner />
    </Suspense>
  )
}
