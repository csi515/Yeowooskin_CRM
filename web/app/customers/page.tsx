"use client"

import { Pencil, Plus } from 'lucide-react'
import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/filters/FilterBar'
import CustomerHoldingsBadge from '../components/CustomerHoldingsBadge'
import Button from '../components/ui/Button'
import type { Customer } from '@/types/entities'
import { useSearch } from '../lib/hooks/useSearch'
import { usePagination } from '../lib/hooks/usePagination'
import { useSort } from '../lib/hooks/useSort'

const CustomerDetailModal = lazy(() => import('../components/modals/CustomerDetailModal'))

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([])
  const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
  const [mode, setMode] = useState<'table' | 'card'>('table')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [dense, setDense] = useState<'compact' | 'comfortable'>('comfortable')
  const { sortKey, sortDirection, toggleSort, sortFn } = useSort<Customer & Record<string, unknown>>({
    initialKey: 'name',
    initialDirection: 'asc',
  })
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: rows.length,
  })
  const { page, pageSize, setPage, setPageSize } = pagination
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const [pointsByCustomer, setPointsByCustomer] = useState<Record<string, number>>({})

  const load = async () => {
    try {
      setLoading(true); setError('')
      const { customersApi } = await import('@/app/lib/api/customers')
      const data = await customersApi.list(debouncedQuery ? { search: debouncedQuery } : {})
      setRows(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [debouncedQuery])

  // 정렬된 데이터
  const sortedRows = useMemo(() => {
    return sortFn(rows as (Customer & Record<string, unknown>)[])
  }, [rows, sortFn])

  // 페이지네이션된 데이터
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return sortedRows.slice(start, end)
  }, [sortedRows, page, pageSize])

  // 전체 아이템 수 업데이트
  useEffect(() => {
    // usePagination의 setTotalItems는 내부적으로 관리되므로 직접 접근 불가
    // 대신 totalItems를 동적으로 계산
  }, [rows.length])

  // 보유상품 합계는 각 행 렌더 시 배지 컴포넌트가 직접 불러오며, 이벤트로 동기화합니다.
  // 포인트 조회 최적화: 현재 페이지의 고객만 조회
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const { pointsApi } = await import('@/app/lib/api/points')
        const pairs = await Promise.all(paginatedRows.map(async (c) => {
          try {
            const data = await pointsApi.getBalance(c.id, { withLedger: false })
            const balance = Number(data?.balance || 0)
            return [c.id, balance] as [string, number]
          } catch {
            return [c.id, 0] as [string, number]
          }
        }))
        setPointsByCustomer(prev => ({ ...prev, ...Object.fromEntries(pairs) }))
      } catch {}
    }
    if (paginatedRows.length) fetchPoints()
  }, [paginatedRows])

  return (
    <main className="space-y-8">
      {/** 안전 가드: 빌드/핫리로드 타이밍 이슈 대비 */}
      {(() => { void (typeof pointsByCustomer); return null })()}
      <PageHeader
        title="고객 목록"
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setSelected({ id: '', owner_id: '', name: '', phone: '', email: '', address: '' } as Customer)
              setDetailOpen(true)
            }}
          >
            새 고객
          </Button>
        }
      />
      <FilterBar>
        <div className="flex flex-wrap items-end gap-4 w-full">
          <div className="flex-1 min-w-0">
            <div className="mb-1.5 text-xs sm:text-[11px] font-medium text-neutral-600">검색</div>
            <div className="relative w-full">
              <input
                className="h-10 sm:h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 sm:px-4 text-sm text-neutral-800 outline-none shadow-sm placeholder:text-neutral-400 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all duration-fast touch-manipulation"
                placeholder="이름, 이메일 또는 전화번호로 검색"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </FilterBar>

      {error && <p className="text-sm text-error-600">{error}</p>}

      {mode==='table' ? (
        <div className="max-h-[60vh] sm:max-h-[70vh] overflow-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" role="table" aria-label="고객 목록">
            <thead className="sticky top-0 z-10 bg-neutral-100">
              <tr>
                <th className={dense==='compact' ? 'p-3' : 'p-4'} scope="col">
                  <button
                    className="inline-flex items-center gap-1 hover:underline text-secondary-600"
                    onClick={() => { toggleSort('name'); setPage(1) }}
                    aria-label={`이름으로 정렬, 현재: ${sortKey === 'name' ? (sortDirection === 'asc' ? '오름차순' : '내림차순') : '정렬 안됨'}`}
                  >
                    이름 {sortKey==='name' ? (sortDirection==='asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className={(dense==='compact' ? 'p-3' : 'p-4') + ' hidden sm:table-cell'}>
                  <button
                    className="inline-flex items-center gap-1 hover:underline text-secondary-600"
                    onClick={() => { toggleSort('phone'); setPage(1) }}
                  >
                    연락처 {sortKey==='phone' ? (sortDirection==='asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className={(dense==='compact' ? 'p-3' : 'p-4') + ' hidden md:table-cell'}>
                  <button
                    className="inline-flex items-center gap-1 hover:underline text-secondary-600"
                    onClick={() => { toggleSort('email'); setPage(1) }}
                  >
                    이메일 {sortKey==='email' ? (sortDirection==='asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className={(dense==='compact' ? 'p-3' : 'p-4') + ' hidden sm:table-cell'}>보유상품</th>
                <th className={(dense==='compact' ? 'p-3' : 'p-4') + ' hidden md:table-cell'}>포인트</th>
                <th className={dense==='compact' ? 'p-3' : 'p-4'}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td className={dense==='compact' ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-40" /></td>
                  <td className={dense==='compact' ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-28" /></td>
                  <td className={dense==='compact' ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-32" /></td>
                  <td className={dense==='compact' ? 'p-3' : 'p-4'}><Skeleton className="h-8 w-24 ml-auto" /></td>
                </tr>
              ))}
              {!loading && paginatedRows.map((c) => (
                <tr
                  key={c.id}
                  className="outline-none odd:bg-neutral-50/40 hover:bg-neutral-100 min-h-[48px]"
                  tabIndex={0}
                  onKeyDown={(e)=>{ if(e.key==='Enter'){ setSelected(c); setDetailOpen(true) }}}
                >
                  <td className={dense==='compact' ? 'p-3' : 'p-4'}>{c.name}</td>
                  <td className={(dense==='compact' ? 'p-3' : 'p-4') + ' hidden sm:table-cell'}>{c.phone || '-'}</td>
                  <td className={(dense==='compact' ? 'p-3' : 'p-4') + ' hidden md:table-cell'}>{c.email || '-'}</td>
                  <td className={(dense==='compact' ? 'p-3' : 'p-4') + ' hidden sm:table-cell'}>
                    <CustomerHoldingsBadge customerId={c.id} />
                  </td>
                  <td className={(dense==='compact' ? 'p-3' : 'p-4') + ' hidden md:table-cell'}>
                    {Number(((typeof pointsByCustomer !== 'undefined' && (pointsByCustomer as any)?.[c.id] != null) ? (pointsByCustomer as any)[c.id] : 0)).toLocaleString()}
                  </td>
                  <td className={dense==='compact' ? 'p-3' : 'p-4'}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { setSelected(c); setDetailOpen(true) }}
                      aria-label="상세보기"
                      title="상세보기"
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 touch-manipulation"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
              <tr><td colSpan={4}>
                <EmptyState
                  title="고객 데이터가 없습니다."
                  actionLabel="새 고객"
                  actionOnClick={() => { setSelected({ id: undefined as any, owner_id: '', name: '', phone: '', email: '', address: '' } as Customer); setDetailOpen(true) }}
                />
              </td></tr>
              )}
            </tbody>
          </table>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 px-3 sm:px-4 py-3 gap-3 bg-neutral-50">
            <div className="text-xs sm:text-sm text-neutral-600">
              총 {rows.length}명 · {page}/{Math.max(1, Math.ceil(rows.length / pageSize))} 페이지
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="h-10 sm:h-9 flex-1 sm:flex-none rounded-lg border border-neutral-300 px-3 text-sm bg-white focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all duration-fast touch-manipulation"
              >
                {[10,20,50].map(s => <option key={s} value={s}>{s}/페이지</option>)}
              </select>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                className="h-10 sm:h-9 flex-1 sm:flex-none rounded-lg border border-neutral-300 px-4 text-sm bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 transition-all duration-fast touch-manipulation"
                disabled={page===1}
              >
                이전
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                className="h-10 sm:h-9 flex-1 sm:flex-none rounded-lg border border-neutral-300 px-4 text-sm bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 transition-all duration-fast touch-manipulation"
                disabled={page>=totalPages}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedRows.map(c => (
              <div key={c.id} className="bg-white rounded-lg border border-neutral-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-fast">
              <div className="text-base sm:text-lg font-semibold text-neutral-900">{c.name}</div>
              <div className="mt-2 text-sm text-neutral-600">{c.phone || '-'}</div>
              <div className="text-sm text-neutral-600">{c.email || '-'}</div>
              <div className="mt-4 text-right">
                  <button
                    onClick={() => { setSelected(c); setDetailOpen(true) }}
                    className="h-10 w-10 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg border border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400 active:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 transition-all duration-fast touch-manipulation"
                    aria-label="상세보기"
                    title="상세보기"
                  >
                    <Pencil className="h-4 w-4 text-neutral-700" />
                  </button>
              </div>
            </div>
          ))}
          {paginatedRows.length === 0 && !loading && <div className="text-sm text-neutral-500">데이터가 없습니다.</div>}
        </div>
      )}
      {detailOpen && (
        <Suspense fallback={<div>로딩 중...</div>}>
          <CustomerDetailModal
            open={detailOpen}
            item={selected as any}
            onClose={() => setDetailOpen(false)}
            onSaved={load}
            onDeleted={load}
          />
        </Suspense>
      )}
    </main>
  )
}
