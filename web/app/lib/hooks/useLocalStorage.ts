'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * 로컬 스토리지 관리 훅
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`로컬 스토리지 읽기 실패 (${key}):`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.error(`로컬 스토리지 저장 실패 (${key}):`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue] as const
}
