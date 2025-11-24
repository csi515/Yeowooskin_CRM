import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { withHQ } from '@/app/lib/api/hqWrapper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface StatisticsResponse {
  overview: {
    totalBranches: number
    totalRevenue: number
    totalCustomers: number
    totalAppointments: number
    newCustomers: number
  }
  users: {
    total: number
    hq: number
    owner: number
    staff: number
    approved: number
    pending: number
  }
  monthlyRevenue: { month: string; revenue: number }[]
  period: { from: string; to: string }
}

/**
 * GET /api/admin/statistics
 * 전체 통계 조회 (HQ 전용)
 */
export const GET = withHQ(async (req: NextRequest) => {
  const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    
    const from = searchParams.get('from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const to = searchParams.get('to') || new Date().toISOString()

    // 전체 지점 수
    const { count: totalBranches } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    // 전체 사용자 수 (역할별)
    const { data: usersByRole } = await supabase
      .from('profiles')
      .select('role')
    
    const usersStats = {
      total: usersByRole?.length || 0,
      hq: usersByRole?.filter(u => u.role === 'HQ').length || 0,
      owner: usersByRole?.filter(u => u.role === 'OWNER').length || 0,
      staff: usersByRole?.filter(u => u.role === 'STAFF').length || 0,
      approved: usersByRole?.filter(u => true).length || 0, // approved 필드 확인 필요
      pending: 0,
    }

    // 승인 대기 사용자 수
    const { count: pendingUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('approved', false)

    usersStats.pending = pendingUsers || 0

    // 전체 매출 (기간 내)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
      .gte('transaction_date', from)
      .lt('transaction_date', to)

    const totalRevenue = Array.isArray(transactions)
      ? transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
      : 0

    // 전체 고객 수
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    // 신규 고객 수 (기간 내)
    const { count: newCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', from)
      .lt('created_at', to)

    // 전체 예약 수 (기간 내)
    const { count: totalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', from)
      .lt('appointment_date', to)

    // 월별 매출 추이 (최근 12개월)
    const monthlyRevenue: { month: string; revenue: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString()

      const { data: monthTransactions } = await supabase
        .from('transactions')
        .select('amount')
        .gte('transaction_date', monthStart)
        .lt('transaction_date', monthEnd)

      monthlyRevenue.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        revenue: Array.isArray(monthTransactions)
          ? monthTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
          : 0,
      })
    }

    return NextResponse.json({
      overview: {
        totalBranches: totalBranches || 0,
        totalRevenue,
        totalCustomers: totalCustomers || 0,
        totalAppointments: totalAppointments || 0,
        newCustomers: newCustomers || 0,
      },
      users: usersStats,
      monthlyRevenue,
      period: { from, to },
    })
})

