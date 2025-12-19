/**
 * 재사용 가능한 데이터 테이블 컴포넌트
 */

'use client'

import { useMemo, ReactNode } from 'react'
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  Card,
  Divider,
} from '@mui/material'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T, index: number) => ReactNode
  sortable?: boolean
  width?: string | number
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
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <MuiTable sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              {columns.map((_, idx) => (
                <TableCell key={idx} sx={{ fontWeight: 700, py: 2 }}>
                  <Skeleton width={80} height={20} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={idx}>
                {columns.map((_, colIdx) => (
                  <TableCell key={colIdx} sx={{ py: 2 }}>
                    <Skeleton width="100%" height={20} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>
    )
  }

  if (data.length === 0) {
    return (
      <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {/* 모바일 카드 뷰 */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }} className={className}>
        {sortedData.map((item, rowIdx) => (
          <Card
            key={rowIdx}
            variant="outlined"
            onClick={() => onRowClick?.(item, rowIdx)}
            sx={{
              p: 2.5,
              borderRadius: 3,
              cursor: onRowClick ? 'pointer' : 'default',
              transition: 'all 200ms ease',
              '&:hover': onRowClick ? { boxShadow: (theme) => theme.shadows[2], transform: 'translateY(-2px)' } : {},
              '&:active': onRowClick ? { transform: 'scale(0.98)' } : {},
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {columns.map((col, colIdx) => {
                const value = col.render ? col.render(item, rowIdx) : String(item[col.key as keyof T] ?? '')
                const isPrimary = colIdx === 0

                if (isPrimary) {
                  return (
                    <Box key={colIdx} sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                        {value}
                      </Typography>
                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  )
                }

                return (
                  <Box key={colIdx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {col.header}
                    </Typography>
                    <Box sx={{ textAlign: 'right', maxWidth: '70%' }}>
                      <Typography variant="body2" fontWeight={500}>
                        {value}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Card>
        ))}
      </Box>

      {/* 데스크톱 테이블 뷰 */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          display: { xs: 'none', md: 'block' },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
        }}
        className={className}
      >
        <MuiTable stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell
                  key={idx}
                  align={col.align || 'left'}
                  sortDirection={sortKey === col.key && sortDirection ? sortDirection : false}
                  sx={{
                    fontWeight: 700,
                    bgcolor: 'action.hover',
                    py: 2,
                    width: col.width,
                    borderBottom: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  {col.sortable && onSort ? (
                    <TableSortLabel
                      active={sortKey === col.key}
                      direction={sortKey === col.key && sortDirection ? sortDirection : 'asc'}
                      onClick={() => onSort(col.key)}
                    >
                      {col.header}
                    </TableSortLabel>
                  ) : (
                    col.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((item, rowIdx) => (
              <TableRow
                key={rowIdx}
                hover
                onClick={() => onRowClick?.(item, rowIdx)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                {columns.map((col, colIdx) => (
                  <TableCell
                    key={colIdx}
                    align={col.align || 'left'}
                    sx={{ py: 2, typography: 'body2', color: 'text.primary' }}
                  >
                    {col.render ? col.render(item, rowIdx) : String(item[col.key as keyof T] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>
    </>
  )
}

