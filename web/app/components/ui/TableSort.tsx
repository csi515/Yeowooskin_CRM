'use client'

import clsx from 'clsx'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

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
  className,
}: Props) {
  if (!sortable) {
    return <th className={clsx('text-left p-3 text-neutral-600', className)}>{children}</th>
  }

  const handleClick = () => {
    if (!onSort) return
    
    if (direction === null) {
      onSort('asc')
    } else if (direction === 'asc') {
      onSort('desc')
    } else {
      onSort(null)
    }
  }

  const getIcon = () => {
    if (direction === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />
    } else if (direction === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1" />
    } else {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-neutral-400" />
    }
  }

  return (
    <th
      className={clsx(
        'text-left p-3 text-neutral-600 cursor-pointer select-none hover:bg-neutral-100 transition-colors',
        direction && 'bg-neutral-50',
        className
      )}
      onClick={handleClick}
      role="columnheader"
      aria-sort={
        direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'
      }
    >
      <div className="flex items-center">
        {children}
        {getIcon()}
      </div>
    </th>
  )
}
