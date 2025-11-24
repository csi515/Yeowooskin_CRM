/**
 * HQ 권한 가드 훅
 * HQ 전용 페이지에서 반복되는 권한 체크 및 리다이렉트 로직 통합
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from './useCurrentUser'
import { useAppToast } from '../ui/toast'

interface UseHQGuardOptions {
  redirectTo?: string
  errorTitle?: string
  errorMessage?: string
}

/**
 * HQ 권한 가드 훅
 * 
 * @example
 * export default function AdminPage() {
 *   useHQGuard({ errorMessage: '이 페이지는 본사(HQ)만 사용할 수 있습니다.' })
 *   // ... 나머지 코드
 * }
 */
export function useHQGuard(options: UseHQGuardOptions = {}) {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  
  const {
    redirectTo = '/dashboard',
    errorTitle = '접근 권한이 없습니다.',
    errorMessage = '이 페이지는 본사(HQ)만 사용할 수 있습니다.',
  } = options

  useEffect(() => {
    if (role && !isHQ) {
      toast.error(errorTitle, errorMessage)
      router.push(redirectTo)
    }
  }, [role, isHQ, router, toast, redirectTo, errorTitle, errorMessage])

  return { isHQ, role }
}

