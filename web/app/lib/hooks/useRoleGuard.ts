import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from './useCurrentUser'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type UserRole = 'HQ' | 'OWNER' | 'STAFF'

interface RoleGuardOptions {
  requiredRoles?: UserRole[]
  allowedRoles?: UserRole[]
  requiredPermissions?: string[]
  redirectTo?: string
  fallbackComponent?: React.ComponentType
}

/**
 * 역할 기반 접근 제어 Hook
 * 지정된 역할 권한이 없는 경우 403 페이지로 리다이렉트
 */
export function useRoleGuard(options: RoleGuardOptions = {}) {
  const router = useRouter()
  const { currentUser, loading, error, role } = useCurrentUser()
  const [permissionLoading, setPermissionLoading] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const {
    requiredRoles = [],
    allowedRoles = [],
    requiredPermissions = [],
    redirectTo = '/403'
  } = options

  // 권한 확인 함수
  const checkPermissions = useCallback(async () => {
    if (!currentUser?.id || requiredPermissions.length === 0) return true

    try {
      setPermissionLoading(true)
      setPermissionError(null)

      const supabase = createSupabaseBrowserClient()

      // has_permission 함수 호출
      for (const permission of requiredPermissions) {
        const { data: hasPerm, error } = await supabase.rpc('has_permission', {
          permission_code: permission
        })

        if (error) {
          console.error('Permission check error:', error)
          return false
        }

        if (!hasPerm) {
          return false
        }
      }

      return true
    } catch (err) {
      console.error('Permission check failed:', err)
      setPermissionError('권한 확인 중 오류가 발생했습니다.')
      return false
    } finally {
      setPermissionLoading(false)
    }
  }, [currentUser?.id, requiredPermissions])

  useEffect(() => {
    // 로딩 중이거나 에러가 있는 경우는 아직 판단하지 않음
    if (loading || error || permissionLoading) return

    // 사용자가 로그인하지 않은 경우
    if (!currentUser) {
      router.push('/login')
      return
    }

    // 역할이 없는 경우
    if (!role) {
      router.push('/403')
      return
    }

    // requiredRoles가 지정된 경우, 해당 역할 중 하나라도 있어야 함
    if (requiredRoles.length > 0) {
      if (!requiredRoles.includes(role)) {
        router.push(redirectTo)
        return
      }
    }

    // allowedRoles가 지정된 경우, 해당 역할만 허용
    if (allowedRoles.length > 0) {
      if (!allowedRoles.includes(role)) {
        router.push(redirectTo)
        return
      }
    }

    // 권한 검증
    if (requiredPermissions.length > 0) {
      checkPermissions().then(hasPermission => {
        if (!hasPermission) {
          router.push(redirectTo)
        }
      })
    }

    // 모든 검증 통과
  }, [currentUser, loading, error, permissionLoading, role, requiredRoles, allowedRoles, requiredPermissions, redirectTo, router, checkPermissions])

  const hasAccess = !loading && !error && !permissionLoading && !!currentUser && !!role &&
    (requiredRoles.length === 0 || requiredRoles.includes(role)) &&
    (allowedRoles.length === 0 || allowedRoles.includes(role))

  return {
    currentUser,
    loading: loading || permissionLoading,
    error: error || permissionError,
    hasAccess
  }
}

/**
 * 페이지 컴포넌트용 역할 체크 유틸리티
 */
export function checkRoleAccess(
  userRole: UserRole | null,
  options: RoleGuardOptions = {}
): boolean {
  const { requiredRoles = [], allowedRoles = [], requiredPermissions = [] } = options

  if (!userRole) return false

  // requiredRoles가 지정된 경우, 해당 역할 중 하나라도 있어야 함
  if (requiredRoles.length > 0) {
    return requiredRoles.includes(userRole)
  }

  // allowedRoles가 지정된 경우, 해당 역할만 허용
  if (allowedRoles.length > 0) {
    return allowedRoles.includes(userRole)
  }

  // requiredPermissions가 지정된 경우 추가 검증 필요
  // 이 함수에서는 기본 역할만 체크하므로 실제 권한 검증은 API에서 수행
  if (requiredPermissions.length > 0) {
    // 기본적으로는 역할이 있는 경우 통과, 세부 권한은 런타임에 확인
    return true
  }

  // 제한이 없는 경우 모두 허용
  return true
}
