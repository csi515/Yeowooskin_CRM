'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'

export default function SignupPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)
  const [name, setName] = useState('')
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
          data: { name, phone, birthdate }
          // emailRedirectTo를 제거하여 이메일 확인 비활성화
        }
      })
      if (error) { setError(error.message); setBusy(false); return }
      setInfo('회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.')
    } catch (e: any) {
      setError(e?.message || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--neutral-50)] px-4">
      <Box w="full" maxW="md" bg="whiteAlpha.900" borderWidth="1px" borderColor="blackAlpha.100" rounded="2xl" shadow="lg" p={7}>
        <VStack spacing={5} align="stretch">
          <Heading size="md">회원가입</Heading>
          <Text fontSize="sm" color="gray.600">이름, 전화번호, 이메일, 비밀번호, 생년월일을 입력하세요.</Text>

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

          <FormControl isInvalid={!name.trim() && !!name}>
            <FormLabel>이름</FormLabel>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" />
            <FormErrorMessage>이름을 입력하세요.</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!phone.trim() && !!phone}>
            <FormLabel>전화번호</FormLabel>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-1234-5678" />
            <FormErrorMessage>전화번호를 입력하세요.</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!email && !/.+@.+\..+/.test(email)}>
            <FormLabel>이메일</FormLabel>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <FormErrorMessage>유효한 이메일을 입력하세요.</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!password && password.length < 6}>
            <FormLabel>비밀번호</FormLabel>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6자 이상" />
            <FormErrorMessage>비밀번호는 6자 이상이어야 합니다.</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!birthdate && !!birthdate}>
            <FormLabel>생년월일</FormLabel>
            <Input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
            <FormErrorMessage>생년월일을 선택하세요.</FormErrorMessage>
          </FormControl>

          <VStack spacing={3} align="stretch">
            <Button colorScheme="brand" onClick={submit} isLoading={busy} isDisabled={!canSubmit || busy || !supabase}>회원가입하기</Button>
            <Button variant="ghost" onClick={() => router.push('/login')}>로그인으로 돌아가기</Button>
          </VStack>
        </VStack>
      </Box>
    </main>
  )
}


