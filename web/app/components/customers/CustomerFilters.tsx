'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import Button from '../ui/Button'

export type CustomerFilterType =
  | 'all'
  | 'recent-visit'
  | 'program-active'
  | 'has-points'
  | 'birthday-soon'
  | 'long-no-visit'

interface CustomerFiltersProps {
  activeFilter: CustomerFilterType
  onFilterChange: (filter: CustomerFilterType) => void
}

export default function CustomerFilters({ activeFilter, onFilterChange }: CustomerFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const filters: { key: CustomerFilterType; label: string; description: string }[] = [
    { key: 'all', label: '전체', description: '모든 고객' },
    { key: 'recent-visit', label: '최근 방문', description: '최근 30일 이내 방문' },
    { key: 'program-active', label: '프로그램 진행 중', description: '시술 프로그램 진행 중' },
    { key: 'has-points', label: '포인트 보유', description: '포인트가 있는 고객' },
    { key: 'birthday-soon', label: '생일 임박', description: '다음 30일 내 생일' },
    { key: 'long-no-visit', label: '장기 미방문', description: '90일 이상 미방문' },
  ]

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Filter className="h-4 w-4" />}
        onClick={() => setShowFilters(!showFilters)}
      >
        필터
        {activeFilter !== 'all' && (
          <span className="ml-1 px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">
            {filters.find((f) => f.key === activeFilter)?.label}
          </span>
        )}
      </Button>

      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[200px]">
            <div className="p-2 border-b border-neutral-200 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">필터 선택</span>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-neutral-100 rounded"
              >
                <X className="h-4 w-4 text-neutral-400" />
              </button>
            </div>
            <div className="py-1">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => {
                    onFilterChange(filter.key)
                    setShowFilters(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                    activeFilter === filter.key ? 'bg-pink-50 text-pink-700 font-medium' : 'text-neutral-700'
                  }`}
                >
                  <div className="font-medium">{filter.label}</div>
                  <div className="text-xs text-neutral-500">{filter.description}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

