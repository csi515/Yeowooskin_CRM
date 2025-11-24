/**
 * 환경 변수 검증 및 타입 안전한 접근
 */

type EnvSchema = {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  NEXT_PUBLIC_SITE_URL?: string
}

/**
 * 환경 변수 검증
 * 빌드 시점에 필수 환경 변수가 없으면 에러 발생
 */
export function validateEnv(): EnvSchema {
  const required: (keyof EnvSchema)[] = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const missing: string[] = []
  const env: Partial<EnvSchema> = {}

  for (const key of required) {
    const value = process.env[key]
    if (!value) {
      missing.push(key)
    } else {
      env[key] = value
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file or Vercel environment variables.'
    )
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY!,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '',
  }
}

/**
 * 타입 안전한 환경 변수 접근
 * 클라이언트 사이드에서 사용 가능한 공개 환경 변수만 반환
 */
export function getPublicEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
  }
}

/**
 * 서버 사이드 전용 환경 변수 접근
 */
export function getServerEnv() {
  return {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  }
}

// 빌드 시점에 환경 변수 검증 (서버 사이드만)
if (typeof window === 'undefined') {
  try {
    validateEnv()
  } catch (error) {
    // 개발 환경에서는 경고만 출력
    if (process.env.NODE_ENV === 'development') {
      console.warn('Environment validation warning:', error)
    } else {
      // 프로덕션에서는 에러 발생
      throw error
    }
  }
}

