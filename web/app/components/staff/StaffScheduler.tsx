'use client'

import { useState } from 'react'
import { Staff, StaffAttendance } from '@/types/entities'
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton
} from '@mui/material'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'

interface StaffSchedulerProps {
    staffList: Staff[]
    schedules: StaffAttendance[]
    onOpenSchedule: (staff: Staff, date: Date, schedule?: StaffAttendance) => void
}

/**
 * 직원 스케줄 표 (주간/월간 일정 관리)
 */
export default function StaffScheduler({ staffList, schedules, onOpenSchedule }: StaffSchedulerProps) {
    const [currentWeek, setCurrentWeek] = useState(new Date())


    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // 월요일 시작
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    // 특정 직원의 특정 날짜 스케줄 조회
    const getScheduleForStaffAndDate = (staffId: string, date: Date) => {
        return schedules.filter(s =>
            s.staff_id === staffId &&
            s.type === 'scheduled' &&
            isSameDay(new Date(s.start_time), date)
        )
    }

    const renderScheduleCell = (staff: Staff, date: Date) => {
        const daySchedules = getScheduleForStaffAndDate(staff.id, date)

        if (daySchedules.length === 0) {
            const isToday = isSameDay(date, new Date())
            const isWeekend = date.getDay() === 0 || date.getDay() === 6

            return (
                <TableCell
                    key={date.toISOString()}
                    sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        minWidth: 100,
                        p: 1,
                        bgcolor: isWeekend ? 'grey.50' : 'inherit',
                        borderLeft: isToday ? '3px solid' : 'none',
                        borderColor: 'primary.main'
                    }}
                    onClick={() => onOpenSchedule(staff, date)}
                >
                    <Typography variant="caption" color="text.secondary">
                        휴무
                    </Typography>
                </TableCell>
            )
        }

        const isToday = isSameDay(date, new Date())
        const isWeekend = date.getDay() === 0 || date.getDay() === 6

        return (
            <TableCell
                key={date.toISOString()}
                sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    minWidth: 100,
                    p: 1,
                    bgcolor: isWeekend ? 'grey.50' : 'inherit',
                    borderLeft: isToday ? '3px solid' : 'none',
                    borderColor: 'primary.main'
                }}
                onClick={() => onOpenSchedule(staff, date, daySchedules[0])}
            >
                <Stack spacing={0.5}>
                    {daySchedules.map(schedule => (
                        <Chip
                            key={schedule.id}
                            label={`${format(new Date(schedule.start_time), 'HH:mm')}-${format(new Date(schedule.end_time), 'HH:mm')}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 24 }}
                        />
                    ))}
                </Stack>
            </TableCell>
        )
    }

    return (
        <Box>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))} size="small">
                        <ChevronLeft size={20} />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold">
                        {format(weekStart, 'M월 d일', { locale: ko })} - {format(weekEnd, 'M월 d일', { locale: ko })}
                    </Typography>
                    <IconButton onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} size="small">
                        <ChevronRight size={20} />
                    </IconButton>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setCurrentWeek(new Date())}
                    >
                        이번 주
                    </Button>
                </Stack>

                {/* <ToggleButtonGroup
                    value={view}
                    exclusive
                    onChange={(_, v) => v && setView(v)}
                    size="small"
                >
                    <ToggleButton value="week">주간</ToggleButton>
                    <ToggleButton value="month">월간</ToggleButton>
                </ToggleButtonGroup> */}
            </Stack>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>직원</TableCell>
                            {weekDays.map(day => {
                                const isToday = isSameDay(day, new Date())
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6

                                return (
                                    <TableCell
                                        key={day.toISOString()}
                                        align="center"
                                        sx={{
                                            fontWeight: 'bold',
                                            bgcolor: isToday ? 'primary.light' : (isWeekend ? 'grey.100' : 'inherit'),
                                            color: isToday ? 'primary.contrastText' : 'inherit',
                                            p: 0.5 // Reduce padding for compactness
                                        }}
                                    >
                                        <Typography variant="body2" align="center" sx={{ fontSize: '0.875rem' }}>
                                            {format(day, 'd(EEE)', { locale: ko })}
                                        </Typography>
                                    </TableCell>
                                )
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {staffList.filter(s => s.active !== false).map(staff => (
                            <TableRow key={staff.id} hover>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    <Stack>
                                        <Typography variant="body2">{staff.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {staff.role || '직원'}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                {weekDays.map(day => renderScheduleCell(staff, day))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {staffList.filter(s => s.active !== false).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                        등록된 직원이 없습니다
                    </Typography>
                </Box>
            )}
        </Box>
    )
}
