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
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    Alert
} from '@mui/material'
import { ChevronLeft, ChevronRight, Plus, Copy, Settings, Clock } from 'lucide-react'
import { format, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'

interface StaffSchedulerProps {
    staffList: Staff[]
    schedules: StaffAttendance[]
    onOpenSchedule: (staff: Staff, date: Date, schedule?: StaffAttendance) => void
    onBulkSchedule?: (staffIds: string[], dates: Date[], startTime: string, endTime: string) => Promise<void>
    onQuickSchedule?: (staffId: string, date: Date, startTime: string, endTime: string) => Promise<void>
}

/**
 * 직원 스케줄 표 (주간/월간 일정 관리)
 */
export default function StaffScheduler({ staffList, schedules, onOpenSchedule, onBulkSchedule, onQuickSchedule }: StaffSchedulerProps) {
    const [currentWeek, setCurrentWeek] = useState(new Date())
    const [quickMenuAnchor, setQuickMenuAnchor] = useState<HTMLElement | null>(null)
    const [selectedCell, setSelectedCell] = useState<{ staff: Staff, date: Date } | null>(null)
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
    const [bulkStartTime, setBulkStartTime] = useState('09:00')
    const [bulkEndTime, setBulkEndTime] = useState('18:00')
    const [selectedStaffForBulk, setSelectedStaffForBulk] = useState<string[]>([])
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false)


    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // 월요일 시작
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    // 주간 템플릿 정의
    const weeklyTemplates = [
        {
            name: '표준 근무',
            description: '월-금 9:00-18:00',
            schedule: [
                { day: 1, start: '09:00', end: '18:00' }, // 월
                { day: 2, start: '09:00', end: '18:00' }, // 화
                { day: 3, start: '09:00', end: '18:00' }, // 수
                { day: 4, start: '09:00', end: '18:00' }, // 목
                { day: 5, start: '09:00', end: '18:00' }, // 금
            ]
        },
        {
            name: '교대 근무 A',
            description: '월수금 9:00-18:00, 화목 14:00-22:00',
            schedule: [
                { day: 1, start: '09:00', end: '18:00' }, // 월
                { day: 2, start: '14:00', end: '22:00' }, // 화
                { day: 3, start: '09:00', end: '18:00' }, // 수
                { day: 4, start: '14:00', end: '22:00' }, // 목
                { day: 5, start: '09:00', end: '18:00' }, // 금
            ]
        },
        {
            name: '교대 근무 B',
            description: '월수금 14:00-22:00, 화목 9:00-18:00',
            schedule: [
                { day: 1, start: '14:00', end: '22:00' }, // 월
                { day: 2, start: '09:00', end: '18:00' }, // 화
                { day: 3, start: '14:00', end: '22:00' }, // 수
                { day: 4, start: '09:00', end: '18:00' }, // 목
                { day: 5, start: '14:00', end: '22:00' }, // 금
            ]
        },
        {
            name: '주말 근무',
            description: '토일 10:00-16:00',
            schedule: [
                { day: 6, start: '10:00', end: '16:00' }, // 토
                { day: 0, start: '10:00', end: '16:00' }, // 일
            ]
        }
    ]

    // 특정 직원의 특정 날짜 스케줄 조회
    const getScheduleForStaffAndDate = (staffId: string, date: Date) => {
        return schedules.filter(s =>
            s.staff_id === staffId &&
            s.type === 'scheduled' &&
            isSameDay(new Date(s.start_time), date)
        )
    }

    // 빠른 스케줄 생성 메뉴 핸들러
    const handleCellClick = (event: React.MouseEvent, staff: Staff, date: Date) => {
        const daySchedules = getScheduleForStaffAndDate(staff.id, date)
        if (daySchedules.length > 0) {
            // 이미 스케줄이 있으면 기존 모달 열기
            onOpenSchedule(staff, date, daySchedules[0])
        } else {
            // 빈 셀 클릭 시 빠른 메뉴 표시
            setSelectedCell({ staff, date })
            setQuickMenuAnchor(event.currentTarget as HTMLElement)
        }
    }

    // 빠른 스케줄 생성
    const handleQuickSchedule = async (startTime: string, endTime: string) => {
        if (!selectedCell || !onQuickSchedule) return

        try {
            const { staff, date } = selectedCell
            await onQuickSchedule(staff.id, date, startTime, endTime)
            setQuickMenuAnchor(null)
            setSelectedCell(null)
        } catch (error) {
            console.error('스케줄 생성 실패:', error)
        }
    }

    // 일괄 스케줄 적용
    const handleBulkSchedule = async () => {
        if (!onBulkSchedule || selectedStaffForBulk.length === 0) return

        try {
            const weekDates = eachDayOfInterval({ start: weekStart, end: weekEnd })
            await onBulkSchedule(selectedStaffForBulk, weekDates, bulkStartTime, bulkEndTime)
            setBulkDialogOpen(false)
            setSelectedStaffForBulk([])
        } catch (error) {
            console.error('일괄 스케줄 적용 실패:', error)
        }
    }

    // 템플릿 적용
    const handleApplyTemplate = async (template: typeof weeklyTemplates[0], targetStaffIds: string[]) => {
        if (!onQuickSchedule || targetStaffIds.length === 0) return

        try {
            const promises = []

            for (const staffId of targetStaffIds) {
                for (const scheduleItem of template.schedule) {
                    // 해당 요일의 날짜 찾기
                    const targetDate = weekDays.find(date => date.getDay() === scheduleItem.day)
                    if (!targetDate) continue

                    // 이미 스케줄이 있는지 확인
                    const existingSchedule = schedules.find(s =>
                        s.staff_id === staffId &&
                        s.type === 'scheduled' &&
                        format(new Date(s.start_time), 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')
                    )

                    if (!existingSchedule) {
                        promises.push(
                            onQuickSchedule(staffId, targetDate, scheduleItem.start, scheduleItem.end)
                        )
                    }
                }
            }

            await Promise.all(promises)
            setTemplateDialogOpen(false)
        } catch (error) {
            console.error('템플릿 적용 실패:', error)
        }
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
                    onClick={(e) => handleCellClick(e, staff, date)}
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
                onClick={(e) => handleCellClick(e, staff, date)}
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

                <Stack direction="row" spacing={1}>
                    <Tooltip title="주간 템플릿 적용">
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Settings size={16} />}
                            onClick={() => setTemplateDialogOpen(true)}
                        >
                            템플릿
                        </Button>
                    </Tooltip>
                    <Tooltip title="일괄 스케줄 적용">
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Plus size={16} />}
                            onClick={() => setBulkDialogOpen(true)}
                        >
                            일괄 적용
                        </Button>
                    </Tooltip>
                    <Tooltip title="이번 주 복사">
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Copy size={16} />}
                            onClick={() => {
                                // TODO: 이번 주 스케줄을 다음 주로 복사하는 기능
                            }}
                        >
                            복사
                        </Button>
                    </Tooltip>
                </Stack>
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

            {/* 빠른 스케줄 생성 메뉴 */}
            <Menu
                anchorEl={quickMenuAnchor}
                open={Boolean(quickMenuAnchor)}
                onClose={() => {
                    setQuickMenuAnchor(null)
                    setSelectedCell(null)
                }}
            >
                <MenuItem onClick={() => handleQuickSchedule('09:00', '18:00')}>
                    <Clock size={16} style={{ marginRight: 8 }} />
                    <Typography variant="body2">일반 근무 (9:00-18:00)</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleQuickSchedule('09:00', '15:00')}>
                    <Clock size={16} style={{ marginRight: 8 }} />
                    <Typography variant="body2">오전 근무 (9:00-15:00)</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleQuickSchedule('14:00', '22:00')}>
                    <Clock size={16} style={{ marginRight: 8 }} />
                    <Typography variant="body2">오후 근무 (14:00-22:00)</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleQuickSchedule('18:00', '02:00')}>
                    <Clock size={16} style={{ marginRight: 8 }} />
                    <Typography variant="body2">야간 근무 (18:00-02:00)</Typography>
                </MenuItem>
                <MenuItem onClick={() => {
                    if (selectedCell) {
                        onOpenSchedule(selectedCell.staff, selectedCell.date)
                    }
                    setQuickMenuAnchor(null)
                    setSelectedCell(null)
                }}>
                    <Settings size={16} style={{ marginRight: 8 }} />
                    <Typography variant="body2">상세 설정</Typography>
                </MenuItem>
            </Menu>

            {/* 주간 템플릿 적용 대화상자 */}
            <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>주간 템플릿 적용</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Alert severity="info">
                            선택한 템플릿을 적용할 직원을 선택하세요. 기존 스케줄은 유지됩니다.
                        </Alert>

                        <FormControl fullWidth>
                            <InputLabel>적용할 직원</InputLabel>
                            <Select
                                multiple
                                value={selectedStaffForBulk}
                                onChange={(e) => setSelectedStaffForBulk(e.target.value as string[])}
                                renderValue={(selected) =>
                                    staffList
                                        .filter(s => selected.includes(s.id))
                                        .map(s => s.name)
                                        .join(', ')
                                }
                            >
                                {staffList.filter(s => s.active !== false).map(staff => (
                                    <MenuItem key={staff.id} value={staff.id}>
                                        {staff.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="h6" sx={{ mt: 2 }}>사용 가능한 템플릿</Typography>
                        <Stack spacing={2}>
                            {weeklyTemplates.map((template, index) => (
                                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                {template.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {template.description}
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleApplyTemplate(template, selectedStaffForBulk)}
                                            disabled={selectedStaffForBulk.length === 0}
                                        >
                                            적용
                                        </Button>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTemplateDialogOpen(false)}>닫기</Button>
                </DialogActions>
            </Dialog>

            {/* 일괄 스케줄 적용 대화상자 */}
            <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>일괄 스케줄 적용</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Alert severity="info">
                            선택한 직원들에게 이번 주 전체에 동일한 근무 시간을 적용합니다.
                        </Alert>

                        <FormControl fullWidth>
                            <InputLabel>적용할 직원</InputLabel>
                            <Select
                                multiple
                                value={selectedStaffForBulk}
                                onChange={(e) => setSelectedStaffForBulk(e.target.value as string[])}
                                renderValue={(selected) =>
                                    staffList
                                        .filter(s => selected.includes(s.id))
                                        .map(s => s.name)
                                        .join(', ')
                                }
                            >
                                {staffList.filter(s => s.active !== false).map(staff => (
                                    <MenuItem key={staff.id} value={staff.id}>
                                        {staff.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="시작 시간"
                                type="time"
                                value={bulkStartTime}
                                onChange={(e) => setBulkStartTime(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="종료 시간"
                                type="time"
                                value={bulkEndTime}
                                onChange={(e) => setBulkEndTime(e.target.value)}
                                fullWidth
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkDialogOpen(false)}>취소</Button>
                    <Button
                        onClick={handleBulkSchedule}
                        variant="contained"
                        disabled={selectedStaffForBulk.length === 0}
                    >
                        적용하기
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
