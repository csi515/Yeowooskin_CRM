import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { requireHQ } from '@/app/lib/api/roleGuard'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/analytics/branch-stats
 * 지점별 통계 조회 (HQ 전용)
 */
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    await requireHQ(req)

    const params = parseQueryParams(req)
    const { from, to } = params

    const supabase = createSupabaseServerClient()

    // 모든 지점 조회
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name, code')
      .is('deleted_at', null)
      .order('name')

    if (branchesError) {
      return createErrorResponse(new Error('지점 목록을 불러올 수 없습니다.'))
    }

    if (!branches || branches.length === 0) {
      return createSuccessResponse([])
    }

    const branchIds = branches.map((b) => b.id)

    // 날짜 필터
    const dateFilter = from && to
      ? { from, to }
      : {
          // 기본값: 이번 달
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        }

    // 각 지점별 통계 조회
    const statsPromises = branchIds.map(async (branchId) => {
      // 매출 (거래)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('branch_id', branchId)
        .gte('transaction_date', dateFilter.from)
        .lt('transaction_date', dateFilter.to)

      const revenue = Array.isArray(transactions)
        ? transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
        : 0

      // 고객 수
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branchId)

      // 예약 수
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('appointment_date', dateFilter.from)
        .lt('appointment_date', dateFilter.to)

      // 신규 고객 수 (기간 내)
      const { count: newCustomerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('created_at', dateFilter.from)
        .lt('created_at', dateFilter.to)

      const branch = branches.find((b) => b.id === branchId)

      return {
        branch_id: branchId,
        branch_name: branch?.name || '',
        branch_code: branch?.code || '',
        revenue,
        customer_count: customerCount || 0,
        appointment_count: appointmentCount || 0,
        new_customer_count: newCustomerCount || 0,
      }
    })

    const stats = await Promise.all(statsPromises)

    // 매출 순으로 정렬
    stats.sort((a, b) => b.revenue - a.revenue)

    return createSuccessResponse(stats)
  } catch (error) {
    return createErrorResponse(error)
  }
})

