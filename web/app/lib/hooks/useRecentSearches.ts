'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'crm_recent_searches'
const MAX_RECENT_SEARCHES = 10

export interface RecentSearch {
  query: string
  timestamp: number
  type?: 'customer' | 'appointment' | 'product'
}

/**
 * 최근 검색 기록 관리 훅
 */
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

  // 로컬 스토리지에서 최근 검색 기록 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[]
        setRecentSearches(parsed)
      }
    } catch (err) {
      console.error('최근 검색 기록 로드 실패:', err)
    }
  }, [])

  // 검색 기록 추가
  const addSearch = useCallback((query: string, type?: RecentSearch['type']) => {
    if (!query.trim()) return

    setRecentSearches((prev) => {
      // 중복 제거
      const filtered = prev.filter((item) => item.query !== query.trim())
      const newSearch: RecentSearch = {
        query: query.trim(),
        timestamp: Date.now(),
        type,
      }
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES)

      // 로컬 스토리지에 저장
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (err) {
        console.error('최근 검색 기록 저장 실패:', err)
      }

      return updated
    })
  }, [])

  // 검색 기록 삭제
  const removeSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.query !== query)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (err) {
        console.error('최근 검색 기록 저장 실패:', err)
      }
      return updated
    })
  }, [])

  // 모든 검색 기록 삭제
  const clearSearches = useCallback(() => {
    setRecentSearches([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.error('최근 검색 기록 삭제 실패:', err)
    }
  }, [])

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  }
}

