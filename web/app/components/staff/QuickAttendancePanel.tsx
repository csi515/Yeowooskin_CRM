'use client'

import { Staff, StaffAttendance } from '@/types/entities'
import {
    Box,
    Paper,
    Typography,
    Stack,
    Button,
    Chip,
    Avatar,
    useTheme
} from '@mui/material'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'

interface QuickAttendancePanelProps {
    staffList: Staff[]
    attendance: StaffAttendance[]
    onCheckIn: (staffId: string) => Promise<void>
    onCheckOut: (staffId: string) => Promise<void>
    onOpenRecord: (staff: Staff, record?: StaffAttendance) => void
}

/**
 * 빠른 출퇴근 기록 패널
 * 오늘의 출근 현황 및 간편 출퇴근 버튼 제공
 */
export default function QuickAttendancePanel({
    staffList,
    attendance,
    onCheckIn,
    onCheckOut,
    onOpenRecord
}: QuickAttendancePanelProps) {
    const theme = useTheme()
    const today = new Date()

    // 오늘의 실제 근태 기록 필터링
    const todayAttendance = attendance.filter(a => {
        if (a.type !== 'actual') return false
        const recordDate = new Date(a.start_time)
        return recordDate >= startOfDay(today) && recordDate <= endOfDay(today)
    })

    // 직원별 출퇴근 상태 계산
    const getStaffStatus = (staffId: string) => {
        const record = todayAttendance.find(a => a.staff_id === staffId)
        if (!record) return { status: 'absent', record: null }

        const now = new Date()
        const endTime = new Date(record.end_time)

        if (now >= endTime) {
            return { status: 'checked-out', record }
        }
        return { status: 'checked-in', record }
    }

    return (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: 'white' }}>
            <Stack spacing={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Clock size={20} color={theme.palette.primary.main} />
                        <Typography variant="h6" fontWeight="bold">
                            오늘의 출근 현황
                        </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                        {format(today, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                    </Typography>
                </Stack>

                <Stack spacing={1.5}>
                    {staffList.filter(s => s.active !== false).map(staff => {
                        const { status, record } = getStaffStatus(staff.id)

                        return (
                            <Box
                                key={staff.id}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.divider}`,
                                    bgcolor: status === 'checked-in' ? theme.palette.success.light + '10' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Avatar
                                    {...(staff.profile_image_url ? { src: staff.profile_image_url } : {})}
                                    sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main }}
                                >
                                    {staff.name[0]}
                                </Avatar>

                                <Box flex={1}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {staff.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {staff.role || '직원'}
                                    </Typography>
                                </Box>

                                {status === 'absent' && (
                                    <>
                                        <Chip
                                            label="미출근"
                                            size="small"
                                            sx={{ bgcolor: theme.palette.grey[200] }}
                                        />
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<CheckCircle size={16} />}
                                            onClick={() => onCheckIn(staff.id)}
                                            sx={{ minWidth: 80 }}
                                        >
                                            출근
                                        </Button>
                                    </>
                                )}

                                {status === 'checked-in' && record && (
                                    <>
                                        <Chip
                                            label={`출근 ${format(new Date(record.start_time), 'HH:mm')}`}
                                            size="small"
                                            color="success"
                                            icon={<CheckCircle size={14} />}
                                        />
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<XCircle size={16} />}
                                            onClick={() => onCheckOut(staff.id)}
                                            sx={{ minWidth: 80 }}
                                        >
                                            퇴근
                                        </Button>
                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() => onOpenRecord(staff, record)}
                                        >
                                            수정
                                        </Button>
                                    </>
                                )}

                                {status === 'checked-out' && record && (
                                    <>
                                        <Chip
                                            label={`퇴근 ${format(new Date(record.end_time), 'HH:mm')}`}
                                            size="small"
                                            sx={{ bgcolor: theme.palette.grey[300] }}
                                        />
                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() => onOpenRecord(staff, record)}
                                        >
                                            수정
                                        </Button>
                                    </>
                                )}
                            </Box>
                        )
                    })}
                </Stack>
            </Stack>
        </Paper>
    )
}
