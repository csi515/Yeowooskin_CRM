import { useMemo } from 'react'
import { useSort } from './useSort'
import { usePagination } from './usePagination'
import { type Customer } from '@/types/entities'
import { type CustomerFilters } from '@/types/customer'

export function useCustomerFilters(
  customers: Customer[],
  pointsByCustomer: Record<string, number>,
  filters: CustomerFilters
) {
  const { sortKey, sortDirection, toggleSort, sortFn } = useSort<Customer & Record<string, unknown>>({
    initialKey: 'name',
    initialDirection: 'asc',
  })

  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: customers.length,
  })

  const { page, pageSize, setPage, setPageSize } = pagination

  // Filter and sort logic
  const filteredRows = useMemo(() => {
    return customers.filter(customer => {
      const points = pointsByCustomer[customer.id] || 0

      // Status filter
      if (filters.statusFilter === 'active' && customer.active === false) return false
      if (filters.statusFilter === 'inactive' && customer.active !== false) return false

      // VIP filter (assuming VIP = points > 1000)
      if (filters.vipFilter === 'vip' && points <= 1000) return false
      if (filters.vipFilter === 'normal' && points > 1000) return false

      // Points range filter
      if (filters.minPoints && points < Number(filters.minPoints)) return false
      if (filters.maxPoints && points > Number(filters.maxPoints)) return false

      return true
    })
  }, [customers, pointsByCustomer, filters])

  // 정렬된 데이터
  const sortedRows = useMemo(() => {
    return sortFn(filteredRows as (Customer & Record<string, unknown>)[])
  }, [filteredRows, sortFn])

  // 페이지네이션된 데이터
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return sortedRows.slice(start, end)
  }, [sortedRows, page, pageSize])

  // Update totalPages based on filtered data
  const filteredTotalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))

  // 필터 초기화
  const resetFilters = () => {
    // Note: This function will be implemented in the component
    // as it needs to update the filters state
  }

  return {
    // Sorting
    sortKey,
    sortDirection,
    toggleSort,

    // Pagination
    page,
    pageSize,
    setPage,
    setPageSize,
    filteredTotalPages,

    // Filtered data
    filteredRows,
    paginatedRows,

    // Actions
    resetFilters,
  }
}
