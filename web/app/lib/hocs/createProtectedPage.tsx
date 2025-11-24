import { ComponentType } from 'react'
import { useRoleGuard } from '../hooks/useRoleGuard'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import type { UserRole } from '../hooks/useRoleGuard'

interface ProtectedPageOptions {
  requiredRoles?: UserRole[]
  allowedRoles?: UserRole[]
  requiredPermissions?: string[]
  redirectTo?: string
  loadingComponent?: ComponentType
  errorComponent?: ComponentType<{ error: string; onRetry?: () => void }>
  unauthorizedComponent?: ComponentType
}

/**
 * 역할 기반 페이지 보호 HOC
 * 지정된 역할 권한이 없는 경우 접근을 차단하고 적절한 컴포넌트를 표시
 */
export function createProtectedPage<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: ProtectedPageOptions = {}
) {
  const {
    requiredRoles = [],
    allowedRoles = [],
    redirectTo = '/403',
    loadingComponent: Loading = LoadingState,
    errorComponent: ErrorComp = ErrorState,
    unauthorizedComponent: Unauthorized
  } = options

  function ProtectedPage(props: P) {
    const { hasAccess, loading, error } = useRoleGuard({
      requiredRoles,
      allowedRoles,
      requiredPermissions,
      redirectTo
    })

    // 로딩 중
    if (loading) {
      return <Loading />
    }

    // 에러 발생
    if (error) {
      if (ErrorComp) {
        return <ErrorComp error={error} />
      }
      return <div className="p-4 text-red-600">오류: {error}</div>
    }

    // 권한 없음 (리다이렉트되므로 여기까지 오지 않음)
    if (!hasAccess) {
      if (Unauthorized) {
        return <Unauthorized />
      }
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한 없음</h1>
            <p className="text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
          </div>
        </div>
      )
    }

    // 권한 있음 - 원래 컴포넌트 렌더링
    return <WrappedComponent {...props} />
  }

  ProtectedPage.displayName = `ProtectedPage(${WrappedComponent.displayName || WrappedComponent.name})`

  return ProtectedPage
}

/**
 * HQ 전용 페이지 HOC
 */
export function createHQOnlyPage<P extends object>(WrappedComponent: ComponentType<P>) {
  return createProtectedPage(WrappedComponent, {
    requiredRoles: ['HQ']
  })
}

/**
 * Owner 이상 권한 페이지 HOC (HQ + Owner)
 */
export function createOwnerOrAbovePage<P extends object>(WrappedComponent: ComponentType<P>) {
  return createProtectedPage(WrappedComponent, {
    allowedRoles: ['HQ', 'OWNER']
  })
}

/**
 * 모든 사용자 접근 가능 페이지 HOC (기본적으로 로그인만 필요)
 */
export function createAuthenticatedPage<P extends object>(WrappedComponent: ComponentType<P>) {
  return createProtectedPage(WrappedComponent, {})
}
