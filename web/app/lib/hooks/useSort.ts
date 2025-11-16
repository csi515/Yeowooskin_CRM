'use client'

/**
 * 정렬 기능 훅
 */

import { useState, useMemo } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface UseSortOptions<T> {
  initialKey?: keyof T
  initialDirection?: SortDirection
}

export interface UseSortReturn<T> {
  sortKey: keyof T | null
  sortDirection: SortDirection
  setSortKey: (key: keyof T | null) => void
  setSortDirection: (direction: SortDirection) => void
  toggleSort: (key: keyof T) => void
  sortFn: <K extends T>(items: K[]) => K[]
  reset: () => void
}

/**
 * 정렬 상태 관리 훅
 *
 * @example
 * const { sortKey, sortDirection, toggleSort, sortFn } = useSort<Item>({
 *   initialKey: 'name',
 *   initialDirection: 'asc',
 * })
 * const sortedItems = sortFn(items)
 */
export function useSort<T extends Record<string, unknown>>(
  options: UseSortOptions<T> = {}
): UseSortReturn<T> {
  const { initialKey = undefined, initialDirection = 'asc' } = options

  const [sortKey, setSortKeyState] = useState<keyof T | null>(initialKey || null)
  const [sortDirection, setSortDirectionState] = useState<SortDirection>(initialDirection)

  const setSortKey = (key: keyof T | null) => {
    setSortKeyState(key)
  }

  const setSortDirection = (direction: SortDirection) => {
    setSortDirectionState(direction)
  }

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) {
      // 같은 키를 클릭하면 방향 토글
      setSortDirectionState((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      // 다른 키를 클릭하면 키 변경 및 기본 방향 설정
      setSortKeyState(key)
      setSortDirectionState('asc')
    }
  }

  const sortFn = useMemo(() => {
    return <K extends T>(items: K[]): K[] => {
      if (!sortKey) return items

      return [...items].sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]

        // null/undefined 처리
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        // 숫자 비교
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        }

        // 문자열 비교
        const aStr = String(aVal)
        const bStr = String(bVal)
        const comparison = aStr.localeCompare(bStr, 'ko', { numeric: true })

        return sortDirection === 'asc' ? comparison : -comparison
      })
    }
  }, [sortKey, sortDirection])

  const reset = () => {
    setSortKeyState(initialKey || null)
    setSortDirectionState(initialDirection)
  }

  return {
    sortKey,
    sortDirection,
    setSortKey,
    setSortDirection,
    toggleSort,
    sortFn,
    reset,
  }
}

