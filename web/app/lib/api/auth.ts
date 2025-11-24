/**
 * 인증 관련 API 메서드
 * Supabase Auth를 직접 사용하므로 클라이언트 사이드에서만 사용 가능
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  redirectTo?: string
}

export interface ResetPasswordOptions {
  email: string
  redirectTo?: string
}

export interface SessionTokens {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

export interface UserProfile {
  id: string
  approved?: boolean
  name?: string | null
  email?: string | null
}

/**
 * Supabase 클라이언트를 받아서 인증 API를 제공하는 함수
 */
export function createAuthApi(supabase: SupabaseClient) {
  return {
    /**
     * 로그인
     */
    async login(credentials: LoginCredentials) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      })

      if (error) {
        throw new Error(
          error.message.toLowerCase().includes('missing')
            ? '이메일과 비밀번호를 입력하세요.'
            : error.message
        )
      }

      if (!data?.user || !data?.session) {
        throw new Error('세션 정보를 찾을 수 없습니다.')
      }

      return {
        user: data.user,
        session: data.session,
      }
    },

    /**
     * 회원가입
     */
    async signup(credentials: SignupCredentials) {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectTo = credentials.redirectTo || `${origin}/auth/callback`

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email.trim(),
        password: credentials.password,
        options: {
          emailRedirectTo: redirectTo,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return {
        user: data.user,
        session: data.session,
      }
    },

    /**
     * 비밀번호 재설정
     */
    async resetPassword(options: ResetPasswordOptions) {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectTo = options.redirectTo || `${origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(options.email.trim(), {
        redirectTo,
      })

      if (error) {
        throw new Error(error.message)
      }
    },

    /**
     * 승인 상태 확인
     */
    async checkApproval(userId: string): Promise<UserProfile | null> {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, approved, email_verified')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },

    /**
     * 현재 사용자 프로필 가져오기
     */
    async getCurrentUserProfile(): Promise<UserProfile | null> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('users')
        .select('id, approved, name, email')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },

    /**
     * 세션 설정 (쿠키에 저장)
     */
    async setSession(tokens: SessionTokens, remember: boolean = false) {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          remember,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || '세션 설정에 실패했습니다.')
      }

      return { ok: true }
    },

    /**
     * 프로필 생성/확인
     */
    async ensureProfile() {
      const response = await fetch('/api/user/ensure', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || '프로필 생성에 실패했습니다.')
      }

      return { ok: true }
    },

    /**
     * 로그아웃
     */
    async logout() {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
    },
  }
}

/**
 * 기본 인증 API 인스턴스 생성 헬퍼
 * 클라이언트 컴포넌트에서 Supabase 클라이언트를 생성하여 사용
 */
export async function getAuthApi() {
  if (typeof window === 'undefined') {
    throw new Error('인증 API는 클라이언트 사이드에서만 사용할 수 있습니다.')
  }

  const { getEnv } = await import('@/app/lib/env')

  // 환경변수는 빌드 타임에 검증되므로 안전하게 사용 가능
  let supabaseUrl = getEnv.supabaseUrl()
  let supabaseAnonKey = getEnv.supabaseAnonKey()

  // fallback: meta 태그에서 읽기 (클라이언트 사이드에서만)
  if ((!supabaseUrl || !supabaseAnonKey) && typeof document !== 'undefined') {
    const mUrl = document.querySelector('meta[name="x-supabase-url"]') as HTMLMetaElement | null
    const mAnon = document.querySelector('meta[name="x-supabase-anon"]') as HTMLMetaElement | null
    supabaseUrl = supabaseUrl || (mUrl?.content || '')
    supabaseAnonKey = supabaseAnonKey || (mAnon?.content || '')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  // 브라우저 클라이언트 생성 함수 사용 (일관된 설정 적용)
  const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
  const supabase = createSupabaseBrowserClient()

  return createAuthApi(supabase)
}

