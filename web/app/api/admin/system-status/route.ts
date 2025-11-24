import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { withHQ } from '@/app/lib/api/hqWrapper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/system-status
 * 시스템 상태 조회 (HQ 전용)
 */
export const GET = withHQ(async (req: NextRequest) => {
  const supabase = createSupabaseServerClient()

    // 데이터베이스 연결 테스트
    const dbStartTime = Date.now()
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1)
    const dbResponseTime = Date.now() - dbStartTime

    // 기본 통계
    const [
      { count: totalUsers },
      { count: totalBranches },
      { count: totalCustomers },
      { count: pendingApprovals },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('branches').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('approved', false),
    ])

    // 최근 에러 로그 (audit_logs 사용 안 함)
    const recentErrors: any[] = []

    return NextResponse.json({
      database: {
        connected: !dbError,
        responseTime: dbResponseTime,
        status: dbError ? 'error' : dbResponseTime < 500 ? 'healthy' : dbResponseTime < 1000 ? 'slow' : 'degraded',
      },
      statistics: {
        totalUsers: totalUsers || 0,
        totalBranches: totalBranches || 0,
        totalCustomers: totalCustomers || 0,
        pendingApprovals: pendingApprovals || 0,
      },
      recentErrors: recentErrors || [],
      timestamp: new Date().toISOString(),
    })
})

