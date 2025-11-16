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
      if (name === 'sb:token') {
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
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        return response.ok
      } catch {
        return false
      } finally {
        this.refreshPromise = null
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
      !url.includes('/api/auth/logout')
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
          const errorData = await response.json().catch(() => ({}))
          if ((errorData as any)?.error === 'TOKEN_EXPIRED') {
            window.location.href = '/login?error=expired'
            throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
          }
        }
      }
    }

    // 에러 응답 처리
    if (!response.ok) {
      let errorMessage = '요청을 처리할 수 없습니다.'
      let errorData: unknown = null
      try {
        errorData = await response.json()
        errorMessage = (errorData as { message?: string })?.message || errorMessage
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
      }

      // 에러 로깅
      if (typeof window !== 'undefined') {
        const { logger } = await import('../utils/logger')
        logger.error(`API 요청 실패: ${url}`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
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

    // 응답 데이터 파싱
    const data = await response.json()
    return { data, response }
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
  async post<T>(url: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    const { data } = await this.executeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
    return data
  }

  /**
   * PUT 요청
   */
  async put<T>(url: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    const { data } = await this.executeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
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

