'use client'

import { useEffect, useState, useMemo } from 'react'
import FilterBar from '@/app/components/filters/FilterBar'
import { Plus, Pencil, UserCheck } from 'lucide-react'
import { Skeleton } from '@/app/components/ui/Skeleton'
import EmptyState from '@/app/components/EmptyState'
import StaffDetailModal from '@/app/components/modals/StaffDetailModal'
import Button from '@/app/components/ui/Button'
import { useSearch } from '@/app/lib/hooks/useSearch'
import { useSort } from '@/app/lib/hooks/useSort'
import SearchInput from '@/app/components/ui/SearchInput'
import { GridSkeleton } from '@/app/components/ui/Skeleton'

type Staff = { id: string; name: string; phone?: string; email?: string; role?: string; notes?: string; active?: boolean; created_at?: string }

export default function StaffPage() {
  const [rows, setRows] = useState<Staff[]>([])
  const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Staff | null>(null)
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
    <main className="space-y-4 md:space-y-5">
      <FilterBar>
        <div className="flex flex-wrap items-end gap-3 md:gap-4 w-full">
          <div className="flex-1 min-w-0 sm:min-w-[280px]">
            <label className="block mb-2 text-sm font-semibold text-neutral-700">검색</label>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="이름, 이메일, 전화번호, 직책으로 검색"
            />
          </div>
          <div className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelected({ id: '', name: '', phone: '', email: '', role: '', notes: '', active: true } as Staff)
                setDetailOpen(true)
              }}
              className="w-full sm:w-auto"
            >
              새 직원
            </Button>
          </div>
        </div>
      </FilterBar>

      {error && <p className="text-sm text-error-600">{error}</p>}

      {/* 그리드 뷰 - 반응형 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {loading && <GridSkeleton items={8} cols={4} />}
        {!loading && sortedRows.map((s, index) => {
          const colorSchemes = [
            { bg: 'from-pink-50 to-rose-100', border: 'border-pink-200', avatar: 'from-pink-200 to-rose-300', role: 'bg-pink-100 text-pink-700 border-pink-300' },
            { bg: 'from-blue-50 to-cyan-100', border: 'border-blue-200', avatar: 'from-blue-200 to-cyan-300', role: 'bg-blue-100 text-blue-700 border-blue-300' },
            { bg: 'from-emerald-50 to-teal-100', border: 'border-emerald-200', avatar: 'from-emerald-200 to-teal-300', role: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
            { bg: 'from-amber-50 to-yellow-100', border: 'border-amber-200', avatar: 'from-amber-200 to-yellow-300', role: 'bg-amber-100 text-amber-700 border-amber-300' },
            { bg: 'from-purple-50 to-violet-100', border: 'border-purple-200', avatar: 'from-purple-200 to-violet-300', role: 'bg-purple-100 text-purple-700 border-purple-300' },
          ]
          const scheme = colorSchemes[index % colorSchemes.length]
          return (
            <div
              key={s.id}
              className={`bg-gradient-to-br ${scheme.bg} rounded-xl border-2 ${scheme.border} shadow-md p-4 md:p-5 hover:shadow-xl transition-all duration-300 cursor-pointer active:scale-[0.98]`}
              onClick={() => { setSelected(s); setDetailOpen(true) }}
            >
              <div className="flex items-start gap-3">
                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${scheme.avatar} shadow-sm flex items-center justify-center text-white font-semibold text-lg flex-shrink-0`}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="font-semibold text-neutral-900 truncate">{s.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${
                      s.role ? scheme.role : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}>
                      {s.role || '직원'}
                    </span>
                  </div>
                  {s.phone && (
                    <div className="text-sm text-neutral-600 truncate mb-0.5">{s.phone}</div>
                  )}
                  {s.email && (
                    <div className="text-sm text-neutral-600 truncate">{s.email}</div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelected(s)
                    setDetailOpen(true)
                  }}
                  className="h-9 w-9 flex-shrink-0 inline-flex items-center justify-center rounded-lg border-2 border-neutral-300 hover:bg-action-blue-600 hover:text-white hover:border-action-blue-600 transition-all touch-manipulation"
                  aria-label="상세보기"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
        {!loading && sortedRows.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              type="no-customers"
              title="직원 데이터가 없습니다."
              description="새로운 직원을 추가해보세요."
              actionLabel="새 직원"
              actionOnClick={() => {
                setSelected({ id: undefined as any, name: '', phone: '', email: '', role: '', notes: '', active: true } as any)
                setDetailOpen(true)
              }}
            />
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
