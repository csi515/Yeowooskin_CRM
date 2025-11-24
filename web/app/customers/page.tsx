"use client"

import { Pencil, Plus } from 'lucide-react'
import { useEffect, useState, useMemo, lazy, Suspense, useCallback } from 'react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import CustomerHoldingsBadge from '../components/CustomerHoldingsBadge'
import SwipeableCustomerCard from '../components/customers/SwipeableCustomerCard'
import Button from '../components/ui/Button'
import FloatingActionButton from '../components/common/FloatingActionButton'
import type { Customer } from '@/types/entities'
import type { CustomerFilterType } from '../components/customers/CustomerFilters'
import { useSearch } from '../lib/hooks/useSearch'
import { usePagination } from '../lib/hooks/usePagination'
import { useSort } from '../lib/hooks/useSort'
import { useRecentSearches } from '../lib/hooks/useRecentSearches'

const CustomerDetailModal = lazy(() => import('../components/modals/CustomerDetailModal'))

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([])
  const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
  const { recentSearches, addSearch } = useRecentSearches()
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const [activeFilter, setActiveFilter] = useState<CustomerFilterType>('all')
  const mode: 'table' | 'card' = 'table'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)

  // 고객 상세 모달 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenDetail = (e: CustomEvent) => {
      const customerId = e.detail?.customerId
      if (customerId) {
        const customer = rows.find((c) => c.id === customerId)
        if (customer) {
          setSelected(customer)
          setDetailOpen(true)
        }
      }
    }

    const handleOpenNew = () => {
      setSelected(null)
      setDetailOpen(true)
    }

    window.addEventListener('open-customer-detail', handleOpenDetail as EventListener)
    window.addEventListener('open-new-customer-modal', handleOpenNew)
    return () => {
      window.removeEventListener('open-customer-detail', handleOpenDetail as EventListener)
      window.removeEventListener('open-new-customer-modal', handleOpenNew)
    }
  }, [rows])
  // dense = 'comfortable' - 현재는 comfortable 모드만 지원
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
      
      // 검색 기록 저장
      if (debouncedQuery && debouncedQuery.trim()) {
        addSearch(debouncedQuery, 'customer')
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally { setLoading(false) }
  }, [debouncedQuery, addSearch])

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

  // 전체 아이템 수는 usePagination에서 rows.length를 기반으로 자동 계산됨

  // 보유상품 합계는 각 행 렌더 시 배지 컴포넌트가 직접 불러오며, 이벤트로 동기화합니다.
  // 포인트 조회 최적화: 현재 페이지의 고객만 조회
  useEffect(() => {
    if (paginatedRows.length === 0) return
    
    const fetchPoints = async () => {
      try {
        const { pointsApi } = await import('@/app/lib/api/points')
        const pairs = await Promise.all(
          paginatedRows.map(async (c) => {
            try {
              const data = await pointsApi.getBalance(c.id, { withLedger: false })
              const balance = Number(data?.balance || 0)
              return [c.id, balance] as [string, number]
            } catch {
              return [c.id, 0] as [string, number]
            }
          })
        )
        setPointsByCustomer(prev => ({ ...prev, ...Object.fromEntries(pairs) }))
      } catch (error) {
        // 포인트 조회 실패는 조용히 무시 (UI에 표시하지 않음)
        console.debug('Failed to fetch points:', error)
      }
    }
    
    fetchPoints()
  }, [paginatedRows])

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full">
          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">검색</label>
            <div className="relative flex gap-2">
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-800 outline-none shadow-sm placeholder:text-neutral-400 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all duration-200 touch-manipulation"
                placeholder="이름, 이메일 또는 전화번호로 검색 (Ctrl+K)"
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setShowRecentSearches(e.target.value.length === 0 && recentSearches.length > 0)
                }}
                onFocus={() => {
                  if (!query && recentSearches.length > 0) {
                    setShowRecentSearches(true)
                  }
                }}
                onBlur={() => {
                  // 약간의 지연을 두어 클릭 이벤트가 먼저 발생하도록
                  setTimeout(() => setShowRecentSearches(false), 200)
                }}
              />
              {/* 최근 검색 기록 */}
              {showRecentSearches && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  <div className="p-2 border-b border-neutral-200">
                    <div className="text-xs font-medium text-neutral-500">최근 검색</div>
                  </div>
                  {recentSearches
                    .filter((s) => s.type === 'customer' || !s.type)
                    .slice(0, 5)
                    .map((search) => (
                      <button
                        key={search.query}
                        onClick={() => {
                          setQuery(search.query)
                          setShowRecentSearches(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors"
                      >
                        {search.query}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <CustomerFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelected(null)
                setDetailOpen(true)
              }}
              className="hidden md:flex w-full sm:w-auto"
            >
              새 고객
            </Button>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-error-600">{error}</p> : null}

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
            {!loading && paginatedRows.map((c) => (
              <SwipeableCustomerCard
                key={c.id}
                customer={c}
                points={pointsByCustomer[c.id] || 0}
                onEdit={(customer) => {
                  setSelected(customer)
                  setDetailOpen(true)
                }}
                onCall={(phone) => {
                  window.location.href = `tel:${phone}`
                }}
                onEmail={(email) => {
                  window.location.href = `mailto:${email}`
                }}
              />
            ))}
            {!loading && rows.length === 0 && (
              <EmptyState
                title="고객 데이터가 없습니다."
                actionLabel="새 고객"
                actionOnClick={() => { 
                  setSelected(null)
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
                  <th className={`p-4 text-left align-top`} scope="col">
                    <button
                      className="inline-flex items-center gap-1 hover:underline text-pink-700 font-semibold touch-manipulation"
                      onClick={() => { toggleSort('name'); setPage(1) }}
                      aria-label={`이름으로 정렬, 현재: ${sortKey === 'name' ? (sortDirection === 'asc' ? '오름차순' : '내림차순') : '정렬 안됨'}`}
                    >
                      이름 {sortKey==='name' ? (sortDirection==='asc' ? '▲' : '▼') : ''}
                    </button>
                  </th>
                  <th className={`p-4 text-left align-top`}>
                    <button
                      className="inline-flex items-center gap-1 hover:underline text-purple-700 font-semibold touch-manipulation"
                      onClick={() => { toggleSort('phone'); setPage(1) }}
                    >
                      연락처 {sortKey==='phone' ? (sortDirection==='asc' ? '▲' : '▼') : ''}
                    </button>
                  </th>
                  <th className={`p-4 text-left align-top`}>
                    <button
                      className="inline-flex items-center gap-1 hover:underline text-blue-700 font-semibold touch-manipulation"
                      onClick={() => { toggleSort('email'); setPage(1) }}
                    >
                      이메일 {sortKey==='email' ? (sortDirection==='asc' ? '▲' : '▼') : ''}
                    </button>
                  </th>
                  <th className={`p-4 text-left align-top text-emerald-700 font-semibold`}>보유상품</th>
                  <th className={`p-4 text-right align-top text-amber-700 font-semibold whitespace-nowrap`}>포인트</th>
                  <th className={`p-4 text-center align-top text-indigo-700 font-semibold whitespace-nowrap`} scope="col">
                    상세보기
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`s-${i}`}>
                    <td className={false ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-40" /></td>
                    <td className={false ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-28" /></td>
                    <td className={false ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-32" /></td>
                    <td className={false ? 'p-3' : 'p-4'}><Skeleton className="h-8 w-24" /></td>
                    <td className={false ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className={false ? 'p-3' : 'p-4'}><Skeleton className="h-8 w-8 mx-auto" /></td>
                  </tr>
                ))}
                {!loading && paginatedRows.map((c, index) => (
                  <tr
                    key={c.id}
                    className={`outline-none min-h-[48px] transition-colors cursor-pointer touch-manipulation ${
                      index % 4 === 0 
                        ? 'bg-pink-50/50 hover:bg-pink-100' 
                        : index % 4 === 1 
                        ? 'bg-purple-50/50 hover:bg-purple-100'
                        : index % 4 === 2
                        ? 'bg-blue-50/50 hover:bg-blue-100'
                        : 'bg-emerald-50/50 hover:bg-emerald-100'
                    }`}
                    tabIndex={0}
                    onKeyDown={(e)=>{ if(e.key==='Enter'){ setSelected(c); setDetailOpen(true) }}}
                    onClick={() => { setSelected(c); setDetailOpen(true) }}
                  >
                    <td className={`p-4 text-left align-top font-medium`}>{c.name}</td>
                    <td className={`p-4 text-left align-top`}>{c.phone || '-'}</td>
                    <td className={`p-4 text-left align-top`}>{c.email || '-'}</td>
                    <td className={`p-4 text-left align-top`}>
                      <CustomerHoldingsBadge customerId={c.id} />
                    </td>
                    <td className={`p-4 text-right align-top whitespace-nowrap font-medium`}>
                      {Number(pointsByCustomer[c.id] ?? 0).toLocaleString()}
                    </td>
                    <td className={`p-4 text-center align-top`}>
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
                      setSelected(null)
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
                  {[10,20,50].map(s => <option key={s} value={s}>{s}/페이지</option>)}
                </select>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className="h-9 rounded-lg border border-neutral-300 px-4 text-sm bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 transition-all duration-fast touch-manipulation"
                  disabled={page===1}
                >
                  이전
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className="h-9 rounded-lg border border-neutral-300 px-4 text-sm bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-1 transition-all duration-fast touch-manipulation"
                  disabled={page>=totalPages}
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
      {detailOpen ? (
        <Suspense fallback={<div>로딩 중...</div>}>
          <CustomerDetailModal
            open={detailOpen}
            item={selected}
            onClose={() => setDetailOpen(false)}
            onSaved={load}
            onDeleted={load}
          />
        </Suspense>
      ) : null}
      
      {/* 모바일 FAB */}
      <FloatingActionButton
        onClick={() => {
          setSelected(null)
          setDetailOpen(true)
        }}
        label="새 고객 추가"
      />
      </div>
  )
}
