'use client'

import { Grid, Card, CardContent, Typography } from '@mui/material'

interface FinanceSummaryCardsProps {
  sumIncome: number
  sumExpense: number
  profit: number
}

// 금액 포맷팅 함수 - 모바일 최적화
const formatAmount = (amount: number): string => {
  if (amount >= 100000000) { // 1억 이상
    return `${(amount / 100000000).toFixed(1)}억`
  } else if (amount >= 10000) { // 1만 이상
    return `${(amount / 10000).toFixed(0)}만`
  }
  return amount.toLocaleString()
}

export default function FinanceSummaryCards({
  sumIncome,
  sumExpense,
  profit
}: FinanceSummaryCardsProps) {
  return (
    <Grid container spacing={1}>
      <Grid item xs={4} sm={4}>
        <Card variant="outlined" sx={{ bgcolor: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Typography variant="body2" color="#047857" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              월간 수입
            </Typography>
            <Typography variant="h5" color="#047857" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
              ₩{formatAmount(sumIncome)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={4} sm={4}>
        <Card variant="outlined" sx={{ bgcolor: '#fff1f2', borderColor: '#fecdd3' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Typography variant="body2" color="#be123c" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              월간 지출
            </Typography>
            <Typography variant="h5" color="#be123c" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
              ₩{formatAmount(sumExpense)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={4} sm={4}>
        <Card variant="outlined" sx={{
          bgcolor: profit >= 0 ? '#ecfdf5' : '#fff1f2',
          borderColor: profit >= 0 ? '#a7f3d0' : '#fecdd3'
        }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Typography variant="body2" color={profit >= 0 ? '#047857' : '#be123c'} fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              월간 순이익
            </Typography>
            <Typography variant="h5" color={profit >= 0 ? '#047857' : '#be123c'} fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
              ₩{formatAmount(profit)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
