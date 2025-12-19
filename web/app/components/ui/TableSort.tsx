'use client'

import React from 'react'
import TableSortLabel from '@mui/material/TableSortLabel'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'
import { visuallyHidden } from '@mui/utils'

export type SortDirection = 'asc' | 'desc' | null

type Props = {
  children: React.ReactNode
  sortable?: boolean
  direction?: SortDirection
  onSort?: (direction: SortDirection) => void
  className?: string
}

export default function TableSort({
  children,
  sortable = false,
  direction = null,
  onSort,
  className = '',
}: Props) {
  const createSortHandler = () => () => {
    if (!onSort) return
    // Cycle: null -> asc -> desc -> null
    if (direction === null) onSort('asc')
    else if (direction === 'asc') onSort('desc')
    else onSort(null)
  }

  if (!sortable) {
    return (
      <TableCell variant="head" sx={{ fontWeight: 600, color: 'text.secondary' }} className={className}>
        {children}
      </TableCell>
    )
  }

  return (
    <TableCell
      variant="head"
      sortDirection={direction === null ? false : direction}
      sx={{ fontWeight: 600, color: 'text.secondary' }}
      className={className}
    >
      <TableSortLabel
        active={direction !== null}
        direction={direction === null ? 'asc' : direction}
        onClick={createSortHandler()}
      >
        {children}
        {direction ? (
          <Box component="span" sx={{ ...visuallyHidden as any }}>
            {direction === 'desc' ? 'sorted descending' : 'sorted ascending'}
          </Box>
        ) : null}
      </TableSortLabel>
    </TableCell>
  )
}
