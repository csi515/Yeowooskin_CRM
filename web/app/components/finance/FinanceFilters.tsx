'use client'

import { Plus, Download } from 'lucide-react'
import {
  Box,
  Stack,
  Paper,
  TextField,
  Typography,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'
import Button from '../ui/Button'

interface FinanceFiltersProps {
  dateRange: { from: string; to: string }
  onUpdateRange: (range: { from?: string; to?: string }) => void
  filterType: ('income' | 'expense')[]
  onFilterTypeChange: (types: ('income' | 'expense')[]) => void
  showFilters: boolean
  onToggleShowFilters: () => void
  onCreateNew: () => void
  onExportExcel: () => void
}

export default function FinanceFilters({
  dateRange,
  onUpdateRange,
  filterType,
  onFilterTypeChange,
  showFilters,
  onToggleShowFilters,
  onCreateNew,
  onExportExcel
}: FinanceFiltersProps) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3 }} elevation={0} variant="outlined">
      <Stack spacing={2}>
        {/* 모바일용 세로 배치 버튼들 */}
        <Stack spacing={1} sx={{ display: { xs: 'flex', md: 'none' } }}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={onCreateNew}
            fullWidth
            sx={{ minHeight: 44 }}
          >
            새 거래
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleShowFilters}
              sx={{ flex: 1 }}
            >
              {showFilters ? '접기' : '필터'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={onExportExcel}
              sx={{ flex: 1, fontSize: '0.875rem' }}
            >
              엑셀
            </Button>
          </Box>
        </Stack>
        <Box sx={{ display: { xs: showFilters ? 'block' : 'none', md: 'block' } }}>
          <Stack spacing={2}>
            {/* Quick Date Filters */}
            <Box sx={{ display: { xs: 'flex', sm: 'flex' }, gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const now = new Date()
                  const start = new Date(now.getFullYear(), now.getMonth(), 1)
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                  onUpdateRange({
                    from: start.toISOString().split('T')[0]!,
                    to: end.toISOString().split('T')[0]!
                  })
                }}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 0.5, px: 1 }}
              >
                이번달
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const now = new Date()
                  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                  const end = new Date(now.getFullYear(), now.getMonth(), 0)
                  onUpdateRange({
                    from: start.toISOString().split('T')[0]!,
                    to: end.toISOString().split('T')[0]!
                  })
                }}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 0.5, px: 1 }}
              >
                지난달
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const now = new Date()
                  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                  onUpdateRange({
                    from: start.toISOString().split('T')[0]!,
                    to: end.toISOString().split('T')[0]!
                  })
                }}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 0.5, px: 1, display: { xs: 'none', sm: 'flex' } }}
              >
                3개월
              </Button>
            </Box>

            {/* Date Range Inputs */}
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                type="date"
                label="시작일"
                value={dateRange.from}
                onChange={e => onUpdateRange({ from: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>~</Typography>
              <TextField
                type="date"
                label="종료일"
                value={dateRange.to}
                onChange={e => onUpdateRange({ to: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Stack>

            {/* 두 번째 줄: 필터 & 액션 */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
              <ToggleButtonGroup
                value={filterType}
                onChange={(_, newFilters) => onFilterTypeChange(newFilters as ('income' | 'expense')[])}
                size="small"
                color="primary"
                fullWidth={false}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                <ToggleButton value="income" sx={{ flex: 1 }}>수입</ToggleButton>
                <ToggleButton value="expense" sx={{ flex: 1 }}>지출</ToggleButton>
              </ToggleButtonGroup>

              <Box sx={{ flexGrow: 1 }} />

              <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, display: { xs: 'none', md: 'flex' } }}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={onExportExcel}
                >
                  엑셀
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={onCreateNew}
                >
                  새 거래
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}
