'use client'

/**
 * 페이지 데이터 로딩 및 상태 관리 훅
 */

import { useState, useEffect, useCallback } from 'react'

export interface UsePageDataOptions<T> {
  fetchFn: () => Promise<T>
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface UsePageDataReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  reset: () => void
}

/**
 * 페이지 데이터 로딩 및 상태 관리 훅
 *
 * @example
 * const { data, loading, error, refetch } = usePageData({
 *   fetchFn: () => customersApi.list(),
 *   immediate: true,
 * })
 */
export function usePageData<T>(
  options: UsePageDataOptions<T>
): UsePageDataReturn<T> {
  const { fetchFn, immediate = true, onSuccess, onError } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, onSuccess, onError])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [immediate, fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    reset,
  }
}

