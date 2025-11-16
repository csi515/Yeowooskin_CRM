/**
 * 폼 검증 유틸리티 함수
 */

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * 전화번호 형식 검증 (한국 형식: 010-1234-5678 또는 01012345678)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
  return phoneRegex.test(phone.trim().replace(/\s/g, ''))
}

/**
 * 필수 값 검증
 */
export function validateRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !isNaN(value)
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * 숫자 범위 검증
 */
export function validateNumber(
  value: unknown,
  min?: number,
  max?: number
): boolean {
  if (typeof value !== 'number' || isNaN(value)) return false
  if (min !== undefined && value < min) return false
  if (max !== undefined && value > max) return false
  return true
}

/**
 * 문자열 길이 검증
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number
): boolean {
  if (typeof value !== 'string') return false
  const length = value.trim().length
  if (min !== undefined && length < min) return false
  if (max !== undefined && length > max) return false
  return true
}

/**
 * URL 형식 검증
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 날짜 형식 검증 (YYYY-MM-DD)
 */
export function validateDate(date: string): boolean {
  if (!date || typeof date !== 'string') return false
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return false
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

/**
 * 시간 형식 검증 (HH:MM)
 */
export function validateTime(time: string): boolean {
  if (!time || typeof time !== 'string') return false
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * 검증 에러 메시지 반환
 */
export function getValidationError(
  field: string,
  value: unknown,
  rules: {
    required?: boolean
    email?: boolean
    phone?: boolean
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    custom?: (val: unknown) => string | null
  }
): string | null {
  // 필수 검증
  if (rules.required && !validateRequired(value)) {
    return `${field}은(는) 필수입니다.`
  }

  // 값이 없으면 추가 검증 불필요
  if (value === null || value === undefined || value === '') {
    return null
  }

  // 이메일 검증
  if (rules.email && typeof value === 'string' && !validateEmail(value)) {
    return '올바른 이메일 형식이 아닙니다.'
  }

  // 전화번호 검증
  if (rules.phone && typeof value === 'string' && !validatePhone(value)) {
    return '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'
  }

  // 숫자 범위 검증
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return `${field}은(는) ${rules.min} 이상이어야 합니다.`
    }
    if (rules.max !== undefined && value > rules.max) {
      return `${field}은(는) ${rules.max} 이하여야 합니다.`
    }
  }

  // 문자열 길이 검증
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return `${field}은(는) 최소 ${rules.minLength}자 이상이어야 합니다.`
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return `${field}은(는) 최대 ${rules.maxLength}자 이하여야 합니다.`
    }
  }

  // 커스텀 검증
  if (rules.custom) {
    const customError = rules.custom(value)
    if (customError) return customError
  }

  return null
}

