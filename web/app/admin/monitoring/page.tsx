'use client'

import { useState, useCallback } from 'react'
import PageHeader from '@/app/components/common/PageHeader'
import Card from '@/app/components/ui/Card'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import { useHQGuard } from '@/app/lib/hooks/useHQGuard'
import { useFetchData } from '@/app/lib/hooks/useFetchData'
import { Activity, Database, TrendingUp, AlertTriangle } from 'lucide-react'
import Input from '@/app/components/ui/Input'
import Button from '@/app/components/ui/Button'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface MonitoringData {
  table: string
  totalCount: number
  recentCount: number
  dailyTrend: Array<{ date: string; count: number }>
  growthRate: string
  error?: string
}

interface SizeEstimate {
  table: string
  estimatedSizeBytes: number
  estimatedSizeMB: string
}

interface MonitoringResponse {
  monitoring: MonitoringData[]
  sizeEstimates: SizeEstimate[]
  period: number
  timestamp: string
}

export default function MonitoringPage() {
  useHQGuard({ errorMessage: '데이터 모니터링은 본사(HQ)만 사용할 수 있습니다.' })
  
  const [days, setDays] = useState(30)
  
  const { data, loading, error, refetch } = useFetchData<MonitoringResponse>({
    fetchFn: useCallback(async () => {
      const res = await fetch(`/api/admin/monitoring?days=${days}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error(`Failed to fetch monitoring data: ${res.statusText}`)
      }
      return res.json()
    }, [days]),
    immediate: true,
    errorTitle: '모니터링 데이터 로드 실패',
  })

  const getTableName = (table: string) => {
    const names: Record<string, string> = {
      points_ledger: '포인트 이력',
      customer_product_ledger: '고객 상품 변동 이력',
      treatment_records: '시술 기록',
      transactions: '거래 내역',
      appointments: '예약 내역',
      notifications: '알림 이력',
      approval_history: '승인 히스토리',
      treatment_program_sessions: '시술 프로그램 세션',
    }
    return names[table] || table
  }

  const getSizeEstimate = (table: string) => {
    return data?.sizeEstimates.find(s => s.table === table)
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="데이터 모니터링"
        description="테이블별 데이터 증가 추이를 모니터링합니다."
        icon={<Activity className="h-5 w-5" />}
      />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <Input
            type="number"
            label="조회 기간 (일)"
            value={String(days)}
            onChange={(e) => setDays(Math.max(1, parseInt(e.target.value, 10) || 30))}
            min={1}
            max={365}
            className="w-full sm:w-48"
          />
          <Button onClick={refetch} disabled={loading}>
            새로고침
          </Button>
        </div>
      </Card>

      {error && <ErrorState title="오류 발생" message={error} onRetry={refetch} />}

      {loading ? (
        <LoadingState rows={5} variant="cards" />
      ) : data ? (
        <div className="space-y-4">
          {data.monitoring.map((item) => {
            const sizeEstimate = getSizeEstimate(item.table)
            const isHighGrowth = parseFloat(item.growthRate) > 10
            const isLargeTable = item.totalCount > 10000

            return (
              <Card key={item.table} className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      {getTableName(item.table)}
                      {item.error && (
                        <span className="text-xs text-error-600">(접근 불가)</span>
                      )}
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">{item.table}</p>
                  </div>
                  {(isHighGrowth || isLargeTable) && (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-neutral-500">전체 데이터 수</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {item.totalCount.toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">최근 {days}일간 증가</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {item.recentCount.toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">증가율</p>
                    <p className={`text-2xl font-bold flex items-center gap-1 ${
                      isHighGrowth ? 'text-amber-600' : 'text-neutral-900'
                    }`}>
                      <TrendingUp className="h-5 w-5" />
                      {item.growthRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">예상 크기</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {sizeEstimate?.estimatedSizeMB || '0.00'} MB
                    </p>
                  </div>
                </div>

                {item.dailyTrend.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">최근 7일 추이</p>
                    <div className="grid grid-cols-7 gap-2">
                      {item.dailyTrend.map((day) => (
                        <div key={day.date} className="text-center">
                          <p className="text-xs text-neutral-500 mb-1">
                            {format(new Date(day.date), 'MM/dd', { locale: ko })}
                          </p>
                          <p className="text-sm font-semibold text-neutral-900">
                            {day.count.toLocaleString('ko-KR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Activity className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500">조회된 모니터링 데이터가 없습니다.</p>
        </Card>
      )}
    </main>
  )
}

