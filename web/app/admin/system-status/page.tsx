'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { Activity, Database, Users, Building, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

type SystemStatus = {
  database: {
    connected: boolean
    responseTime: number
    status: 'healthy' | 'slow' | 'degraded' | 'error'
  }
  statistics: {
    totalUsers: number
    totalBranches: number
    totalCustomers: number
    pendingApprovals: number
  }
  recentErrors: Array<{
    id: string
    action: string
    resource_type: string
    details: any
    created_at: string
  }>
  timestamp: string
}

export default function SystemStatusPage() {
  useHQGuard({ errorMessage: '시스템 상태 모니터링은 본사(HQ)만 사용할 수 있습니다.' })
  
  const [autoRefresh, setAutoRefresh] = useState(false)
  
  const { data: status, loading, error, refetch } = useFetchData<SystemStatus>({
    fetchFn: async () => {
      const response = await fetch('/api/admin/system-status', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('시스템 상태를 불러오는데 실패했습니다.')
      }
      return response.json()
    },
    immediate: true,
    errorTitle: '시스템 상태 로드 실패',
  })

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refetch, 30000) // 30초마다 갱신
      return () => clearInterval(interval)
    }
  }, [refetch, autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'slow':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'degraded':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return '정상'
      case 'slow':
        return '느림'
      case 'degraded':
        return '저하'
      case 'error':
        return '오류'
      default:
        return '알 수 없음'
    }
  }

  if (!isHQ) {
    return null
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="시스템 상태 모니터링"
        description="시스템의 건강 상태를 실시간으로 모니터링합니다."
      />

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">시스템 상태</h3>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-700">자동 갱신 (30초)</span>
              </label>
              <Button variant="outline" onClick={loadStatus} disabled={loading}>
                새로고침
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
          ) : status ? (
            <>
              {/* 데이터베이스 상태 */}
              <Card className={`p-4 border-2 ${getStatusColor(status.database.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6" />
                    <div>
                      <div className="font-semibold">데이터베이스</div>
                      <div className="text-sm opacity-80">
                        {status.database.connected ? '연결됨' : '연결 실패'} · 응답 시간: {status.database.responseTime}ms
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status.database.connected ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium">{getStatusLabel(status.database.status)}</span>
                  </div>
                </div>
              </Card>

              {/* 통계 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">사용자</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{status.statistics.totalUsers}</div>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">지점</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">{status.statistics.totalBranches}</div>
                </Card>
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">고객</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{status.statistics.totalCustomers}</div>
                </Card>
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">승인 대기</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700">{status.statistics.pendingApprovals}</div>
                </Card>
              </div>

              {/* 최근 에러 */}
              {status.recentErrors.length > 0 && (
                <Card className="p-4 border-red-200 bg-red-50">
                  <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    최근 에러 ({status.recentErrors.length}개)
                  </h4>
                  <div className="space-y-2">
                    {status.recentErrors.slice(0, 5).map((err) => (
                      <div key={err.id} className="text-sm text-red-800 bg-white rounded p-2">
                        <div className="font-medium">{err.resource_type} - {err.action}</div>
                        <div className="text-xs text-red-600 mt-1">
                          {new Date(err.created_at).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 마지막 업데이트 */}
              <div className="text-xs text-neutral-500 text-center">
                마지막 업데이트: {new Date(status.timestamp).toLocaleString('ko-KR')}
              </div>
            </>
          ) : null}
        </div>
      </Card>
    </main>
  )
}

