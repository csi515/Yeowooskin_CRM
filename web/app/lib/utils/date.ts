/**
 * 날짜 포맷팅 유틸리티
 * 프로젝트 전역에서 사용하는 날짜 포맷팅 함수 통합
 */

/**
 * ISO 날짜 문자열을 한국어 형식으로 변환
 * @example "2024-01-15T10:30:00" -> "2024년 1월 15일 10시 30분"
 */
export function formatKoreanDateTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return isoString
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    
    const isAM = hours < 12
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    
    return `${year}년 ${month}월 ${day}일 ${isAM ? '오전' : '오후'} ${String(displayHours).padStart(2, '0')}시 ${String(minutes).padStart(2, '0')}분`
  } catch {
    return isoString
  }
}

/**
 * ISO 날짜 문자열을 간단한 날짜 형식으로 변환
 * @example "2024-01-15T10:30:00" -> "2024-01-15"
 */
export function formatDate(isoString: string): string {
  try {
    return isoString.slice(0, 10)
  } catch {
    return isoString
  }
}

/**
 * ISO 날짜 문자열을 시간 형식으로 변환
 * @example "2024-01-15T10:30:00" -> "오전 10시 30분"
 */
export function formatKoreanHour(isoString: string): string {
  try {
    const date = new Date(isoString)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const isAM = hours < 12
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    
    return `${isAM ? '오전' : '오후'} ${String(displayHours).padStart(2, '0')}시${minutes > 0 ? ` ${String(minutes).padStart(2, '0')}분` : ''}`
  } catch {
    return ''
  }
}

/**
 * 날짜 범위 레이블 생성
 */
export function formatDateRange(start: Date, end: Date, viewType: 'month' | 'week' | 'day'): string {
  const fmt = (d: Date, withYear = false) => {
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    if (withYear) return `${y}년 ${m}월 ${day}일`
    return `${m}월 ${day}일`
  }

  if (viewType === 'month') {
    const y = start.getFullYear()
    const m = start.getMonth() + 1
    return `${y}년 ${m}월`
  }

  if (viewType === 'week') {
    const endAdjusted = new Date(end)
    endAdjusted.setDate(endAdjusted.getDate() - 1)
    return `${fmt(start, true)} ~ ${fmt(endAdjusted)}`
  }

  return fmt(start, true)
}

/**
 * 상대 시간 표시 (예: "3일 전", "방금 전")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return '방금 전'
    if (diffMin < 60) return `${diffMin}분 전`
    if (diffHour < 24) return `${diffHour}시간 전`
    if (diffDay < 7) return `${diffDay}일 전`
    
    return formatDate(isoString)
  } catch {
    return isoString
  }
}
