import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { withHQ } from '@/app/lib/api/hqWrapper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface MonitoringDataItem {
  table: string
  totalCount: number
  recentCount: number
  dailyTrend: { date: string; count: number }[]
  growthRate: string
  error?: string
}

interface SizeEstimateItem {
  table: string
  estimatedSizeBytes: number
  estimatedSizeMB: string
}

interface MonitoringResponse {
  monitoring: MonitoringDataItem[]
  sizeEstimates: SizeEstimateItem[]
  period: number
  timestamp: string
}

/**
 * GET /api/admin/monitoring
 * 테이블별 데이터 증가 추이 모니터링 (HQ 전용)
 */
export const GET = withHQ(async (req: NextRequest) => {
  const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    // 각 테이블의 현재 데이터 수와 최근 증가 추이 조회
    const tables = [
      'points_ledger',
      'customer_product_ledger',
      'treatment_records',
      'transactions',
      'appointments',
      'notifications',
      'approval_history',
      'treatment_program_sessions',
    ]

    const monitoringData = await Promise.all(
      tables.map(async (tableName) => {
        try {
          // 전체 데이터 수
          const { count: totalCount } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          // 최근 N일간 데이터 수
          const daysAgo = new Date()
          daysAgo.setDate(daysAgo.getDate() - days)
          const { count: recentCount } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .gte('created_at', daysAgo.toISOString())

          // 일별 증가 추이 (최근 7일)
          const dailyTrend = []
          for (let i = 6; i >= 0; i--) {
            const dayStart = new Date()
            dayStart.setDate(dayStart.getDate() - i)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(dayStart)
            dayEnd.setHours(23, 59, 59, 999)

            const { count: dayCount } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true })
              .gte('created_at', dayStart.toISOString())
              .lt('created_at', dayEnd.toISOString())

            dailyTrend.push({
              date: dayStart.toISOString().split('T')[0],
              count: dayCount || 0,
            })
          }

          return {
            table: tableName,
            totalCount: totalCount || 0,
            recentCount: recentCount || 0,
            dailyTrend,
            growthRate: totalCount && totalCount > 0 
              ? ((recentCount || 0) / totalCount * 100).toFixed(2)
              : '0.00',
          }
        } catch (error: unknown) {
          // 테이블이 존재하지 않거나 접근 권한이 없는 경우
          return {
            table: tableName,
            totalCount: 0,
            recentCount: 0,
            dailyTrend: [],
            growthRate: '0.00',
            error: error.message,
          }
        }
      })
    )

    // 테이블 크기 추정 (대략적인 바이트 수)
    const sizeEstimates = await Promise.all(
      tables.map(async (tableName) => {
        try {
          // 각 테이블의 샘플 데이터로 평균 행 크기 추정
          const { data: sample } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)

          // 대략적인 크기 추정 (JSON 직렬화 기준)
          const avgRowSize = sample && sample.length > 0
            ? JSON.stringify(sample[0]).length
            : 500 // 기본값 500 bytes

          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          return {
            table: tableName,
            estimatedSizeBytes: (count || 0) * avgRowSize,
            estimatedSizeMB: ((count || 0) * avgRowSize / (1024 * 1024)).toFixed(2),
          }
        } catch {
          return {
            table: tableName,
            estimatedSizeBytes: 0,
            estimatedSizeMB: '0.00',
          }
        }
      })
    )

  return NextResponse.json({
    monitoring: monitoringData,
    sizeEstimates,
    period: days,
    timestamp: new Date().toISOString(),
  })
})

