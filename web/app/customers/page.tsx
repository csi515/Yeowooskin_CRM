"use client"

import { Pencil, Plus } from 'lucide-react'
import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import EmptyState from '../components/EmptyState'
import { Skeleton, GridSkeleton } from '../components/ui/Skeleton'
import FilterBar from '../components/filters/FilterBar'
import CustomerHoldingsBadge from '../components/CustomerHoldingsBadge'
import Button from '../components/ui/Button'
import SearchInput from '../components/ui/SearchInput'
import ResponsiveTable from '../components/ui/ResponsiveTable'
import Pagination from '../components/ui/Pagination'
import type { Customer } from '@/types/entities'
import { useSearch } from '../lib/hooks/useSearch'
import { usePagination } from '../lib/hooks/usePagination'
import { useSort } from '../lib/hooks/useSort'

const CustomerDetailModal = lazy(() => import('../components/modals/CustomerDetailModal'))

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([])
  const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const { sortKey, sortDirection, toggleSort, sortFn } = useSort<Customer & Record<string, unknown>>({
    initialKey: 'name',
    initialDirection: 'asc',
  })
  
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 20,
    totalItems: rows.length,
  })
  const { page, pageSize, setPage, setPageSize, totalPages } = pagination
  
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

  // 페이지네이션 totalItems 업데이트
  useEffect(() => {
    pagination.setTotalItems?.(rows.length)
  }, [rows.length])

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

  const columns = [
    {
      key: 'name',
      label: '이름',
      render: (item: Customer) => (
        <div className="font-semibold text-neutral-900">{item.name}</div>
      ),
      sortable: true,
      mobileHidden: false,
      tabletHidden: false,
    },
    {
      key: 'phone',
      label: '연락처',
      render: (item: Customer) => <div className="text-neutral-600">{item.phone || '-'}</div>,
      sortable: true,
      mobileHidden: true,
      tabletHidden: false,
    },
    {
      key: 'email',
      label: '이메일',
      render: (item: Customer) => <div className="text-neutral-600">{item.email || '-'}</div>,
      sortable: true,
      mobileHidden: true,
      tabletHidden: true,
    },
    {
      key: 'holdings',
      label: '보유상품',
      render: (item: Customer) => <CustomerHoldingsBadge customerId={item.id} />,
      mobileHidden: true,
      tabletHidden: false,
    },
    {
      key: 'points',
      label: '포인트',
      render: (item: Customer) => (
        <div className="text-right font-medium text-amber-700">
          {Number(pointsByCustomer[item.id] || 0).toLocaleString()}
        </div>
      ),
      mobileHidden: true,
      tabletHidden: true,
      className: 'text-right',
    },
    {
      key: 'actions',
      label: '작업',
      render: (item: Customer) => (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              setSelected(item)
              setDetailOpen(true)
            }}
            aria-label="상세보기"
            className="h-9 w-9 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
      mobileHidden: false,
      tabletHidden: false,
      className: 'text-center',
    },
  ]

  return (
    <main className="space-y-4 md:space-y-5">
      <FilterBar>
        <div className="flex flex-wrap items-end gap-3 md:gap-4 w-full">
          <div className="flex-1 min-w-0 sm:min-w-[280px]">
            <label className="block mb-2 text-sm font-semibold text-neutral-700">검색</label>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="이름, 이메일 또는 전화번호로 검색"
            />
          </div>
          <div className="w-full sm:w-auto">
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
      </FilterBar>

      {error && <p className="text-sm text-error-600">{error}</p>}

      {/* 반응형 테이블 */}
      <ResponsiveTable
        data={paginatedRows}
        columns={columns}
        loading={loading}
        emptyMessage="고객 데이터가 없습니다."
        onRowClick={(item) => {
          setSelected(item)
          setDetailOpen(true)
        }}
        keyExtractor={(item) => item.id}
        dense={false}
        sortKey={sortKey as string}
        sortDirection={sortDirection}
        onSort={(key) => {
          toggleSort(key as keyof Customer)
          setPage(1)
        }}
      />

      {/* 페이지네이션 */}
      {rows.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={rows.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        />
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
