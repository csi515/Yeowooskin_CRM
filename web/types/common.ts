/**
 * 공통 유틸리티 타입 정의
 */

/**
 * 페이지네이션 파라미터
 */
export interface PaginationParams {
  limit?: number
  offset?: number
}

/**
 * 검색 파라미터
 */
export interface SearchParams {
  search?: string
}

/**
 * 날짜 범위 파라미터
 */
export interface DateRangeParams {
  from?: string // ISO string (inclusive)
  to?: string   // ISO string (exclusive)
}

/**
 * API 응답 기본 형식
 */
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

/**
 * API 에러 응답
 */
export interface ApiErrorResponse {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

/**
 * ID 파라미터
 */
export interface IdParams {
  id: string
}

