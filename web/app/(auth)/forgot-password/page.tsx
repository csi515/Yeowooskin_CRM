'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Button, FormControl, FormErrorMessage, FormLabel,
  Heading, Input, VStack, Alert, AlertIcon, Text, HStack
} from '@chakra-ui/react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)
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
        redirectTo: `${siteUrl}/(auth)/update-password`
      })
      if (error) { setError(error.message); setBusy(false); return }
      setInfo('비밀번호 재설정 이메일을 확인해 주세요.')
    } catch (e: any) {
      setError(e?.message || '요청 처리 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--neutral-50)] px-4">
      <Box w="full" maxW="md" bg="whiteAlpha.900" borderWidth="1px" borderColor="blackAlpha.100" rounded="2xl" shadow="lg" p={7}>
        <VStack spacing={5} align="stretch">
          <Heading size="md">비밀번호 재설정</Heading>
          <Text fontSize="sm" color="gray.600">계정 이메일을 입력하면 재설정 링크를 보내드립니다.</Text>

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
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <FormErrorMessage>유효한 이메일을 입력하세요.</FormErrorMessage>
          </FormControl>

          <VStack spacing={3} align="stretch">
            <Button colorScheme="brand" onClick={submit} isLoading={busy} isDisabled={busy || !/.+@.+\..+/.test(email.trim()) || !supabase}>재설정 메일 보내기</Button>
            <Button variant="ghost" onClick={() => router.push('/login')}>로그인으로 돌아가기</Button>
          </VStack>
        </VStack>
      </Box>
    </main>
  )
}


