'use client'

import { Pencil } from 'lucide-react'
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  Paper,
  IconButton,
  Checkbox,
  Chip,
  Skeleton
} from '@mui/material'
import EmptyState from '../EmptyState'
import CustomerHoldingsBadge from '../CustomerHoldingsBadge'
import { type Customer } from '@/types/entities'

interface CustomerTableProps {
  customers: Customer[]
  paginatedCustomers: Customer[]
  loading: boolean
  selectedCustomerIds: string[]
  onSelectedCustomerIdsChange: (ids: string[]) => void
  pointsByCustomer: Record<string, number>
  sortKey: string
  sortDirection: 'asc' | 'desc'
  onSortToggle: (key: string) => void
  onCustomerClick: (customer: Customer) => void
  onCreateCustomer: () => void
}

export default function CustomerTable({
  customers,
  paginatedCustomers,
  loading,
  selectedCustomerIds,
  onSelectedCustomerIdsChange,
  pointsByCustomer,
  sortKey,
  sortDirection,
  onSortToggle,
  onCustomerClick,
  onCreateCustomer
}: CustomerTableProps) {
  return (
    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3, display: { xs: 'none', md: 'block' } }}>
      <Table role="table" aria-label="고객 목록 테이블">
        <TableHead sx={{ bgcolor: 'neutral.50' }}>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={paginatedCustomers.length > 0 && selectedCustomerIds.length === paginatedCustomers.length}
                indeterminate={selectedCustomerIds.length > 0 && selectedCustomerIds.length < paginatedCustomers.length}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.checked) {
                    onSelectedCustomerIdsChange(paginatedCustomers.map(c => c.id))
                  } else {
                    onSelectedCustomerIdsChange([])
                  }
                }}
              />
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortKey === 'name'}
                direction={sortKey === 'name' ? sortDirection : 'asc'}
                onClick={() => onSortToggle('name')}
              >
                이름
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortKey === 'phone'}
                direction={sortKey === 'phone' ? sortDirection : 'asc'}
                onClick={() => onSortToggle('phone')}
              >
                연락처
              </TableSortLabel>
            </TableCell>
            <TableCell>이메일</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>보유상품</TableCell>
            <TableCell align="right">포인트</TableCell>
            <TableCell align="center">관리</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={7}>
                <Skeleton className="h-10" aria-label="고객 데이터 로딩 중" />
              </TableCell>
            </TableRow>
          ))}
          {!loading && paginatedCustomers.map((c) => (
            <TableRow
              key={c.id}
              hover
              sx={{ cursor: 'pointer' }}
              tabIndex={0}
              role="button"
              aria-label={`${c.name} 고객 정보`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onCustomerClick(c)
                }
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedCustomerIds.includes(c.id)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.stopPropagation()
                    if (e.target.checked) {
                      onSelectedCustomerIdsChange([...selectedCustomerIds, c.id])
                    } else {
                      onSelectedCustomerIdsChange(selectedCustomerIds.filter(id => id !== c.id))
                    }
                  }}
                />
              </TableCell>
              <TableCell
                title={c.name}
                sx={{ fontWeight: 500 }}
                onClick={() => onCustomerClick(c)}
              >
                {c.name}
              </TableCell>
              <TableCell onClick={() => onCustomerClick(c)}>{c.phone || '-'}</TableCell>
              <TableCell onClick={() => onCustomerClick(c)}>{c.email || '-'}</TableCell>
              <TableCell onClick={() => onCustomerClick(c)}>
                <Chip
                  label={c.active !== false ? '활성' : '비활성'}
                  size="small"
                  color={c.active !== false ? 'success' : 'default'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell onClick={() => onCustomerClick(c)}><CustomerHoldingsBadge customerId={c.id} /></TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.main' }} onClick={() => onCustomerClick(c)}>
                {Number(pointsByCustomer[c.id] ?? 0).toLocaleString()}
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onCustomerClick(c) }}
                  aria-label="고객 수정"
                  sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}
                >
                  <Pencil className="h-4 w-4" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {!loading && customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                <EmptyState
                  title="고객 데이터가 없습니다."
                  actionLabel="새 고객"
                  actionOnClick={onCreateCustomer}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
