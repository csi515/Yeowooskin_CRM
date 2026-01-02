'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material'
import Button from '../ui/Button'
import { FinanceCreateForm } from '@/types/finance'

interface FinanceCreateModalProps {
  open: boolean
  onClose: () => void
  form: FinanceCreateForm
  onFormChange: (updates: Partial<FinanceCreateForm>) => void
  incomeCategories: string[]
  expenseCategories: string[]
  onSubmit: (incomeCategories: string[], expenseCategories: string[]) => Promise<boolean>
}

export default function FinanceCreateModal({
  open,
  onClose,
  form,
  onFormChange,
  incomeCategories,
  expenseCategories,
  onSubmit
}: FinanceCreateModalProps) {
  const handleSubmit = async () => {
    const success = await onSubmit(incomeCategories, expenseCategories)
    if (success) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>새 수입/지출</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <ToggleButtonGroup
            value={form.newType}
            exclusive
            onChange={(_, v) => v && onFormChange({ newType: v as 'income' | 'expense' })}
            fullWidth
            color="primary"
          >
            <ToggleButton value="income">수입</ToggleButton>
            <ToggleButton value="expense">지출</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            label="일자"
            type="date"
            value={form.newDate}
            onChange={e => onFormChange({ newDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="금액"
            value={form.newAmount}
            onChange={e => {
              const numeric = e.target.value.replace(/[^0-9]/g, '')
              onFormChange({ newAmount: numeric ? Number(numeric).toLocaleString('ko-KR') : '' })
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">원</InputAdornment>
            }}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>{form.newType === 'income' ? '수입 항목' : '지출 항목'}</InputLabel>
            <Select
              value={form.selectedCategory}
              label={form.newType === 'income' ? '수입 항목' : '지출 항목'}
              onChange={(e) => onFormChange({ selectedCategory: e.target.value })}
            >
              {(form.newType === 'income' ? incomeCategories : expenseCategories).map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
              {(form.newType === 'income' ? incomeCategories : expenseCategories).length === 0 && (
                <MenuItem disabled value="">항목 설정이 필요합니다</MenuItem>
              )}
            </Select>
          </FormControl>

          <TextField
            label="메모 (선택)"
            value={form.newMemo}
            onChange={e => onFormChange({ newMemo: e.target.value })}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>취소</Button>
        <Button variant="primary" onClick={handleSubmit}>저장</Button>
      </DialogActions>
    </Dialog>
  )
}
