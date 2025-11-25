import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireHQ } from '@/app/lib/api/roleGuard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/pending-count
 * 승인 대기 사용자 수 조회 (HQ 전용)
 */
export async function GET(req: NextRequest) {
  try {
    await requireHQ(req)

    const supabase = createSupabaseServerClient()

    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('approved', false)
      .neq('role', 'HQ')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (e: unknown) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

