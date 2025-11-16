'use client'

/**
 * 검색 기능 훅
 */

import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from './useDebounce'

export interface UseSearchOptions {
  debounceMs?: number
  minLength?: number
}

export interface UseSearchReturn {
  query: string
  debouncedQuery: string
  setQuery: (query: string) => void
  clear: () => void
  isEmpty: boolean
}

/**
 * 검색어 상태 관리 훅 (디바운싱 포함)
 *
 * @example
 * const { query, debouncedQuery, setQuery } = useSearch({ debounceMs: 300 })
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, minLength = 0 } = options
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, debounceMs)

  const isEmpty = useMemo(() => {
    return query.trim().length === 0
  }, [query])

  const clear = () => {
    setQuery('')
  }

  return {
    query,
    debouncedQuery,
    setQuery,
    clear,
    isEmpty,
  }
}

