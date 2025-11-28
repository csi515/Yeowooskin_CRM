'use client'

import { useEffect, useState, useCallback } from 'react'
import PageHeader, { createActionButton } from '@/app/components/common/PageHeader'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import { Users, Pencil } from 'lucide-react'
import EmptyState from '@/app/components/EmptyState'
import StaffDetailModal from '@/app/components/modals/StaffDetailModal'
import { useTableData } from '@/app/lib/hooks/useTableData'

type Staff = { id: string; name: string; phone?: string; email?: string; role?: string; notes?: string; active?: boolean; created_at?: string }

export default function StaffPage() {
  const [rows, setRows] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Staff | null>(null)

  // 통합 테이블 데이터 훅 사용
  const tableData = useTableData<Staff>({
    data: rows,
    searchOptions: {
      debounceMs: 300,
      searchFields: ['name', 'email', 'phone', 'role'],
    },
    sortOptions: {
      initialKey: 'name',
      initialDirection: 'asc',
    },
  })

  const debouncedQuery = tableData.debouncedQuery

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { staffApi } = await import('@/app/lib/api/staff')
      const data = await staffApi.list(debouncedQuery.trim() ? { search: debouncedQuery } : {})
      setRows(Array.isArray(data) ? (data as Staff[]) : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery])

  useEffect(() => {
    load()
  }, [load])

  return (
    <main className="space-y-3 sm:space-y-4">
      <PageHeader
        title="직원 관리"
        icon={<Users className="h-5 w-5" />}
        description="직원 정보를 관리하고 검색할 수 있습니다"
        search={{
          value: tableData.query,
          onChange: tableData.setQuery,
          placeholder: '이름, 이메일, 전화번호, 직책으로 검색',
        }}
        actions={createActionButton(
          '새 직원',
          () => {
            setSelected({ id: '', name: '', phone: '', email: '', role: '', notes: '', active: true } as Staff)
            setDetailOpen(true)
          }
        )}
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <LoadingState rows={8} variant="card" />
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tableData.sortedData.map((s, index) => {
            const colorSchemes = [
              { bg: 'from-pink-50 to-rose-100', border: 'border-pink-200', avatar: 'from-pink-200 to-rose-300', role: 'bg-pink-100 text-pink-700 border-pink-300' },
              { bg: 'from-blue-50 to-cyan-100', border: 'border-blue-200', avatar: 'from-blue-200 to-cyan-300', role: 'bg-blue-100 text-blue-700 border-blue-300' },
              { bg: 'from-emerald-50 to-teal-100', border: 'border-emerald-200', avatar: 'from-emerald-200 to-teal-300', role: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
              { bg: 'from-amber-50 to-yellow-100', border: 'border-amber-200', avatar: 'from-amber-200 to-yellow-300', role: 'bg-amber-100 text-amber-700 border-amber-300' },
              { bg: 'from-purple-50 to-violet-100', border: 'border-purple-200', avatar: 'from-purple-200 to-violet-300', role: 'bg-purple-100 text-purple-700 border-purple-300' },
            ]
            const scheme = colorSchemes[index % colorSchemes.length]!
            return (
              <div key={s['id']} className={`bg-gradient-to-br ${scheme.bg} rounded-[16px] border-2 ${scheme.border} shadow-md p-4 hover:shadow-xl active:scale-[0.98] transition-all duration-300 touch-manipulation`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${scheme.avatar} shadow-sm`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold truncate text-neutral-800">{s['name']}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s['role'] ? scheme.role : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{s['role'] || '직원'}</span>
                    </div>
                    <div className="mt-1 text-sm text-neutral-600 truncate">{s['phone'] || '-'}</div>
                    <div className="text-sm text-neutral-600 truncate">{s['email'] || '-'}</div>
                  </div>
                  <button
                    onClick={() => { setSelected(s); setDetailOpen(true) }}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border-2 border-pink-200 hover:bg-pink-100 text-pink-600 transition-colors"
                    aria-label="상세보기"
                    title="상세보기"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
          {tableData.sortedData.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                title="직원 데이터가 없습니다."
                actionLabel="새 직원"
                actionOnClick={() => {
                  setSelected({ id: '', name: '', phone: '', email: '', role: '', notes: '', active: true } as Staff)
                  setDetailOpen(true)
                }}
              />
            </div>
          )}
        </section>
      )}

      <StaffDetailModal
        open={detailOpen}
        item={selected}
        onClose={() => setDetailOpen(false)}
        onSaved={load}
        onDeleted={load}
      />
    </main>
  )
}
