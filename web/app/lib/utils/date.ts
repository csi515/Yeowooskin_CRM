/**
 * 날짜/시간 유틸리티 함수
 */

/**
 * ISO 문자열을 한국 시간 형식으로 변환 (오전/오후 hh시)
 */
export function formatKoreanHour(iso: string): string {
  const date = new Date(iso)
  const hours = date.getHours()
  const ampm = hours >= 12 ? '오후' : '오전'
  const hour12 = hours % 12 || 12
  return `${ampm} ${hour12}시`
}

/**
 * 상대 시간 표시 (예: "3일 전", "방금 전")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - target.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}개월 전`
  return `${Math.floor(diffDay / 365)}년 전`
}

/**
 * 날짜 범위 가져오기
 */
export function getDateRange(
  type: 'today' | 'week' | 'month' | 'year'
): { from: string; to: string } {
  const now = new Date()
  const from = new Date()
  const to = new Date()

  switch (type) {
    case 'today':
      from.setHours(0, 0, 0, 0)
      to.setHours(23, 59, 59, 999)
      break
    case 'week':
      const dayOfWeek = now.getDay()
      from.setDate(now.getDate() - dayOfWeek)
      from.setHours(0, 0, 0, 0)
      to.setDate(from.getDate() + 6)
      to.setHours(23, 59, 59, 999)
      break
    case 'month':
      from.setDate(1)
      from.setHours(0, 0, 0, 0)
      to.setMonth(now.getMonth() + 1)
      to.setDate(0)
      to.setHours(23, 59, 59, 999)
      break
    case 'year':
      from.setMonth(0, 1)
      from.setHours(0, 0, 0, 0)
      to.setMonth(11, 31)
      to.setHours(23, 59, 59, 999)
      break
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

/**
 * 특정 날짜의 월 범위 가져오기
 */
export function isoMonthRange(date?: Date): { from: string; to: string } {
  const d = date || new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  }
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 시간을 HH:MM 형식으로 변환
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 날짜와 시간을 함께 포맷팅
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

