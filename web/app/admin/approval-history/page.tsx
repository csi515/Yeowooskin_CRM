'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/app/components/common/PageHeader'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import Input from '@/app/components/ui/Input'
import Select from '@/app/components/ui/Select'
import { Clock, CheckCircle, XCircle, Filter, Download } from 'lucide-react'
import { useTableData } from '@/app/lib/hooks/useTableData'
import { useAppToast } from '@/app/lib/ui/toast'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

type ApprovalHistoryItem = {
  id: string
  user_id: string
  approved_by: string | null
  approved: boolean
  reason: string | null
  created_at: string
  user?: {
    id: string
    email: string
    name: string | null
    role: string
  }
  approver?: {
    id: string
    email: string
    name: string | null
  }
}

export default function ApprovalHistoryPage() {
  const router = useRouter()
  const toast = useAppToast()
  const { role, isHQ } = useCurrentUser()
  const [history, setHistory] = useState<ApprovalHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    userId: '',
    approvedBy: '',
    approved: 'all' as 'all' | 'true' | 'false',
  })

  // HQ 권한 확인
  useEffect(() => {
    if (role && !isHQ) {
      toast.error('접근 권한이 없습니다.', '승인 히스토리는 본사(HQ)만 조회할 수 있습니다.')
      router.push('/dashboard')
    }
  }, [role, isHQ, router, toast])

  const tableData = useTableData<ApprovalHistoryItem>({
    data: history,
    searchOptions: {
      debounceMs: 300,
      searchFields: ['user.email', 'user.name', 'approver.email', 'approver.name'],
    },
    sortOptions: {
      initialKey: 'created_at',
      initialDirection: 'desc',
    },
  })

  const loadHistory = useCallback(async () => {
    if (!isHQ) return

    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.approvedBy) params.set('approvedBy', filters.approvedBy)
      params.set('limit', '100')
      params.set('offset', '0')

      const response = await fetch(`/api/admin/approval-history?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('승인 히스토리를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      let filtered = data.history || []

      if (filters.approved !== 'all') {
        filtered = filtered.filter((item: ApprovalHistoryItem) => 
          filters.approved === 'true' ? item.approved : !item.approved
        )
      }

      setHistory(filtered)
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load approval history:', err)
      const errorMessage = err instanceof Error ? err.message : '승인 히스토리를 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast.error('로드 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isHQ, filters, toast])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const exportToCSV = () => {
    const headers = ['날짜', '사용자', '이메일', '역할', '승인자', '상태', '사유']
    const rows = tableData.filteredData.map(item => [
      new Date(item.created_at).toLocaleString('ko-KR'),
      item.user?.name || '-',
      item.user?.email || '-',
      item.user?.role || '-',
      item.approver?.name || item.approver?.email || '-',
      item.approved ? '승인' : '거절',
      item.reason || '-',
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `approval-history-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (!isHQ) {
    return null
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="승인 히스토리"
        description="사용자 승인/거절 이력을 조회합니다."
      />

      <Card className="p-6">
        <div className="space-y-4">
          {/* 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="사용자 ID"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              placeholder="사용자 ID로 필터링"
            />
            <Input
              label="승인자 ID"
              value={filters.approvedBy}
              onChange={(e) => setFilters({ ...filters, approvedBy: e.target.value })}
              placeholder="승인자 ID로 필터링"
            />
            <Select
              label="승인 상태"
              value={filters.approved}
              onChange={(e) => setFilters({ ...filters, approved: e.target.value as any })}
              options={[
                { value: 'all', label: '전체' },
                { value: 'true', label: '승인' },
                { value: 'false', label: '거절' },
              ]}
            />
            <div className="flex items-end gap-2">
              <Button variant="secondary" onClick={loadHistory} className="flex-1">
                필터 적용
              </Button>
              <Button variant="outline" onClick={exportToCSV} leftIcon={<Download className="h-4 w-4" />}>
                내보내기
              </Button>
            </div>
          </div>

          {/* 검색 */}
          <Input
            placeholder="사용자 이메일, 이름으로 검색..."
            value={tableData.query}
            onChange={(e) => tableData.setQuery(e.target.value)}
            leftIcon={<Filter className="h-4 w-4" />}
          />

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-600 mb-1">전체 이력</div>
              <div className="text-2xl font-bold text-blue-700">{total}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-600 mb-1">승인</div>
              <div className="text-2xl font-bold text-green-700">
                {history.filter(h => h.approved).length}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-600 mb-1">거절</div>
              <div className="text-2xl font-bold text-red-700">
                {history.filter(h => !h.approved).length}
              </div>
            </div>
          </div>

          {/* 테이블 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-blue-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : tableData.filteredData.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">승인 히스토리가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">날짜</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">사용자</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">역할</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">승인자</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">상태</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">사유</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {tableData.filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-neutral-700">
                        {new Date(item.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-neutral-900">{item.user?.name || '-'}</div>
                          <div className="text-xs text-neutral-500">{item.user?.email || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.user?.role || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {item.approver?.name || item.approver?.email || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {item.approved ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            승인
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            거절
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{item.reason || '-'}</td>
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

