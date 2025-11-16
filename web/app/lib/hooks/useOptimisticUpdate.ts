'use client'

import { useState, useCallback, useRef } from 'react'

type OptimisticUpdateOptions<T> = {
  onSuccess?: (result: T) => void
  onError?: (error: Error) => void
  rollbackOnError?: boolean
}

export function useOptimisticUpdate<T, U = T>(
  initialValue: T,
  updateFn: (value: T, optimistic: U) => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) {
  const { onSuccess, onError, rollbackOnError = true } = options
  const [value, setValue] = useState<T>(initialValue)
  const [isUpdating, setIsUpdating] = useState(false)
  const rollbackRef = useRef<T>(initialValue)

  const update = useCallback(
    async (optimisticValue: U) => {
      const previousValue = value
      rollbackRef.current = previousValue
      
      // Optimistic update
      setValue(updateFn(previousValue, optimisticValue) as unknown as T)
      setIsUpdating(true)

      try {
        // Actual update
        const result = await updateFn(previousValue, optimisticValue)
        setValue(result)
        setIsUpdating(false)
        onSuccess?.(result)
        return result
      } catch (error) {
        // Rollback on error
        if (rollbackOnError) {
          setValue(rollbackRef.current)
        }
        setIsUpdating(false)
        const err = error instanceof Error ? error : new Error(String(error))
        onError?.(err)
        throw err
      }
    },
    [value, updateFn, onSuccess, onError, rollbackOnError]
  )

  const reset = useCallback(() => {
    setValue(initialValue)
    rollbackRef.current = initialValue
  }, [initialValue])

  return {
    value,
    update,
    reset,
    isUpdating,
  }
}

// Helper hook for simple optimistic updates
export function useOptimisticState<T>(
  initialValue: T,
  updateFn: (value: T) => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) {
  return useOptimisticUpdate(
    initialValue,
    async (_current, optimistic) => {
      // Actual update
      return await updateFn(optimistic)
    },
    options
  )
}
