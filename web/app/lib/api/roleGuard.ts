import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ApiError } from './errors'

export type UserRole = 'HQ' | 'OWNER' | 'STAFF'

export interface UserProfile {
  id: string
  role: UserRole
  branch_id: string | null
}

/**
 * 요청에서 사용자 프로필 정보를 추출
 * 쿠키 기반 인증 지원
 */
export async function getCurrentUserProfile(req: NextRequest): Promise<UserProfile | null> {
  try {
    const supabase = createSupabaseServerClient()
    
    // 먼저 쿠키에서 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    let userId: string | null = null
    
    if (session?.user) {
      userId = session.user.id
    } else {
      // 쿠키에 세션이 없으면 Authorization 헤더 확인 (하위 호환성)
      const authHeader = req.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)
        if (!userError && user) {
          userId = user.id
        }
      }
    }

    if (!userId) {
      return null
    }

    // 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, branch_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return null
    }

    return profile as UserProfile
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

/**
 * 역할 기반 접근 제어 - 미들웨어 함수
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<UserProfile> {
  const profile = await getCurrentUserProfile(req)

  if (!profile) {
    throw new ApiError('인증이 필요합니다.', 401)
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new ApiError('접근 권한이 없습니다.', 403)
  }

  return profile
}

/**
 * HQ 전용 접근 제어
 */
export async function requireHQ(req: NextRequest): Promise<UserProfile> {
  return requireRole(req, ['HQ'])
}

/**
 * Owner 이상 접근 제어 (HQ + Owner)
 */
export async function requireOwnerOrAbove(req: NextRequest): Promise<UserProfile> {
  return requireRole(req, ['HQ', 'OWNER'])
}

/**
 * 모든 역할 허용 (인증만 필요)
 */
export async function requireAuthenticated(req: NextRequest): Promise<UserProfile> {
  const profile = await getCurrentUserProfile(req)

  if (!profile) {
    throw new ApiError('인증이 필요합니다.', 401)
  }

  return profile
}

/**
 * 지점 기반 데이터 필터링을 위한 헬퍼
 */
export function createBranchFilter(userProfile: UserProfile) {
  return (data: any) => {
    // HQ는 모든 데이터 접근 가능
    if (userProfile.role === 'HQ') {
      return data
    }

    // Owner/Staff는 자신의 지점 데이터만
    if (userProfile.branch_id) {
      if (Array.isArray(data)) {
        return data.filter(item => item.branch_id === userProfile.branch_id)
      } else if (data && typeof data === 'object') {
        return data.branch_id === userProfile.branch_id ? data : null
      }
    }

    return null
  }
}

/**
 * API 응답에 자동으로 branch_id 추가
 */
export function addBranchIdToPayload(payload: any, userProfile: UserProfile) {
  // HQ는 branch_id를 지정하지 않음
  if (userProfile.role === 'HQ') {
    return payload
  }

  // Owner/Staff는 자신의 branch_id 자동 추가
  if (userProfile.branch_id) {
    return {
      ...payload,
      branch_id: userProfile.branch_id
    }
  }

  return payload
}
