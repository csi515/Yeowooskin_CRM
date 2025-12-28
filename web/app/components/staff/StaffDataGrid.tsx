'use client'

import { Staff } from '@/types/entities'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import {
    Box,
    Typography,
    Avatar,
    Chip,
    IconButton,
    useMediaQuery,
    useTheme,
    Stack
} from '@mui/material'
import MobileDataCard from '@/app/components/ui/MobileDataCard'
import { Edit2, Phone, Award } from 'lucide-react'

interface StaffDataGridProps {
    rows: Staff[]
    loading?: boolean
    onEdit: (staff: Staff) => void
    onStatusClick: (staff: Staff) => void
}

/**
 * MUI Data Grid 기반의 반응형 직원 명부
 * PC: 테이블 뷰 / Mobile: 카드 리스트 뷰
 */
export default function StaffDataGrid({ rows, loading, onEdit, onStatusClick }: StaffDataGridProps) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    // Data Grid 컬럼 정의
    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: '직원명',
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                        {...(params.row.profile_image_url ? { src: params.row.profile_image_url } : {})}
                        sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.light }}
                    >
                        {params.value?.[0]}
                    </Avatar>
                    <Typography variant="body2" fontWeight="bold">{params.value}</Typography>
                </Stack>
            )
        },
        { field: 'role', headerName: '직무', width: 120 },
        { field: 'phone', headerName: '연락처', width: 150 },
        {
            field: 'status',
            headerName: '상태',
            width: 120,
            renderCell: (params: GridRenderCellParams) => {
                const status = params.value || 'office'
                const color = status === 'office' ? 'success' : status === 'away' ? 'warning' : 'default'
                const label = status === 'office' ? '출근' : status === 'away' ? '휴무' : '퇴근'
                return (
                    <Chip
                        label={label}
                        color={color as any}
                        size="small"
                        variant="outlined"
                        onClick={() => onStatusClick(params.row)}
                        sx={{ cursor: 'pointer' }}
                    />
                )
            }
        },
        {
            field: 'skills',
            headerName: '보유 기술',
            flex: 1,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="caption" color="text.secondary" noWrap>
                    {params.value || '-'}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: '관리',
            width: 80,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton size="small" onClick={() => onEdit(params.row)}>
                    <Edit2 size={16} />
                </IconButton>
            )
        }
    ]

    if (isMobile) {
        return (
            <Stack spacing={2} sx={{ mb: 2 }}>
                {rows.map((staff) => (
                    <MobileDataCard
                        key={staff.id}
                        title={staff.name}
                        subtitle={staff.role || '직원'}
                        status={{
                            label: staff.status === 'office' ? '출근' : staff.status === 'away' ? '휴무' : '퇴근',
                            color: staff.status === 'office' ? 'success' : staff.status === 'away' ? 'warning' : 'default'
                        }}
                        onClick={() => onEdit(staff)}
                        content={
                            <Stack spacing={1} sx={{ mt: 1 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Phone size={14} color={theme.palette.text.secondary} />
                                    <Typography variant="body2">{staff.phone || '-'}</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Award size={14} color={theme.palette.text.secondary} />
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{staff.skills || '기술 정보 없음'}</Typography>
                                </Stack>
                            </Stack>
                        }
                        action={
                            <Chip
                                label={staff.status === 'office' ? '출근' : staff.status === 'away' ? '휴무' : '퇴근'}
                                color={(staff.status === 'office' ? 'success' : staff.status === 'away' ? 'warning' : 'default') as any}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onStatusClick(staff)
                                }}
                            />
                        }
                    />
                ))}
            </Stack>
        )
    }

    return (
        <Box sx={{ height: 500, width: '100%', bgcolor: 'white', borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
            <DataGrid
                rows={rows}
                columns={columns}
                loading={loading ?? false}
                pageSizeOptions={[5, 10, 20]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableRowSelectionOnClick
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                        bgcolor: theme.palette.grey[50],
                        borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                    '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                    },
                }}
            />
        </Box>
    )
}
