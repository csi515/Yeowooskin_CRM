'use client'

import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Skeleton } from './Skeleton'

type Column<T> = {
  key: string
  label: string
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  mobileHidden?: boolean
  tabletHidden?: boolean
  className?: string
  align?: 'left' | 'center' | 'right'
}

type Props<T> = {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  keyExtractor: (item: T) => string
  className?: string
  dense?: boolean
  sortKey?: string | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string) => void
}

export default function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = '데이터가 없습니다.',
  onRowClick,
  keyExtractor,
  className,
  dense = false,
  sortKey,
  sortDirection,
  onSort
}: Props<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const visibleColumns = useMemo(() => columns.filter(col => !col.mobileHidden), [columns])
  const mobileColumns = useMemo(() => columns.filter(col => !col.mobileHidden && !col.tabletHidden), [columns])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={clsx(
                      dense ? 'px-4 py-3' : 'px-6 py-4',
                      'text-left font-semibold text-neutral-700',
                      col.className
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className={dense ? 'px-4 py-3' : 'px-6 py-4'}>
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lg:hidden space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={clsx('bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden', className)}>
      {/* 데스크톱 테이블 뷰 */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead className="bg-neutral-50 border-b-2 border-neutral-200 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    dense ? 'px-4 py-3' : 'px-6 py-4',
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    'font-semibold text-neutral-700',
                    col.sortable && onSort ? 'cursor-pointer hover:bg-neutral-100 transition-colors' : '',
                    col.className
                  )}
                  scope="col"
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                  role={col.sortable ? 'button' : undefined}
                  aria-sort={
                    col.sortable && sortKey === col.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-xs text-secondary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((item, index) => {
              const key = keyExtractor(item)
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={clsx(
                    'transition-colors hover:bg-neutral-50',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        dense ? 'px-4 py-3' : 'px-6 py-4',
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                        col.className
                      )}
                    >
                      {col.render ? col.render(item, index) : String(item[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 태블릿/모바일 카드 뷰 */}
      <div className="lg:hidden">
        <div className="divide-y divide-neutral-200">
          {data.map((item, index) => {
            const key = keyExtractor(item)
            const isExpanded = expandedRows.has(key)
            const primaryCol = visibleColumns[0]
            const secondaryCols = visibleColumns.slice(1, 3)
            const hiddenCols = visibleColumns.slice(3)

            return (
              <div
                key={key}
                className={clsx(
                  'p-4 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-neutral-50'
                )}
                onClick={() => !hiddenCols.length && onRowClick?.(item)}
              >
                {/* 주요 정보 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {primaryCol && (
                      <div className="font-semibold text-neutral-900 truncate">
                        {primaryCol.render ? primaryCol.render(item, index) : item[primaryCol.key]}
                      </div>
                    )}
                    {secondaryCols.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-neutral-600">
                        {secondaryCols.map((col) => (
                          <div key={col.key} className="truncate">
                            <span className="font-medium">{col.label}:</span>{' '}
                            {col.render ? col.render(item, index) : item[col.key]}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {hiddenCols.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleRow(key)
                      }}
                      className="p-1 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
                      aria-label={isExpanded ? '접기' : '펼치기'}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-neutral-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-neutral-600" />
                      )}
                    </button>
                  )}
                </div>

                {/* 확장 정보 */}
                {isExpanded && hiddenCols.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
                    {hiddenCols.map((col) => (
                      <div key={col.key} className="flex justify-between text-sm">
                        <span className="font-medium text-neutral-700">{col.label}:</span>
                        <span className="text-neutral-900">
                          {col.render ? col.render(item, index) : item[col.key]}
                        </span>
                      </div>
                    ))}
                    {onRowClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRowClick(item)
                        }}
                        className="mt-3 w-full py-2 px-4 text-sm font-semibold text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                      >
                        상세보기
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
