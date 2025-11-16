'use client'

/**
 * API 호출 및 로딩 상태 관리 훅
 */

import React, { useState, useCallback } from 'react'

export interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  immediate?: boolean
}

export interface UseApiReturn<T, P extends any[] = []> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (...args: P) => Promise<T | undefined>
  reset: () => void
}

/**
 * API 호출 및 상태 관리 훅
 * 
 * @example
 * const { data, loading, error, execute } = useApi(
 *   (id: string) => customersApi.get(id),
 *   { immediate: false }
 * )
 * 
 * useEffect(() => {
 *   execute('customer-id')
 * }, [])
 */
export function useApi<T, P extends any[] = []>(
  apiFunction: (...args: P) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const { onSuccess, onError, immediate = false } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (...args: P): Promise<T | undefined> => {
      try {
        setLoading(true)
        setError(null)
        const result = await apiFunction(...args)
        setData(result)
        onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [apiFunction, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}

/**
 * 즉시 실행되는 API 호출 훅
 * 
 * @example
 * const { data, loading, error } = useApiImmediate(
 *   () => customersApi.list(),
 *   [searchQuery] // dependencies
 * )
 */
export function useApiImmediate<T>(
  apiFunction: () => Promise<T>,
  deps: React.DependencyList = []
): Omit<UseApiReturn<T>, 'execute' | 'reset'> {
  const { data, loading, error, execute, reset } = useApi(apiFunction, { immediate: true })

  React.useEffect(() => {
    execute()
    return () => reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

