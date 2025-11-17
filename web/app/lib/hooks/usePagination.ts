import { useState, useCallback, useEffect } from 'react'

type UsePaginationOptions = {
  initialPage?: number
  initialPageSize?: number
  totalItems?: number
}

type UsePaginationReturn = {
  page: number
  pageSize: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setTotalItems: (total: number) => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  canGoNext: boolean
  canGoPrevious: boolean
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalItems = 0
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [totalItemsState, setTotalItems] = useState(totalItems)

  const totalPages = Math.max(1, Math.ceil(totalItemsState / pageSize))

  // 페이지 범위 검증
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const goToFirstPage = useCallback(() => setPage(1), [])
  const goToLastPage = useCallback(() => setPage(totalPages), [totalPages])
  const goToNextPage = useCallback(() => {
    setPage((prev) => Math.min(totalPages, prev + 1))
  }, [totalPages])
  const goToPreviousPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1))
  }, [])

  const canGoNext = page < totalPages
  const canGoPrevious = page > 1

  return {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize: useCallback((size: number) => {
      setPageSize(size)
      setPage(1) // 페이지 크기 변경 시 첫 페이지로
    }, []),
    setTotalItems,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious
  }
}
