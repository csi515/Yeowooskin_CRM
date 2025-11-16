'use client'

/**
 * 페이지네이션 훅
 */

import { useState, useMemo } from 'react'

export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  totalItems?: number
}

export interface UsePaginationReturn {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  prevPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  hasNextPage: boolean
  hasPrevPage: boolean
  offset: number
}

/**
 * 페이지네이션 상태 관리 훅
 *
 * @example
 * const { page, pageSize, totalPages, setPage } = usePagination({
 *   initialPage: 1,
 *   initialPageSize: 10,
 *   totalItems: 100,
 * })
 */
export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    totalItems: initialTotalItems = 0,
  } = options

  const [page, setPageState] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const [totalItems, setTotalItems] = useState(initialTotalItems)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize))
  }, [totalItems, pageSize])

  const offset = useMemo(() => {
    return (page - 1) * pageSize
  }, [page, pageSize])

  const hasNextPage = useMemo(() => {
    return page < totalPages
  }, [page, totalPages])

  const hasPrevPage = useMemo(() => {
    return page > 1
  }, [page])

  const setPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageState(newPage)
    }
  }

  const setPageSize = (newPageSize: number) => {
    if (newPageSize > 0) {
      setPageSizeState(newPageSize)
      // 페이지 크기 변경 시 현재 페이지가 유효한 범위 내에 있는지 확인
      const newTotalPages = Math.max(1, Math.ceil(totalItems / newPageSize))
      if (page > newTotalPages) {
        setPageState(newTotalPages)
      }
    }
  }

  const nextPage = () => {
    if (hasNextPage) {
      setPageState((prev) => prev + 1)
    }
  }

  const prevPage = () => {
    if (hasPrevPage) {
      setPageState((prev) => prev - 1)
    }
  }

  const goToFirstPage = () => {
    setPageState(1)
  }

  const goToLastPage = () => {
    setPageState(totalPages)
  }

  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    hasNextPage,
    hasPrevPage,
    offset,
  }
}

