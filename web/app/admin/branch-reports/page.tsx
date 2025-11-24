'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import Card from '@/app/components/ui/Card'
import Input from '@/app/components/ui/Input'
import Button from '@/app/components/ui/Button'
import { Building, DollarSign, Users, Calendar, TrendingUp, Download } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'
import { analyticsApi, type BranchStat } from '@/app/lib/api/analytics'

export default function BranchReportsPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [stats, setStats] = useState<BranchStat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', '지점별 리포트는 본사(HQ)만 사용할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  const loadReports = useCallback(async () => {
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
      console.error('Failed to load branch reports:', err)
      const errorMessage = err instanceof Error ? err.message : '지점별 리포트를 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isHQ, dateRange, toast])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const exportToCSV = () => {
    const headers = ['지점명', '지점코드', '매출', '고객 수', '예약 수', '신규 고객']
    const rows = stats.map(stat => [
      stat.branch_name,
      stat.branch_code,
      stat.revenue.toString(),
      stat.customer_count.toString(),
      stat.appointment_count.toString(),
      stat.new_customer_count.toString(),
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `branch-reports-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (!isHQ) {
    return null
  }

  const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0)
  const totalCustomers = stats.reduce((sum, s) => sum + s.customer_count, 0)
  const totalAppointments = stats.reduce((sum, s) => sum + s.appointment_count, 0)
  const totalNewCustomers = stats.reduce((sum, s) => sum + s.new_customer_count, 0)

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="지점별 리포트"
        description="각 지점의 성과를 비교하고 분석합니다."
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
            <div className="flex items-end gap-2">
              <Button variant="primary" onClick={loadReports} className="flex-1">
                조회
              </Button>
              <Button variant="outline" onClick={exportToCSV} leftIcon={<Download className="h-4 w-4" />}>
                내보내기
              </Button>
            </div>
          </div>

          {/* 총계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">총 매출</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">₩{totalRevenue.toLocaleString()}</div>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">총 고객</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">{totalCustomers}</div>
            </Card>
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">총 예약</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{totalAppointments}</div>
            </Card>
            <Card className="p-4 bg-pink-50 border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-pink-600" />
                <span className="text-sm font-medium text-pink-900">신규 고객</span>
              </div>
              <div className="text-2xl font-bold text-pink-700">{totalNewCustomers}</div>
            </Card>
          </div>

          {/* 지점별 통계 테이블 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">데이터가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">지점명</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">지점코드</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">매출</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">고객 수</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">예약 수</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">신규 고객</th>
                    <th className="px-4 py-3 text-right font-semibold text-neutral-900">고객당 매출</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {stats.map((stat) => (
                    <tr key={stat.branch_id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">{stat.branch_name}</td>
                      <td className="px-4 py-3 text-neutral-600">{stat.branch_code}</td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-900">
                        ₩{stat.revenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">{stat.customer_count}</td>
                      <td className="px-4 py-3 text-right text-neutral-700">{stat.appointment_count}</td>
                      <td className="px-4 py-3 text-right text-neutral-700">{stat.new_customer_count}</td>
                      <td className="px-4 py-3 text-right text-neutral-600">
                        {stat.customer_count > 0
                          ? `₩${Math.round(stat.revenue / stat.customer_count).toLocaleString()}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </main>
  )
}

