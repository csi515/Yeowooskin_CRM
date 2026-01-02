'use client'

import { Stack, Typography, FormControl, Select, MenuItem, Pagination, Paper } from '@mui/material'
import Button from '../ui/Button'
import { useAppToast } from '../../lib/ui/toast'

interface CustomerPaginationProps {
  loading: boolean
  filteredCount: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  selectedCustomerIds: string[]
  onClearSelection: () => void
}

export default function CustomerPagination({
  loading,
  filteredCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  selectedCustomerIds,
  onClearSelection
}: CustomerPaginationProps) {
  const toast = useAppToast()

  const handleBulkAction = () => {
    // TODO: 일괄 상태 변경 기능 구현
    toast.info('일괄 상태 변경 기능은 곧 추가됩니다')
  }

  if (loading || filteredCount === 0) return null

  return (
    <>
      {/* 선택된 고객 표시 및 일괄 작업 */}
      {selectedCustomerIds.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'primary.light', border: '1px solid', borderColor: 'primary.main' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" fontWeight={600} color="primary.dark">
              {selectedCustomerIds.length}명의 고객이 선택되었습니다
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkAction}
              >
                상태 변경
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
              >
                선택 해제
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* 페이지네이션 */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          총 {filteredCount}명 · {page} / {totalPages} 페이지
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small">
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              sx={{ minWidth: 100, bgcolor: 'background.paper' }}
            >
              <MenuItem value={10}>10개씩</MenuItem>
              <MenuItem value={20}>20개씩</MenuItem>
              <MenuItem value={50}>50개씩</MenuItem>
            </Select>
          </FormControl>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            shape="rounded"
            size="medium"
            siblingCount={1}
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPagination-ul': {
                flexWrap: 'nowrap',
              },
            }}
          />
        </Stack>
      </Stack>
    </>
  )
}
