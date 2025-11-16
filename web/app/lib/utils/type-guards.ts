/**
 * 런타임 타입 검증 함수 (타입 가드)
 */

/**
 * 문자열 타입 가드
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * 숫자 타입 가드
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * 불리언 타입 가드
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * 배열 타입 가드
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * 객체 타입 가드 (null 제외)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * null 또는 undefined 체크
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * 빈 문자열 체크
 */
export function isEmptyString(value: unknown): boolean {
  return isString(value) && value.trim().length === 0
}

/**
 * API 응답이 성공적인지 확인
 */
export function isSuccessResponse<T>(response: unknown): response is { data: T } {
  return isObject(response) && 'data' in response
}

/**
 * API 에러 응답인지 확인
 */
export function isErrorResponse(response: unknown): response is { message: string; error?: string } {
  return isObject(response) && ('message' in response || 'error' in response)
}

/**
 * Customer 타입 가드
 */
export function isCustomer(value: unknown): value is { id: string; name: string } {
  return isObject(value) && isString(value.id) && isString(value.name)
}

/**
 * Product 타입 가드
 */
export function isProduct(value: unknown): value is { id: string | number; name: string } {
  return isObject(value) && (isString(value.id) || isNumber(value.id)) && isString(value.name)
}

