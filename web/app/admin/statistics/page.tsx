'use client'

import { useState, useCallback } from 'react'
import PageHeader from '@/app/components/common/PageHeader'
import Card from '@/app/components/ui/Card'
import Input from '@/app/components/ui/Input'
import Button from '@/app/components/ui/Button'
import { TrendingUp, Users, Building, DollarSign, Calendar, Download } from 'lucide-react'
import { useHQGuard } from '@/app/lib/hooks/useHQGuard'
import { useFetchData } from '@/app/lib/hooks/useFetchData'

type Statistics = {
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

export default function StatisticsPage() {
  useHQGuard({ errorMessage: '통계 조회는 본사(HQ)만 사용할 수 있습니다.' })
  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })
  
  const { data: stats, loading, error, refetch } = useFetchData<Statistics>({
    fetchFn: useCallback(async () => {
      const params = new URLSearchParams()
      params.set('from', dateRange.from)
      params.set('to', dateRange.to)
      
      const response = await fetch(`/api/admin/statistics?${params.toString()}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('통계를 불러오는데 실패했습니다.')
      }
      return response.json()
    }, [dateRange]),
    immediate: true,
    errorTitle: '통계 로드 실패',
  })

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="전체 통계 및 리포트"
        description="시스템 전체 통계를 조회합니다."
      />

      <Card className="p-6">
        <div className="space-y-4">
          {/* 날짜 범위 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="시작일"
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <Input
              label="종료일"
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
            <div className="flex items-end">
              <Button variant="primary" onClick={refetch} className="w-full" disabled={loading}>
                조회
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : stats ? (
            <>
              {/* 개요 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">지점 수</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{stats.overview.totalBranches}</div>
                </Card>
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">총 매출</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    ₩{stats.overview.totalRevenue.toLocaleString()}
                  </div>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">고객 수</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">{stats.overview.totalCustomers}</div>
                </Card>
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">예약 수</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700">{stats.overview.totalAppointments}</div>
                </Card>
                <Card className="p-4 bg-pink-50 border-pink-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-pink-600" />
                    <span className="text-sm font-medium text-pink-900">신규 고객</span>
                  </div>
                  <div className="text-2xl font-bold text-pink-700">{stats.overview.newCustomers}</div>
                </Card>
              </div>

              {/* 사용자 통계 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">사용자 통계</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <div className="text-sm text-neutral-600 mb-1">전체</div>
                    <div className="text-xl font-bold">{stats.users.total}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 mb-1">본사</div>
                    <div className="text-xl font-bold">{stats.users.hq}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 mb-1">점주</div>
                    <div className="text-xl font-bold">{stats.users.owner}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 mb-1">직원</div>
                    <div className="text-xl font-bold">{stats.users.staff}</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-600 mb-1">승인됨</div>
                    <div className="text-xl font-bold text-green-700">{stats.users.approved}</div>
                  </div>
                  <div>
                    <div className="text-sm text-amber-600 mb-1">대기 중</div>
                    <div className="text-xl font-bold text-amber-700">{stats.users.pending}</div>
                  </div>
                </div>
              </Card>

              {/* 월별 매출 추이 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">월별 매출 추이 (최근 12개월)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-900">월</th>
                        <th className="px-4 py-3 text-right font-semibold text-neutral-900">매출</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {stats.monthlyRevenue.map((item) => (
                        <tr key={item.month} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-neutral-700">{item.month}</td>
                          <td className="px-4 py-3 text-right font-medium text-neutral-900">
                            ₩{item.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </Card>
    </main>
  )
}

