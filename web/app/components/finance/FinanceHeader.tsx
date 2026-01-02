'use client'

import { FileText, Download } from 'lucide-react'
import { Stack, Typography, IconButton } from '@mui/material'
import Button from '../ui/Button'

interface FinanceHeaderProps {
  onExportExcel: () => void
  onGenerateTaxReport: () => void
}

export default function FinanceHeader({
  onExportExcel,
  onGenerateTaxReport
}: FinanceHeaderProps) {
  return (
    <Stack direction={{ xs: 'row', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1}>
      <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>재무 관리</Typography>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<FileText className="h-4 w-4" />}
          onClick={onGenerateTaxReport}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          세무 자료 생성
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={onExportExcel}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          엑셀로 내보내기
        </Button>
        {/* 모바일용 */}
        <IconButton onClick={onExportExcel} sx={{ display: { xs: 'flex', sm: 'none' } }}>
          <Download className="h-5 w-5" />
        </IconButton>
      </Stack>
    </Stack>
  )
}
