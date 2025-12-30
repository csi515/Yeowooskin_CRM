'use client'

import { useState } from 'react'
import {
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Stack,
    Typography,
    Box,
    Chip
} from '@mui/material'
import { Checkbox } from '@mui/material'
import { Stack as MuiStack } from '@mui/material'
import Pagination from '@mui/material/Pagination'
import { type Staff, type PayrollRecord } from '@/types/payroll'

interface PayrollTableProps {
    selectedMonth: string
    staff: Staff[]
    records: PayrollRecord[]
    selectedStaffIds: string[]
    onSelectedStaffIdsChange: (ids: string[]) => void
    paginatedStaff: Staff[]
    totalPages: number
    currentPage: number
    onPageChange: (page: number) => void
    onSettingsModalOpen: (staffId: string, staffName: string) => void
    onDetailModalOpen: (record: PayrollRecord) => void
    onStatusChange: (record: PayrollRecord, newStatus: 'approved' | 'paid') => void
}

export default function PayrollTable({
    selectedMonth,
    staff,
    records,
    selectedStaffIds,
    onSelectedStaffIdsChange,
    paginatedStaff,
    totalPages,
    currentPage,
    onPageChange,
    onSettingsModalOpen,
    onDetailModalOpen,
    onStatusChange
}: PayrollTableProps) {
    return (
        <Card>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                        {selectedMonth} 급여 관리
                    </Typography>
                    {selectedStaffIds.length > 0 && (
                        <Typography variant="body2" color="primary.main" fontWeight={600}>
                            {selectedStaffIds.length}명 선택됨
                        </Typography>
                    )}
                </Stack>

                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={paginatedStaff.length > 0 && selectedStaffIds.length === paginatedStaff.length}
                                        indeterminate={selectedStaffIds.length > 0 && selectedStaffIds.length < paginatedStaff.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                onSelectedStaffIdsChange(paginatedStaff.map(s => s.id))
                                            } else {
                                                onSelectedStaffIdsChange([])
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>직원명</TableCell>
                                <TableCell align="right">기본급</TableCell>
                                <TableCell align="right">시급/연장</TableCell>
                                <TableCell align="right">인센티브</TableCell>
                                <TableCell align="right">총 지급액</TableCell>
                                <TableCell align="right">공제액</TableCell>
                                <TableCell align="right">실지급액</TableCell>
                                <TableCell align="center">상태</TableCell>
                                <TableCell align="center">상세보기</TableCell>
                                <TableCell align="center">관리</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedStaff.map((s) => {
                                const record = records.find(r => r.staff_id === s.id)
                                return (
                                    <TableRow key={s.id}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedStaffIds.includes(s.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        onSelectedStaffIdsChange([...selectedStaffIds, s.id])
                                                    } else {
                                                        onSelectedStaffIdsChange(selectedStaffIds.filter(id => id !== s.id))
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {s.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {s.role || '직원'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            {record ? `₩${record.base_salary.toLocaleString()}` : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {record ? `₩${record.overtime_pay.toLocaleString()}` : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {record ? `₩${record.incentive_pay.toLocaleString()}` : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {record ? (
                                                <Typography variant="body2" fontWeight={600}>
                                                    ₩{record.total_gross.toLocaleString()}
                                                </Typography>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'error.main' }}>
                                            {record ? `-₩${record.total_deductions.toLocaleString()}` : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {record ? (
                                                <Typography variant="body2" fontWeight={700} color="success.main">
                                                    ₩{record.net_salary.toLocaleString()}
                                                </Typography>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            {record ? (
                                                <Chip
                                                    label={
                                                        record.status === 'paid' ? '지급완료' :
                                                        record.status === 'approved' ? '승인완료' :
                                                        record.status === 'calculated' ? '계산완료' :
                                                        '미계산'
                                                    }
                                                    color={
                                                        record.status === 'paid' ? 'success' :
                                                        record.status === 'approved' ? 'info' :
                                                        record.status === 'calculated' ? 'warning' :
                                                        'default'
                                                    }
                                                    size="small"
                                                />
                                            ) : (
                                                <Chip label="미계산" color="default" size="small" />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                onClick={() => record && onDetailModalOpen(record)}
                                                disabled={!record}
                                            >
                                                보기
                                            </Button>
                                        </TableCell>
                                        <TableCell align="center">
                                            <MuiStack direction="row" spacing={1} justifyContent="center">
                                                {record && record.status === 'calculated' && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => onStatusChange(record, 'approved')}
                                                    >
                                                        승인
                                                    </Button>
                                                )}
                                                {record && record.status === 'approved' && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="info"
                                                        onClick={() => onStatusChange(record, 'paid')}
                                                    >
                                                        지급확정
                                                    </Button>
                                                )}
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="secondary"
                                                    onClick={() => onSettingsModalOpen(s.id, s.name)}
                                                >
                                                    설정
                                                </Button>
                                            </MuiStack>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {paginatedStaff.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            등록된 직원이 없습니다.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {paginatedStaff.length > 0 && (
                    <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={(_, p) => onPageChange(p)}
                            color="primary"
                            showFirstButton
                            showLastButton
                        />
                    </Stack>
                )}
            </CardContent>
        </Card>
    )
}
