'use client'

import { Pencil } from 'lucide-react'
import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  Typography,
  Paper,
  Stack,
  Pagination,
  IconButton,
  Chip
} from '@mui/material'
import { Skeleton } from '../ui/Skeleton'
import EmptyState from '../EmptyState'
import { FinanceCombinedRow } from '@/types/finance'

interface FinanceDesktopTableProps {
  loading: boolean
  pagedCombined: FinanceCombinedRow[]
  combined: FinanceCombinedRow[]
  sortKey: 'date' | 'amount'
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
  onSortToggle: (key: 'date' | 'amount') => void
  onPageChange: (page: number) => void
  onItemClick: (row: FinanceCombinedRow) => void
}

export default function FinanceDesktopTable({
  loading,
  pagedCombined,
  combined,
  sortKey,
  sortDir,
  page,
  pageSize,
  onSortToggle,
  onPageChange,
  onItemClick
}: FinanceDesktopTableProps) {
  return (
    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3, display: { xs: 'none', md: 'block' } }}>
      <Box p={2} borderBottom={1} borderColor="divider">
        <Typography fontWeight="bold">수입/지출 내역</Typography>
      </Box>
      <Table>
        <TableHead sx={{ bgcolor: 'neutral.50' }}>
          <TableRow>
            <TableCell sortDirection={sortKey === 'date' ? sortDir : false}>
              <TableSortLabel
                active={sortKey === 'date'}
                direction={sortKey === 'date' ? sortDir : 'asc'}
                onClick={() => onSortToggle('date')}
              >
                일자
              </TableSortLabel>
            </TableCell>
            <TableCell>유형</TableCell>
            <TableCell align="right" sortDirection={sortKey === 'amount' ? sortDir : false}>
              <TableSortLabel
                active={sortKey === 'amount'}
                direction={sortKey === 'amount' ? sortDir : 'asc'}
                onClick={() => onSortToggle('amount')}
              >
                금액
              </TableSortLabel>
            </TableCell>
            <TableCell>메모/카테고리</TableCell>
            <TableCell align="center">관리</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={5}><Skeleton className="h-10" /></TableCell>
            </TableRow>
          ))}
          {!loading && pagedCombined.map(row => (
            <TableRow key={`${row.type}-${row.id}`} hover>
              <TableCell>{row.date}</TableCell>
              <TableCell>
                <Chip
                  label={row.type === 'income' ? '수입' : '지출'}
                  size="small"
                  color={row.type === 'income' ? 'success' : 'error'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: row.type === 'income' ? 'success.main' : 'error.main' }}>
                ₩{Number(row.amount || 0).toLocaleString()}
              </TableCell>
              <TableCell>{row.note || '-'}</TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={() => onItemClick(row)}
                  aria-label="편집"
                >
                  <Pencil className="h-4 w-4" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {!loading && combined.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                <EmptyState title="데이터가 없습니다." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* 데스크톱 페이지네이션 */}
      {!loading && combined.length > 0 && (
        <Stack direction="row" justifyContent="flex-end" p={2}>
          <Pagination
            count={Math.ceil(combined.length / pageSize)}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
          />
        </Stack>
      )}
    </TableContainer>
  )
}
