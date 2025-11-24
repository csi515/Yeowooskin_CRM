import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { requireHQ } from '@/app/lib/api/roleGuard'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/users
 * 전체 사용자 목록 조회 (HQ 전용)
 */
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    await requireHQ(req)

    const params = parseQueryParams(req)
    const { search, limit = 50, offset = 0 } = params

    const supabase = createSupabaseServerClient()

    let query = supabase
      .from('profiles')
      .select(`
        *,
        branches (
          id,
          name,
          code
        )
      `)
      .order('created_at', { ascending: false })

    // 검색 필터
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return createErrorResponse(new Error('사용자 목록을 불러올 수 없습니다.'))
    }

    return createSuccessResponse({
      users: data || [],
      total: count || 0,
    })
  } catch (error) {
    return createErrorResponse(error)
  }
})

