/**
 * 타입 안전한 API 클라이언트
 * 자동 인증 토큰 리프레시 및 통합 에러 처리 제공
 */

export interface ApiClientOptions {
  baseURL?: string
  autoRefreshToken?: boolean
  showToastOnError?: boolean
}

export interface ApiRequestOptions extends RequestInit {
  skipAuthRefresh?: boolean
}

export class ApiClient {
  private baseURL: string
  private autoRefreshToken: boolean
  private showToastOnError: boolean
  private refreshPromise: Promise<boolean> | null = null
  private refreshFailed: boolean = false // refresh 실패 플래그
  private refreshAbortController: AbortController | null = null // refresh 요청 취소용

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || ''
    this.autoRefreshToken = options.autoRefreshToken !== false
    this.showToastOnError = options.showToastOnError !== false
  }

  /**
   * JWT 토큰 디코딩 (만료 시간 확인용)
   */
  private decodeJWT(token: string): { exp?: number } | null {
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null
      const payload = parts[1]
      if (!payload) return null
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const pad = base64.length % 4 === 2 ? '==' : base64.length % 4 === 3 ? '=' : ''

      // 브라우저 환경에서는 atob 사용, Node.js 환경에서는 Buffer 사용
      let decoded: string
      if (typeof window !== 'undefined' && typeof atob !== 'undefined') {
        decoded = atob(base64 + pad)
      } else if (typeof Buffer !== 'undefined') {
        decoded = Buffer.from(base64 + pad, 'base64').toString('utf8')
      } else {
        return null
      }

      return JSON.parse(decoded)
    } catch {
      return null
    }
  }

  /**
   * 쿠키에서 토큰 가져오기 (클라이언트 사이드)
   */
  private getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if ((name === 'sb:token' || name === 'sb-access-token') && value) {
        return decodeURIComponent(value)
      }
    }
    return null
  }

  /**
   * 토큰이 곧 만료되는지 확인 (5분 전)
   */
  private isTokenExpiringSoon(token: string | null): boolean {
    if (!token) return true
    const decoded = this.decodeJWT(token)
    if (!decoded || !decoded.exp) return true

    const expirationTime = decoded.exp * 1000 // exp는 초 단위이므로 밀리초로 변환
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000 // 5분을 밀리초로

    // 만료 시간이 5분 이내면 true
    return expirationTime - now < fiveMinutes
  }

  /**
   * 인증 토큰 리프레시
   */
  private async refreshAuthToken(): Promise<boolean> {
    // 이미 refresh가 실패한 경우 재시도하지 않음
    if (this.refreshFailed) {
      return false
    }

    // 이미 진행 중인 요청이 있으면 기다림
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    // 이전 요청 취소 (있다면)
    if (this.refreshAbortController) {
      this.refreshAbortController.abort()
    }

    // 새 AbortController 생성
    this.refreshAbortController = new AbortController()

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          signal: this.refreshAbortController?.signal || null,
        })

        if (!response.ok) {
          // refresh 실패 시 플래그 설정
          this.refreshFailed = true
          return false
        }

        // 성공 시 플래그 리셋
        this.refreshFailed = false
        return true
      } catch (error) {
        // AbortError는 정상적인 취소이므로 무시
        if (error instanceof Error && error.name === 'AbortError') {
          return false
        }
        // 네트워크 에러 등으로 실패한 경우도 플래그 설정
        this.refreshFailed = true
        return false
      } finally {
        this.refreshPromise = null
        this.refreshAbortController = null
      }
    })()

    return this.refreshPromise
  }

  /**
   * 요청 실행 (자동 리프레시 포함)
   */
  private async executeRequest<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<{ data: T; response: Response }> {
    const { skipAuthRefresh, ...fetchOptions } = options

    // 인증이 필요한 요청이고 토큰 갱신이 활성화된 경우, 만료 전에 미리 갱신
    if (
      this.autoRefreshToken &&
      !skipAuthRefresh &&
      !url.includes('/api/auth/refresh') &&
      typeof document !== 'undefined'
    ) {
      const token = this.getTokenFromCookie()
      if (this.isTokenExpiringSoon(token)) {
        // 토큰이 곧 만료되면 미리 갱신 시도
        await this.refreshAuthToken()
      }
    }

    let response = await fetch(`${this.baseURL}${url}`, {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })

    // 401 에러 시 자동 토큰 리프레시
    if (
      response.status === 401 &&
      this.autoRefreshToken &&
      !skipAuthRefresh &&
      !url.includes('/api/auth/refresh') &&
      !url.includes('/api/auth/logout') &&
      !this.refreshFailed // refresh가 이미 실패한 경우 재시도하지 않음
    ) {
      const refreshed = await this.refreshAuthToken()
      if (refreshed) {
        // 리프레시 성공 시 원래 요청 재시도
        response = await fetch(`${this.baseURL}${url}`, {
          ...fetchOptions,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        })
      } else {
        // 리프레시 실패 시 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          // response.json()은 한 번만 호출 가능하므로, 여기서는 클론된 응답을 사용하거나
          // 텍스트로 읽어서 처리해야 합니다. 하지만 간단하게 리다이렉트만 수행합니다.
          window.location.href = '/login?error=expired'
          throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
        }
      }
    }

    // 응답 데이터 파싱 (안전하게 처리)
    let responseData: unknown
    try {
      const text = await response.text()
      responseData = text ? JSON.parse(text) : {}
    } catch {
      // JSON 파싱 실패 시 빈 객체 사용
      responseData = {}
    }

      // 통일된 응답 형식 처리: { success: boolean, data?: T, error?: string, errors?: Record<string, string[]> }
      if (!response.ok || (responseData && typeof responseData === 'object' && 'success' in responseData && !responseData.success)) {
        let errorMessage = '요청을 처리할 수 없습니다.'

        if (responseData && typeof responseData === 'object') {
          // 새로운 형식: { success: false, error: string, errors?: Record<string, string[]> }
          if ('error' in responseData && typeof responseData.error === 'string') {
            errorMessage = responseData.error
            // 검증 오류가 있으면 상세 정보 추가
            if ('errors' in responseData && typeof responseData.errors === 'object' && responseData.errors !== null) {
              const errors = responseData.errors as Record<string, string[]>
              const errorDetails = Object.entries(errors)
                .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                .join('; ')
              if (errorDetails) {
                errorMessage = `${errorMessage} (${errorDetails})`
              }
            }
          }
          // 기존 형식: { message: string }
          else if ('message' in responseData && typeof responseData.message === 'string') {
            errorMessage = responseData.message
          }
        }

      // 에러 로깅
      if (typeof window !== 'undefined') {
        const { logger } = await import('../utils/logger')
        logger.error(`API 요청 실패: ${url}`, {
          status: response.status,
          statusText: response.statusText,
          errorData: responseData,
        }, 'ApiClient')
      }

      // Toast 알림 (옵션)
      if (this.showToastOnError && typeof window !== 'undefined') {
        // useAppToast는 클라이언트 컴포넌트에서만 사용 가능하므로
        // 여기서는 이벤트를 발생시켜 컴포넌트에서 처리하도록 함
        window.dispatchEvent(
          new CustomEvent('api-error', {
            detail: { message: errorMessage, status: response.status },
          })
        )
      }

      throw new Error(errorMessage)
    }

    // 성공 응답 처리: { success: true, data: T }
    if (responseData && typeof responseData === 'object' && 'success' in responseData && (responseData as Record<string, unknown>)['success']) {
      return { data: (responseData as Record<string, unknown>)['data'] as T, response }
    }

    // 기존 형식 호환성 (data가 직접 반환되는 경우)
    return { data: responseData as T, response }
  }

  /**
   * GET 요청
   */
  async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const { data } = await this.executeRequest<T>(url, {
      ...options,
      method: 'GET',
    })
    return data
  }

  /**
   * POST 요청
   */
  async post<T>(url: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    const { data } = await this.executeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : null,
    })
    return data
  }

  /**
   * PUT 요청
   */
  async put<T>(url: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    const { data } = await this.executeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : null,
    })
    return data
  }

  /**
   * DELETE 요청
   */
  async delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const { data } = await this.executeRequest<T>(url, {
      ...options,
      method: 'DELETE',
    })
    return data
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient({
  baseURL: '',
  autoRefreshToken: true,
  showToastOnError: true,
})

