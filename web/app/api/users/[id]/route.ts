import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { requireHQ } from '@/app/lib/api/roleGuard'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * PUT /api/users/[id]
 * 사용자 정보 수정 (HQ 전용)
 */
export const PUT = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    await requireHQ(req)

    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('사용자 ID가 필요합니다.'))
    }

    const body = await req.json()
    const supabase = createSupabaseServerClient()

    // 수정 가능한 필드만 업데이트
    const updateData: Record<string, unknown> = {}
    if (body.role !== undefined) updateData.role = body.role
    if (body.branch_id !== undefined) updateData.branch_id = body.branch_id || null
    if (body.approved !== undefined) {
      updateData.approved = body.approved
      if (body.approved) {
        updateData.approved_by = userId
        updateData.approved_at = new Date().toISOString()
      } else {
        updateData.approved_by = null
        updateData.approved_at = null
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        branches (
          id,
          name,
          code
        )
      `)
      .single()

    if (error) {
      return createErrorResponse(new Error('사용자 정보 수정에 실패했습니다.'))
    }

    return createSuccessResponse(data)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * DELETE /api/users/[id]
 * 사용자 삭제 (HQ 전용, 실제로는 비활성화)
 */
export const DELETE = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    await requireHQ(req)

    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('사용자 ID가 필요합니다.'))
    }

    // HQ는 삭제할 수 없음
    const supabase = createSupabaseServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single()

    if (profile?.role === 'HQ') {
      return createErrorResponse(new Error('본사 계정은 삭제할 수 없습니다.'))
    }

    // 실제 삭제 대신 승인 해제
    const { error } = await supabase
      .from('profiles')
      .update({
        approved: false,
        approved_by: null,
        approved_at: null,
      })
      .eq('id', id)

    if (error) {
      return createErrorResponse(new Error('사용자 비활성화에 실패했습니다.'))
    }

    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
})

