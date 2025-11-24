import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { invitationCreateSchema } from '@/app/lib/api/schemas'

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await parseAndValidateBody(req, invitationCreateSchema)

    // 현재 사용자의 프로필 확인
    const { createSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = createSupabaseServerClient()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, branch_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return createErrorResponse(new Error('프로필을 찾을 수 없습니다.'))
    }

    let branchId: string | null = null

    // HQ는 지점장(OWNER) 초대 시 branch_id를 지정할 수 있음
    if (profile.role === 'HQ' && body.role === 'OWNER') {
      branchId = body.branch_id || null
      
      // HQ가 지점장을 초대할 때는 branch_id가 필수
      if (!branchId) {
        return createErrorResponse(new Error('지점장 초대 시 지점을 선택해야 합니다.'))
      }
      
      // 지점 존재 확인
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('id')
        .eq('id', branchId)
        .is('deleted_at', null)
        .single()
      
      if (branchError || !branch) {
        return createErrorResponse(new Error('지점을 찾을 수 없습니다.'))
      }
    } else if (profile.role === 'OWNER') {
      // Owner는 자신의 지점에만 직원 초대 가능
      if (body.role === 'OWNER') {
        return createErrorResponse(new Error('점주는 지점장을 초대할 수 없습니다.'))
      }
      branchId = profile.branch_id
    } else {
      return createErrorResponse(new Error('초대 권한이 없습니다.'))
    }

    if (!branchId) {
      return createErrorResponse(new Error('지점 정보가 필요합니다.'))
    }

    // 초대 코드 생성
    const inviteCode = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // 초대 생성
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email: body.email,
        role: body.role,
        branch_id: branchId,
        invite_code: inviteCode,
        invited_by: userId,
      })
      .select()
      .single()

    if (inviteError) {
      return createErrorResponse(new Error('초대 생성에 실패했습니다.'))
    }

    // TODO: 이메일 발송 로직 추가

    return createSuccessResponse({
      invitation,
      message: '초대가 발송되었습니다.'
    })
  } catch (error) {
    return createErrorResponse(error)
  }
})

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = createSupabaseServerClient()

    // 현재 사용자의 프로필 및 초대 목록 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, branch_id')
      .eq('id', userId)
      .single()

    if (!profile) {
      return createErrorResponse(new Error('프로필을 찾을 수 없습니다.'))
    }

    let query = supabase
      .from('invitations')
      .select(`
        *,
        profiles!invitations_invited_by_fkey(name)
      `)
      .order('created_at', { ascending: false })

    // 권한에 따른 필터링
    if (profile.role === 'OWNER') {
      query = query.eq('branch_id', profile.branch_id)
    }
    // HQ는 모든 초대 조회 가능

    const { data: invitations, error } = await query

    if (error) {
      return createErrorResponse(new Error('초대 목록 조회에 실패했습니다.'))
    }

    return createSuccessResponse(invitations)
  } catch (error) {
    return createErrorResponse(error)
  }
})
