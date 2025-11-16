import { createClient } from '@supabase/supabase-js'
import { getEnv } from '@/app/lib/env'

/**
 * 브라우저 클라이언트용 Supabase 클라이언트 생성
 * 클라이언트 컴포넌트에서만 사용 가능
 * 
 * JWT 자동 갱신 설정:
 * - persistSession: true - localStorage에 세션 저장
 * - autoRefreshToken: true - 토큰 만료 전 자동 갱신
 * - detectSessionInUrl: true - URL에서 세션 감지 (OAuth 콜백 등)
 */
export function createSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('createSupabaseBrowserClient()는 클라이언트 사이드에서만 사용할 수 있습니다.')
  }
  
  const url = getEnv.supabaseUrl()
  const anon = getEnv.supabaseAnonKey()
  
  if (!url || !anon) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }
  
  const supabase = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce', // PKCE 플로우 사용 (보안 강화)
    },
  })

  return supabase
}
