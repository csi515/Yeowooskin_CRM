/**
 * 환경 변수 타입 정의 및 검증
 * Vercel 배포 시 빌드 타임에 검증되도록 구성
 */

/**
 * 필수 환경 변수 목록
 * 빌드 시점에 undefined가 아니어야 함
 */
const requiredEnvVars = {
  // @ts-expect-error: Next.js inlining requires dot notation
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // @ts-expect-error: Next.js inlining requires dot notation
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const

/**
 * 선택적 환경 변수 목록
 */
const optionalEnvVars = {
  // @ts-expect-error: Next.js inlining requires dot notation
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '',
  // @ts-expect-error: Next.js inlining requires dot notation
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '',
  // @ts-expect-error: Next.js inlining requires dot notation
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const

/**
 * 환경 변수 타입
 */
export interface Env {
  readonly NEXT_PUBLIC_SUPABASE_URL: string
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  readonly NEXT_PUBLIC_BASE_URL: string
  readonly NEXT_PUBLIC_SITE_URL: string
  readonly SUPABASE_SERVICE_ROLE_KEY?: string
}

/**
 * 환경 변수 검증
 */
function validateEnv(): Env {
  const missing: string[] = []

  if (!requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_BASE_URL: optionalEnvVars.NEXT_PUBLIC_BASE_URL || '',
    NEXT_PUBLIC_SITE_URL: optionalEnvVars.NEXT_PUBLIC_SITE_URL || '',
    ...(optionalEnvVars.SUPABASE_SERVICE_ROLE_KEY ? { SUPABASE_SERVICE_ROLE_KEY: optionalEnvVars.SUPABASE_SERVICE_ROLE_KEY } : {}),
  }
}

/**
 * 검증된 환경 변수
 * 빌드 타임에 검증되므로 런타임 에러 방지
 */
let cachedEnv: Env | null = null

/**
 * 환경 변수는 "import 시점"이 아니라 "접근 시점"에 검증합니다.
 * - Next.js build 과정에서 모듈이 로드되더라도 빌드가 즉시 실패하지 않도록 함
 * - 실제 런타임(요청 처리/서버 실행)에서 필요한 순간에 명확히 에러를 발생
 */
export function getValidatedEnv(): Env {
  if (cachedEnv) return cachedEnv
  cachedEnv = validateEnv()
  return cachedEnv
}

/**
 * 환경 변수 접근 헬퍼 함수
 * 서버/클라이언트 모두에서 안전하게 사용 가능
 */
export const getEnv = {
  supabaseUrl: () => getValidatedEnv().NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: () => getValidatedEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
  baseUrl: () => getValidatedEnv().NEXT_PUBLIC_BASE_URL,
  siteUrl: () => getValidatedEnv().NEXT_PUBLIC_SITE_URL,
  supabaseServiceRoleKey: () => getValidatedEnv().SUPABASE_SERVICE_ROLE_KEY,
}

/**
 * 서버 사이드에서만 사용 가능한 환경 변수 접근
 * 클라이언트에서 호출 시 undefined 반환
 */
export const getServerEnv = {
  supabaseServiceRoleKey: () => {
    if (typeof window !== 'undefined') {
      console.warn('getServerEnv.supabaseServiceRoleKey()는 서버에서만 사용 가능합니다.')
      return undefined
    }
    return getValidatedEnv().SUPABASE_SERVICE_ROLE_KEY
  },
}

