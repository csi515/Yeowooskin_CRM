/**
 * 데이터 페칭 훅
 * 반복되는 로딩/에러 상태 관리 패턴 통합
 */

import { useState, useCallback, useEffect } from 'react'
import { useAppToast } from '../ui/toast'

interface UseFetchDataOptions<T> {
  fetchFn: () => Promise<T>
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  showToast?: boolean
  errorTitle?: string
}

interface UseFetchDataReturn<T> {
  data: T | null
  loading: boolean
  error: string
  refetch: () => Promise<void>
  reset: () => void
}

/**
 * 데이터 페칭 훅
 * 
 * @example
 * const { data, loading, error, refetch } = useFetchData({
 *   fetchFn: () => fetch('/api/data').then(r => r.json()),
 *   immediate: true,
 * })
 */
export function useFetchData<T>(
  options: UseFetchDataOptions<T>
): UseFetchDataReturn<T> {
  const {
    fetchFn,
    immediate = true,
    onSuccess,
    onError,
    showToast = true,
    errorTitle = '로드 실패',
  } = options

  const toast = useAppToast()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const result = await fetchFn()
      setData(result)
      onSuccess?.(result)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.'
      setError(errorMessage)
      if (showToast) {
        toast.error(errorTitle, errorMessage)
      }
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setLoading(false)
    }
  }, [fetchFn, onSuccess, onError, showToast, errorTitle, toast])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const reset = useCallback(() => {
    setData(null)
    setError('')
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

