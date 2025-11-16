'use client'

import { useEffect, useState, useMemo } from 'react'
import PageHeader from '@/app/components/PageHeader'
import FilterBar from '@/app/components/filters/FilterBar'
import { Plus, Pencil } from 'lucide-react'
import { Skeleton } from '@/app/components/ui/Skeleton'
import EmptyState from '@/app/components/EmptyState'
import StaffDetailModal from '@/app/components/modals/StaffDetailModal'
import Button from '@/app/components/ui/Button'
import { useSearch } from '@/app/lib/hooks/useSearch'
import { useSort } from '@/app/lib/hooks/useSort'

type Staff = { id: string; name: string; phone?: string; email?: string; role?: string; notes?: string; active?: boolean; created_at?: string }

export default function StaffPage() {
  const [rows, setRows] = useState<Staff[]>([])
  const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Staff | null>(null)
  const [dense, setDense] = useState<'compact' | 'comfortable'>('comfortable')
  const { sortFn } = useSort<Staff & Record<string, unknown>>({
    initialKey: 'name',
    initialDirection: 'asc',
  })

  const load = async () => {
    try {
      setLoading(true); setError('')
      const { staffApi } = await import('@/app/lib/api/staff')
      const data = await staffApi.list(debouncedQuery.trim() ? { search: debouncedQuery } : {})
      setRows(Array.isArray(data) ? (data as Staff[]) : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [debouncedQuery])

  // 정렬된 데이터
  const sortedRows = useMemo(() => {
    return sortFn(rows as (Staff & Record<string, unknown>)[])
  }, [rows, sortFn])

  return (
    <main className="space-y-4">
      <PageHeader title="직원" actions={
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => { setSelected({ id: '', name: '', phone: '', email: '', role: '', notes: '', active: true } as Staff); setDetailOpen(true) }}
        >
          새 직원
        </Button>
      } />

      <FilterBar>
        <div className="px-3 first:pl-0">
          <div className="text-[11px] font-medium text-neutral-500 mb-1">검색</div>
          <div className="relative w-full max-w-md">
            <input
              className="w-full h-10 rounded-[16px] border border-neutral-300 pl-3 pr-3 text-sm placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none"
              placeholder="이름, 이메일, 전화번호, 직책으로 검색"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
        {/* 밀도(컴팩트/넓게) 토글 제거 */}
        {/* 새로고침 버튼 제거 */}
      </FilterBar>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={`s-${i}`} className="bg-white rounded-[16px] border border-neutral-200 shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-200" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28" />
                <div className="mt-1 h-3 w-16 bg-neutral-100 rounded" />
              </div>
            </div>
          </div>
        ))}
        {!loading && sortedRows.map(s => (
          <div key={s.id} className="bg-white rounded-[16px] border border-neutral-200 shadow-md p-4 hover:shadow-lg transition">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-200" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold truncate">{s.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${s.role ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>{s.role || '직원'}</span>
                </div>
                <div className="mt-1 text-sm text-neutral-600 truncate">{s.phone || '-'}</div>
                <div className="text-sm text-neutral-600 truncate">{s.email || '-'}</div>
              </div>
              <button
                onClick={() => { setSelected(s); setDetailOpen(true) }}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-100"
                aria-label="상세보기"
                title="상세보기"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {!loading && sortedRows.length === 0 && (
          <div className="col-span-full">
            <EmptyState title="직원 데이터가 없습니다." actionLabel="새 직원" actionOnClick={() => { setSelected({ id: undefined as any, name: '', phone: '', email: '', role: '', notes: '', active: true } as any); setDetailOpen(true) }} />
          </div>
        )}
      </section>

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


