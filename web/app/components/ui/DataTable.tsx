/**
 * 재사용 가능한 데이터 테이블 컴포넌트
 */

'use client'

import { useMemo } from 'react'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T, index: number) => void
  sortKey?: keyof T | string | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: keyof T | string) => void
  className?: string
}

/**
 * 재사용 가능한 데이터 테이블 컴포넌트
 *
 * @example
 * <DataTable
 *   columns={[
 *     { key: 'name', header: '이름', sortable: true },
 *     { key: 'email', header: '이메일' },
 *   ]}
 *   data={customers}
 *   loading={loading}
 *   onRowClick={(item) => console.log(item)}
 * />
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = '데이터가 없습니다.',
  onRowClick,
  sortKey,
  sortDirection,
  onSort,
  className = '',
}: DataTableProps<T>) {
  const sortedData = useMemo(() => {
    if (!sortKey || !onSort) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortKey as keyof T]
      const bVal = b[sortKey as keyof T]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal)
      const bStr = String(bVal)
      const comparison = aStr.localeCompare(bStr, 'ko', { numeric: true })

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection, onSort])

  if (loading) {
    return (
      <div className={`overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-md ${className}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-sm font-medium text-neutral-900 bg-neutral-100 border-b border-neutral-200"
                  style={{ width: col.width }}
                >
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="hover:bg-neutral-50 transition-colors duration-300">
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 border-b border-neutral-200">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`text-center py-12 text-neutral-500 ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-md ${className}`}>
      <table className="w-full border-collapse" role="table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 text-sm font-medium text-neutral-900 bg-neutral-100 border-b border-neutral-200 transition-colors duration-300 ${
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                } ${col.sortable && onSort ? 'cursor-pointer hover:bg-neutral-50' : ''}`}
                style={{ width: col.width }}
                onClick={() => col.sortable && onSort && onSort(col.key)}
                role="columnheader"
                aria-sort={
                  col.sortable && sortKey === col.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-xs text-[#F472B6]">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-neutral-200 transition-colors duration-300 ${
                onRowClick ? 'cursor-pointer hover:bg-neutral-50 active:bg-neutral-100' : ''
              }`}
              onClick={() => onRowClick?.(item, rowIdx)}
              role="row"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-4 py-3 text-sm text-neutral-800 ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.render ? col.render(item, rowIdx) : String(item[col.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

