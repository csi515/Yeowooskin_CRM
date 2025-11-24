import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { withHQ } from '@/app/lib/api/hqWrapper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/approval-history
 * 승인 히스토리 조회 (HQ 전용)
 */
export const GET = withHQ(async (req: NextRequest) => {
  const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    
    const userId = searchParams.get('userId')
    const approvedBy = searchParams.get('approvedBy')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('approval_history')
      .select(`
        *,
        user:profiles!approval_history_user_id_fkey(id, email, name, role),
        approver:profiles!approval_history_approved_by_fkey(id, email, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (approvedBy) {
      query = query.eq('approved_by', approvedBy)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 전체 개수 조회
    let countQuery = supabase
      .from('approval_history')
      .select('*', { count: 'exact', head: true })

    if (userId) {
      countQuery = countQuery.eq('user_id', userId)
    }

    if (approvedBy) {
      countQuery = countQuery.eq('approved_by', approvedBy)
    }

    const { count: totalCount } = await countQuery

  return NextResponse.json({
    history: data || [],
    total: totalCount || 0,
    limit,
    offset,
  })
})

