'use client'

import { Search, Download, Plus } from 'lucide-react'
import { Paper, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Box, Typography } from '@mui/material'
import Button from '../ui/Button'
import { type CustomerFilters } from '@/types/customer'

interface CustomerFiltersProps {
  query: string
  onQueryChange: (query: string) => void
  filters: CustomerFilters
  onFiltersChange: (filters: Partial<CustomerFilters>) => void
  onResetFilters: () => void
  onExport: () => void
  onCreateCustomer: () => void
  filteredCount: number
  totalCount: number
}

export default function CustomerFilters({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  onResetFilters,
  onExport,
  onCreateCustomer,
  filteredCount,
  totalCount
}: CustomerFiltersProps) {
  // Using responsive design instead of mobile detection

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }} elevation={0} variant="outlined">
      <Stack spacing={3}>
        {/* 검색 및 기본 액션 */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <TextField
              placeholder="이름, 이메일 또는 전화번호로 검색"
              value={query}
              onChange={e => onQueryChange(e.target.value ?? '')}
            size="small"
            fullWidth
            sx={{
              maxWidth: { sm: 400 },
              '& .MuiOutlinedInput-root': {
                fontSize: { xs: '16px', md: '14px' },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <Search className="h-4 w-4 text-neutral-400" />
                ),
              },
            }}
            inputProps={{
              autoComplete: 'off',
              autoCorrect: 'off',
              autoCapitalize: 'off',
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={onExport}
              sx={{ whiteSpace: 'nowrap', display: { xs: 'none', md: 'inline-flex' } }}
            >
              CSV 내보내기
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={onCreateCustomer}
              fullWidth={false}
              sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: 'nowrap' }}
            >
              새 고객
            </Button>
          </Stack>
        </Stack>

        {/* 인라인 필터 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            필터:
          </Typography>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>상태</InputLabel>
            <Select
              value={filters.statusFilter}
              onChange={(e) => onFiltersChange({ statusFilter: e.target.value as any })}
              label="상태"
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="active">활성</MenuItem>
              <MenuItem value="inactive">비활성</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>VIP 등급</InputLabel>
            <Select
              value={filters.vipFilter}
              onChange={(e) => onFiltersChange({ vipFilter: e.target.value as any })}
              label="VIP 등급"
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="vip">VIP (1000P 이상)</MenuItem>
              <MenuItem value="normal">일반</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="최소 포인트"
            type="number"
            size="small"
            value={filters.minPoints}
            onChange={(e) => onFiltersChange({ minPoints: e.target.value })}
            sx={{ width: 120 }}
          />

          <TextField
            label="최대 포인트"
            type="number"
            size="small"
            value={filters.maxPoints}
            onChange={(e) => onFiltersChange({ maxPoints: e.target.value })}
            sx={{ width: 120 }}
          />

          {(filters.vipFilter !== 'all' || filters.minPoints || filters.maxPoints) && (
            <Button
              variant="ghost"
              onClick={onResetFilters}
              size="sm"
              sx={{ ml: 1 }}
            >
              초기화
            </Button>
          )}

          {/* 필터 상태 표시 */}
          {(filters.vipFilter !== 'all' || filters.minPoints || filters.maxPoints) && (
            <Chip
              label={`${filteredCount}/${totalCount}명 표시`}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Box>
      </Stack>
    </Paper>
  )
}
