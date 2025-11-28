"use client"

import { Pencil, Plus } from 'lucide-react'
import { useEffect, useState, useMemo, lazy, Suspense, useCallback } from 'react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
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
  const mode: 'table' | 'card' = 'table'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  // const dense: 'compact' | 'comfortable' = 'comfortable'
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

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const { customersApi } = await import('@/app/lib/api/customers')
      const data = await customersApi.list(debouncedQuery ? { search: debouncedQuery } : {})
      setRows(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally { setLoading(false) }
  }, [debouncedQuery])

  useEffect(() => { load() }, [load])

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
      } catch { }
    }
    if (paginatedRows.length) fetchPoints()
  }, [paginatedRows])

  return (
    <main className="space-y-3 sm:space-y-4">
      {/** 안전 가드: 빌드/핫리로드 타이밍 이슈 대비 */}
      {(() => { void (typeof pointsByCustomer); return null })()}

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full">
          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">검색</label>
            <input
              className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-800 outline-none shadow-sm placeholder:text-neutral-400 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all duration-200 touch-manipulation"
              placeholder="이름, 이메일 또는 전화번호로 검색"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelected({ id: '', owner_id: '', name: '', phone: '', email: '', address: '' } as Customer)
                setDetailOpen(true)
              }}
              className="w-full sm:w-auto"
            >
              새 고객
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-error-600">{error}</p>}

      {mode === 'table' ? (
        <>
          {/* 모바일 카드 뷰 */}
          <div className="md:hidden space-y-3">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <div key={`s-${i}`} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
            {!loading && paginatedRows.map((c, index) => (
              <div
                key={c.id}
                onClick={() => { setSelected(c); setDetailOpen(true) }}
                className={`rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.99] touch-manipulation ${index % 4 === 0
                  ? 'bg-pink-50/30 border-pink-200'
                  : index % 4 === 1
                    ? 'bg-purple-50/30 border-purple-200'
                    : index % 4 === 2
                      ? 'bg-blue-50/30 border-blue-200'
                      : 'bg-emerald-50/30 border-emerald-200'
                  }`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(c)
                    setDetailOpen(true)
                  }
                }}
                role="button"
                aria-label={`${c.name} 고객 상세보기`}
              >
                <div className="flex items-start justify-between mb-3 pb-2 border-b border-neutral-100">
                  <h3 className="text-base font-semibold text-neutral-900">{c.name}</h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelected(c)
                      setDetailOpen(true)
                    }}
                    aria-label="상세보기"
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">연락처</span>
                    <span className="text-neutral-700 font-medium">{c.phone || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">이메일</span>
                    <span className="text-neutral-700 font-medium truncate ml-2">{c.email || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">보유상품</span>
                    <CustomerHoldingsBadge customerId={c.id} />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span className="text-neutral-500 font-medium">포인트</span>
                    <span className="text-amber-700 font-semibold">
                      {Number(pointsByCustomer[c.id] ?? 0).toLocaleString()}P
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && rows.length === 0 && (
              <EmptyState
                title="고객 데이터가 없습니다."
                actionLabel="새 고객"
                actionOnClick={() => {
                  setSelected({
                    id: '',
                    owner_id: '',
                    name: '',
                    phone: '',
                    email: '',
                    address: ''
                  } as Customer)
                  setDetailOpen(true)
                }}
              />
            )}
          </div>

          {/* 데스크톱 테이블 뷰 */}
          <div className="hidden md:block max-h-[70vh] overflow-auto rounded-lg border border-neutral-200 bg-white shadow-sm scroll-container">
            <div className="overflow-x-auto scroll-container">
              <table className="min-w-full text-sm" role="table" aria-label="고객 목록">
                <thead className="sticky top-0 z-[1010] bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100">
                  <tr>
                    <th className="p-4 text-left align-top" scope="col">
                      <button
                        className="inline-flex items-center gap-1 hover:underline text-pink-700 font-semibold touch-manipulation"
                        onClick={() => { toggleSort('name'); setPage(1) }}
                        aria-label={`이름으로 정렬, 현재: ${sortKey === 'name' ? (sortDirection === 'asc' ? '오름차순' : '내림차순') : '정렬 안됨'}`}
                      >
                        이름 {sortKey === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </button>
                    </th>
                    <th className="p-4 text-left align-top">
                      <button
                        className="inline-flex items-center gap-1 hover:underline text-purple-700 font-semibold touch-manipulation"
                        onClick={() => { toggleSort('phone'); setPage(1) }}
                      >
                        연락처 {sortKey === 'phone' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </button>
                    </th>
                    <th className="p-4 text-left align-top">
                      <button
                        className="inline-flex items-center gap-1 hover:underline text-blue-700 font-semibold touch-manipulation"
                        onClick={() => { toggleSort('email'); setPage(1) }}
                      >
                        이메일 {sortKey === 'email' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </button>
                    </th>
                    <th className="p-4 text-left align-top text-emerald-700 font-semibold">보유상품</th>
                    <th className="p-4 text-right align-top text-amber-700 font-semibold whitespace-nowrap">포인트</th>
                    <th className="p-4 text-center align-top text-indigo-700 font-semibold whitespace-nowrap" scope="col">
                      상세보기
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {loading && Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`s-${i}`}>
                      <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-8 mx-auto" /></td>
                    </tr>
                  ))}
                  {!loading && paginatedRows.map((c, index) => (
                    <tr
                      key={c.id}
                      className={`outline-none min-h-[48px] transition-colors cursor-pointer touch-manipulation ${index % 4 === 0
                        ? 'bg-pink-50/50 hover:bg-pink-100'
                        : index % 4 === 1
                          ? 'bg-purple-50/50 hover:bg-purple-100'
                          : index % 4 === 2
                            ? 'bg-blue-50/50 hover:bg-blue-100'
                            : 'bg-emerald-50/50 hover:bg-emerald-100'
                        }`}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setSelected(c); setDetailOpen(true) } }}
                      onClick={() => { setSelected(c); setDetailOpen(true) }}
                    >
                      <td className="p-4 text-left align-top font-medium">{c.name}</td>
                      <td className="p-4 text-left align-top">{c.phone || '-'}</td>
                      <td className="p-4 text-left align-top">{c.email || '-'}</td>
                      <td className="p-4 text-left align-top">
                        <CustomerHoldingsBadge customerId={c.id} />
                      </td>
                      <td className="p-4 text-right align-top whitespace-nowrap font-medium">
                        {Number(pointsByCustomer[c.id] ?? 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-center align-top">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(c)
                            setDetailOpen(true)
                          }}
                          aria-label="상세보기"
                          title="상세보기"
                          className="h-8 w-8 p-0 touch-manipulation"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!loading && rows.length === 0 && (
                    <tr><td colSpan={6}>
                      <EmptyState
                        title="고객 데이터가 없습니다."
                        actionLabel="새 고객"
                        actionOnClick={() => {
                          setSelected({
                            id: '',
                            owner_id: '',
                            name: '',
                            phone: '',
                            email: '',
                            address: ''
                          } as Customer)
                          setDetailOpen(true)
                        }}
                      />
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 px-4 py-3 gap-3 bg-neutral-50">
              <div className="text-sm text-neutral-600">
                총 {rows.length}명 · {page}/{Math.max(1, Math.ceil(rows.length / pageSize))} 페이지
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                  className="h-9 rounded-lg border border-neutral-300 px-3 text-sm bg-white focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all duration-fast touch-manipulation"
                >
                  {[10, 20, 50].map(s => <option key={s} value={s}>{s}/페이지</option>)}
                </select>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className="h-9 rounded-lg border border-neutral-300 px-4 text-sm bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 transition-all duration-fast touch-manipulation"
                  disabled={page === 1}
                >
                  이전
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className="h-9 rounded-lg border border-neutral-300 px-4 text-sm bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 transition-all duration-fast touch-manipulation"
                  disabled={page >= totalPages}
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </>
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
            item={selected}
            onClose={() => setDetailOpen(false)}
            onSaved={load}
            onDeleted={load}
          />
        </Suspense>
      )}
    </main>
  )
}
