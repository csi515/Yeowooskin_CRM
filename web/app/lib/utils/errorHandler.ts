/**
 * 통일된 에러 처리 유틸리티
 */

export interface AppError {
  message: string
  code?: string
  status?: number
  originalError?: unknown
}

/**
 * 에러를 AppError 형식으로 변환
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof Error) {
    return {
      message: error.message,
      originalError: error,
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String(error.message),
      code: 'code' in error ? String(error.code) : '',
      status: 'status' in error ? Number(error.status) : 500,
      originalError: error,
    }
  }

  return {
    message: '알 수 없는 오류가 발생했습니다.',
    originalError: error,
  }
}

/**
 * 사용자 친화적인 에러 메시지로 변환
 */
export function getUserFriendlyMessage(error: AppError): string {
  const { message, status } = error

  // 네트워크 에러
  if (message.includes('fetch') || message.includes('network') || message.includes('Network')) {
    return '네트워크 연결을 확인해주세요.'
  }

  // 인증 에러
  if (status === 401 || message.includes('unauthorized') || message.includes('인증')) {
    return '로그인이 필요합니다.'
  }

  // 권한 에러
  if (status === 403 || message.includes('forbidden') || message.includes('권한')) {
    return '접근 권한이 없습니다.'
  }

  // 서버 에러
  if (status === 500 || status === 502 || status === 503) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  // 타임아웃
  if (message.includes('timeout') || message.includes('타임아웃')) {
    return '요청 시간이 초과되었습니다. 다시 시도해주세요.'
  }

  // 기본 메시지 반환
  return message || '오류가 발생했습니다.'
}

/**
 * 에러 로깅 (개발 환경에서만 상세 로그)
 */
export function logError(context: string, error: AppError): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, {
      message: error.message,
      code: error.code,
      status: error.status,
      originalError: error.originalError,
    })
  } else {
    // 프로덕션에서는 간단한 로그만
    console.error(`[${context}]`, error.message)
  }
}

