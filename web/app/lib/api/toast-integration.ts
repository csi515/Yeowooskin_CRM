/**
 * API 클라이언트와 Toast 시스템 통합
 * 
 * 이 파일은 클라이언트 컴포넌트에서 import하여 사용합니다.
 */

'use client'

import { useEffect } from 'react'
import { useAppToast } from '../ui/toast'

/**
 * API 에러를 자동으로 Toast로 표시하는 훅
 * 
 * @example
 * function MyComponent() {
 *   useApiErrorToast()
 *   // ... 컴포넌트 로직
 * }
 */
export function useApiErrorToast() {
  const toast = useAppToast()

  useEffect(() => {
    const handleApiError = (event: CustomEvent<{ message: string; status?: number }>) => {
      const { message, status } = event.detail
      
      // 401 에러는 로그인 페이지로 리다이렉트하거나 특별 처리 가능
      if (status === 401) {
        toast.error('인증이 필요합니다', '다시 로그인해주세요')
        return
      }

      // 404 에러
      if (status === 404) {
        toast.error('찾을 수 없습니다', message)
        return
      }

      // 400 에러 (검증 오류 등)
      if (status === 400) {
        toast.error('잘못된 요청입니다', message)
        return
      }

      // 기타 에러
      toast.error('오류가 발생했습니다', message)
    }

    window.addEventListener('api-error', handleApiError as EventListener)

    return () => {
      window.removeEventListener('api-error', handleApiError as EventListener)
    }
  }, [toast])
}

