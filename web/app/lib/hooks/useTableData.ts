'use client'

import { useMemo } from 'react'
import { useSearch } from './useSearch'
import { useSort } from './useSort'
import { usePagination } from './usePagination'

export interface UseTableDataOptions<T> {
  data: T[]
  searchOptions?: {
    debounceMs?: number
    searchFields?: (keyof T)[]
    searchFn?: (item: T, query: string) => boolean
  }
  sortOptions?: {
    initialKey?: keyof T
    initialDirection?: 'asc' | 'desc'
  }
  paginationOptions?: {
    initialPage?: number
    initialPageSize?: number
  }
}

export interface UseTableDataReturn<T> {
  // 검색
  query: string
  debouncedQuery: string
  setQuery: (query: string) => void
  clearSearch: () => void

  // 정렬
  sortKey: keyof T | null
  sortDirection: 'asc' | 'desc'
  toggleSort: (key: keyof T) => void

  // 페이지네이션
  page: number
  pageSize: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void

  // 처리된 데이터
  filteredData: T[]
  sortedData: T[]
  paginatedData: T[]

  // 메타 정보
  totalItems: number
  showingFrom: number
  showingTo: number
}

/**
 * 테이블 데이터 관리 통합 훅
 * 검색, 정렬, 페이지네이션을 하나의 훅으로 통합
 * 
 * @example
 * const {
 *   query,
 *   setQuery,
 *   toggleSort,
 *   page,
 *   setPage,
 *   paginatedData,
 *   totalPages
 * } = useTableData({
 *   data: customers,
 *   searchOptions: { searchFields: ['name', 'email'] },
 *   sortOptions: { initialKey: 'name' },
 *   paginationOptions: { initialPageSize: 10 }
 * })
 */
export function useTableData<T extends Record<string, unknown>>(
  options: UseTableDataOptions<T>
): UseTableDataReturn<T> {
  const {
    data,
    searchOptions = {},
    sortOptions = {},
    paginationOptions = {},
  } = options

  const { searchFields = [], searchFn } = searchOptions

  // 검색 훅
  const search = useSearch({ debounceMs: searchOptions.debounceMs || 300 })

  // 정렬 훅
  const sort = useSort<T>(sortOptions)

  // 페이지네이션 훅
  const pagination = usePagination({
    ...paginationOptions,
    totalItems: 0, // 필터링 후 업데이트됨
  })

  // 검색 필터링
  const filteredData = useMemo(() => {
    if (!search.debouncedQuery.trim()) return data

    const query = search.debouncedQuery.trim().toLowerCase()

    if (searchFn) {
      return data.filter((item) => searchFn(item, query))
    }

    if (searchFields.length > 0) {
      return data.filter((item) => {
        return searchFields.some((field) => {
          const value = item[field]
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }

    // 기본 검색: 모든 문자열 필드 검색
    return data.filter((item) => {
      return Object.values(item).some((value) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query)
        }
        return false
      })
    })
  }, [data, search.debouncedQuery, searchFields, searchFn])

  // 정렬된 데이터
  const { sortFn } = sort
  const sortedData = useMemo(() => {
    return sortFn(filteredData)
  }, [filteredData, sortFn])

  // 페이지네이션 정보 업데이트
  const totalItems = sortedData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize))

  // 페이지 범위 조정
  const adjustedPage = Math.min(pagination.page, totalPages)

  // 페이지네이션된 데이터
  const paginatedData = useMemo(() => {
    const start = (adjustedPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return sortedData.slice(start, end)
  }, [sortedData, adjustedPage, pagination.pageSize])

  const showingFrom = totalItems === 0 ? 0 : (adjustedPage - 1) * pagination.pageSize + 1
  const showingTo = Math.min(adjustedPage * pagination.pageSize, totalItems)

  return {
    // 검색
    query: search.query,
    debouncedQuery: search.debouncedQuery,
    setQuery: search.setQuery,
    clearSearch: search.clear,

    // 정렬
    sortKey: sort.sortKey,
    sortDirection: sort.sortDirection,
    toggleSort: sort.toggleSort,

    // 페이지네이션
    page: adjustedPage,
    pageSize: pagination.pageSize,
    totalPages,
    setPage: pagination.setPage,
    setPageSize: pagination.setPageSize,

    // 처리된 데이터
    filteredData,
    sortedData,
    paginatedData,

    // 메타 정보
    totalItems,
    showingFrom,
    showingTo,
  }
}

