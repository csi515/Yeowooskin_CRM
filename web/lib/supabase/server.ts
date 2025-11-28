import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getEnv } from '@/app/lib/env'

/**
 * 서버 사이드용 Supabase 클라이언트 생성
 * Server Components, Server Actions, API Routes에서 사용 가능
 * 
 * 중요: 서버 사이드에서는 getUser()를 사용하여 토큰을 검증해야 합니다.
 * getSession()은 쿠키에서 직접 읽어서 검증되지 않을 수 있습니다.
 */
export function createSupabaseServerClient() {
  const url = getEnv.supabaseUrl()
  const anon = getEnv.supabaseAnonKey()

  if (!url || !anon) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  // 쿠키에서 토큰 가져오기
  const cookieStore = cookies()
  const accessToken = cookieStore.get('sb:token')?.value || cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb:refresh')?.value

  const supabase = createClient(url, anon, {
    auth: {
      persistSession: false, // 서버에서는 세션을 저장하지 않음
      autoRefreshToken: false, // 서버에서는 자동 갱신하지 않음 (클라이언트에서 처리)
      detectSessionInUrl: false,
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    }
  })

  // refresh token이 있으면 세션 복원 시도
  if (refreshToken && !accessToken) {
    // refresh token으로 새 access token 발급 시도
    // 주의: 이는 비동기 작업이므로 즉시 반환되는 클라이언트에서는 사용하지 않음
    // 대신 클라이언트에서 refresh API를 호출하도록 함
  }

  return supabase
}

/**
 * 서버 사이드에서 사용자 정보를 안전하게 가져오기
 * getUser()는 Supabase 서버에 요청하여 토큰을 검증합니다.
 * getSession()보다 안전하지만 네트워크 요청이 필요합니다.
 */
export async function getServerUser() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    // 토큰이 만료되었거나 유효하지 않은 경우
    if (error.message.includes('expired') || error.message.includes('invalid')) {
      return { user: null, error: 'TOKEN_EXPIRED' as const }
    }
    return { user: null, error: error.message }
  }

  return { user, error: null }
}
