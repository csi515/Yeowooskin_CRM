'use client'

/**
 * 햅틱 피드백 유틸리티
 * 모바일 기기에서 진동 피드백 제공
 */

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

const patterns: Record<HapticFeedbackType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10], // 짧은 진동 - 간격 - 짧은 진동
  warning: [20, 50, 20],
  error: [30, 100, 30, 100, 30], // 긴 진동 패턴
}

/**
 * 햅틱 피드백 실행
 * @param type 피드백 타입
 */
export function hapticFeedback(type: HapticFeedbackType = 'medium'): void {
  if (typeof window === 'undefined') return
  if (!('vibrate' in navigator)) return

  try {
    const pattern = patterns[type]
    navigator.vibrate(pattern)
  } catch (error) {
    // 진동이 지원되지 않거나 실패한 경우 무시
    // eslint-disable-next-line no-console
    console.debug('Haptic feedback not supported:', error)
  }
}

/**
 * 사용 가능한지 확인
 */
export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'vibrate' in navigator
}

