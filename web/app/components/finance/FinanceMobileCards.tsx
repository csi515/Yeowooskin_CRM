'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Pagination
} from '@mui/material'
import { Skeleton } from '../ui/Skeleton'
import EmptyState from '../EmptyState'
import { FinanceCombinedRow } from '@/types/finance'

// 금액 포맷팅 함수
const formatAmount = (amount: number): string => {
  if (amount >= 100000000) { // 1억 이상
    return `${(amount / 100000000).toFixed(1)}억`
  } else if (amount >= 10000) { // 1만 이상
    return `${(amount / 10000).toFixed(0)}만`
  }
  return amount.toLocaleString()
}

interface FinanceMobileCardsProps {
  loading: boolean
  pagedCombined: FinanceCombinedRow[]
  combined: FinanceCombinedRow[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onItemClick: (row: FinanceCombinedRow) => void
}

export default function FinanceMobileCards({
  loading,
  pagedCombined,
  combined,
  page,
  pageSize,
  onPageChange,
  onItemClick
}: FinanceMobileCardsProps) {
  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      <Typography fontWeight="bold" mb={2}>수입/지출 내역</Typography>
      {loading && (
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton className="h-24 rounded-lg" />
            </Grid>
          ))}
        </Grid>
      )}
      {!loading && pagedCombined.length === 0 && (
        <EmptyState title="데이터가 없습니다." />
      )}
      {!loading && (
        <Grid container spacing={1.5}>
          {pagedCombined.map(row => (
            <Grid item xs={12} sm={6} key={`${row.type}-${row.id}`}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  height: '100%'
                }}
                onClick={() => onItemClick(row)}
              >
                <CardContent sx={{ pb: 1.5, px: 2, pt: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Chip
                      label={row.type === 'income' ? '수입' : '지출'}
                      size="small"
                      color={row.type === 'income' ? 'success' : 'error'}
                      variant="filled"
                      sx={{ fontSize: '0.75rem', height: 24 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {row.date}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      color: row.type === 'income' ? '#059669' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                      lineHeight: 1.2
                    }}
                  >
                    {row.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {row.type === 'income' ? '+' : '-'}₩{formatAmount(row.amount)}
                  </Typography>
                  {row.note && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {row.note}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {/* 페이지네이션 */}
      {!loading && combined.length > 0 && (
        <Stack direction="row" justifyContent="center" mt={2}>
          <Pagination
            count={Math.ceil(combined.length / pageSize)}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            size="small"
            siblingCount={0}
          />
        </Stack>
      )}
    </Box>
  )
}
