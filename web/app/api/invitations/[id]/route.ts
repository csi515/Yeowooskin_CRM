import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { requireHQ } from '@/app/lib/api/roleGuard'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * DELETE /api/invitations/[id]
 * 초대 코드 삭제 (HQ 전용)
 */
export const DELETE = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    await requireHQ(req)

    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('초대 ID가 필요합니다.'))
    }

    const supabase = createSupabaseServerClient()

    // 초대 코드 삭제
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)

    if (error) {
      return createErrorResponse(new Error('초대 코드 삭제에 실패했습니다.'))
    }

    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
})

