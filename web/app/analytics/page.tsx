'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import { BarChart3, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'
import { analyticsApi, type BranchStat } from '@/app/lib/api/analytics'
import Monthly from '@/app/components/charts/Monthly'

function getMonthRange(offset = 0) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 1)
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [stats, setStats] = useState<BranchStat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState(() => getMonthRange(0))

  // HQ 권한 확인
  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', '분석 리포트는 본사(HQ)만 사용할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  // 통계 로드
  const loadStats = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      setError('')

      const data = await analyticsApi.getBranchStats({
        from: dateRange.from,
        to: dateRange.to,
      })
      setStats(data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      const errorMessage = err instanceof Error ? err.message : '통계를 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [dateRange, isHQ, toast])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // 총계 계산
  const totals = {
    revenue: stats.reduce((sum, s) => sum + s.revenue, 0),
    customers: stats.reduce((sum, s) => sum + s.customer_count, 0),
    appointments: stats.reduce((sum, s) => sum + s.appointment_count, 0),
    newCustomers: stats.reduce((sum, s) => sum + s.new_customer_count, 0),
  }

  // 월별 차트 데이터 생성 (간단한 예시)
  const monthlyChartData = stats.slice(0, 5).map((stat, index) => ({
    name: stat.branch_name.length > 6 ? stat.branch_name.substring(0, 6) + '...' : stat.branch_name,
    income: stat.revenue,
    expense: 0, // 지출 데이터는 별도로 조회 필요
  }))

  if (role && !isHQ) {
    return null
  }

  return (
    <main className="space-y-4 sm:space-y-5 md:space-y-6">
      <PageHeader
        title="분석 리포트"
        description="전체 지점의 성과를 비교하고 분석할 수 있습니다."
      />

      {/* 날짜 선택 */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">시작일</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">종료일</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange(getMonthRange(0))}
            >
              이번 달
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange(getMonthRange(-1))}
            >
              지난 달
            </Button>
            <Button variant="primary" size="sm" onClick={loadStats} loading={loading}>
              조회
            </Button>
          </div>
        </div>
      </Card>

      {error && <ErrorState title="오류 발생" message={error} onRetry={loadStats} />}

      {/* 총계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-medium text-neutral-600">총 매출</h3>
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            ₩{totals.revenue.toLocaleString()}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-neutral-600">총 고객 수</h3>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totals.customers.toLocaleString()}</div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h3 className="text-sm font-medium text-neutral-600">총 예약 수</h3>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totals.appointments.toLocaleString()}</div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-pink-600" />
            <h3 className="text-sm font-medium text-neutral-600">신규 고객</h3>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totals.newCustomers.toLocaleString()}</div>
        </Card>
      </div>

      {/* 지점별 통계 테이블 */}
      {loading ? (
        <LoadingState rows={5} variant="table" />
      ) : stats.length === 0 ? (
        <Card className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500">통계 데이터가 없습니다.</p>
        </Card>
      ) : (
        <>
          {/* 차트 */}
          <Card className="p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">지점별 매출 비교</h2>
            <Monthly data={monthlyChartData} />
          </Card>

          {/* 지점별 상세 통계 */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">순위</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">지점명</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">코드</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">매출</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">고객 수</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">예약 수</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">신규 고객</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {stats.map((stat, index) => (
                    <tr key={stat.branch_id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : index === 1
                                ? 'bg-neutral-100 text-neutral-800'
                                : index === 2
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-50 text-neutral-600'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">{stat.branch_name}</td>
                      <td className="px-4 py-3 text-neutral-600">{stat.branch_code}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        ₩{stat.revenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">{stat.customer_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-neutral-700">{stat.appointment_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-neutral-700">{stat.new_customer_count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </main>
  )
}

