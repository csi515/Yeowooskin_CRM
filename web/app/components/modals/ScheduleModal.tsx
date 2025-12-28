'use client'

import { useState, useEffect } from 'react'
import { Staff, StaffAttendance, StaffAttendanceCreateInput } from '@/types/entities'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Typography,
    Checkbox,
    FormControlLabel,
    Box,
    useTheme,
    useMediaQuery
} from '@mui/material'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ScheduleModalProps {
    open: boolean
    schedule?: StaffAttendance | null
    staffList: Staff[]
    preSelectedStaff?: Staff | null
    preSelectedDate?: Date | null
    defaultWorkHours?: {
        startTime: string
        endTime: string
    } | undefined
    onClose: () => void
    onSave: (data: StaffAttendanceCreateInput, repeat?: { days: number[] }) => Promise<void>
    onDelete?: (id: string) => Promise<void>
}

/**
 * 스케줄 추가/수정 모달
 */
export default function ScheduleModal({
    open,
    schedule,
    staffList,
    preSelectedStaff,
    preSelectedDate,
    defaultWorkHours,
    onClose,
    onSave,
    onDelete
}: ScheduleModalProps) {
    const defaultStartTime = defaultWorkHours?.startTime || '09:00'
    const defaultEndTime = defaultWorkHours?.endTime || '18:00'

    const [form, setForm] = useState<StaffAttendanceCreateInput>({
        staff_id: '',
        type: 'scheduled',
        start_time: '',
        end_time: '',
        status: null,
        memo: ''
    })
    const [loading, setLoading] = useState(false)
    const [enableRepeat, setEnableRepeat] = useState(false)
    const [repeatDays, setRepeatDays] = useState<number[]>([])

    useEffect(() => {
        if (schedule) {
            setForm({
                staff_id: schedule.staff_id,
                type: 'scheduled',
                start_time: format(new Date(schedule.start_time), "yyyy-MM-dd'T'HH:mm"),
                end_time: format(new Date(schedule.end_time), "yyyy-MM-dd'T'HH:mm"),
                status: schedule.status || null,
                memo: schedule.memo || ''
            })
            setEnableRepeat(false)
        } else {
            const targetDate = preSelectedDate || new Date()
            const dateStr = format(targetDate, 'yyyy-MM-dd')

            setForm({
                staff_id: preSelectedStaff?.id || '',
                type: 'scheduled',
                start_time: `${dateStr}T${defaultStartTime}`,
                end_time: `${dateStr}T${defaultEndTime}`,
                status: null,
                memo: ''
            })
            setEnableRepeat(false)
            setRepeatDays([])
        }
    }, [schedule, preSelectedStaff, preSelectedDate, defaultStartTime, defaultEndTime, open])

    const handleSave = async () => {
        if (!form.staff_id) {
            alert('직원을 선택해주세요.')
            return
        }

        try {
            setLoading(true)
            if (enableRepeat && repeatDays.length > 0) {
                await onSave(form, { days: repeatDays })
            } else {
                await onSave(form)
            }
            onClose()
        } catch (error) {
            console.error('저장 실패:', error)
            alert('저장에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!schedule?.id) return
        if (!confirm('이 스케줄을 삭제하시겠습니까?')) return

        try {
            setLoading(true)
            await onDelete?.(schedule.id)
            onClose()
        } catch (error) {
            console.error('삭제 실패:', error)
            alert('삭제에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const toggleRepeatDay = (day: number) => {
        setRepeatDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort()
        )
    }

    const weekDays = [
        { value: 1, label: '월' },
        { value: 2, label: '화' },
        { value: 3, label: '수' },
        { value: 4, label: '목' },
        { value: 5, label: '금' },
        { value: 6, label: '토' },
        { value: 0, label: '일' }
    ]

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
        >
            <DialogTitle>
                {schedule ? '스케줄 수정' : '스케줄 추가'}
            </DialogTitle>
            {preSelectedDate && (
                <Box sx={{ px: 3, pb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        {format(preSelectedDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                    </Typography>
                </Box>
            )}

            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <FormControl fullWidth>
                        <InputLabel>직원</InputLabel>
                        <Select
                            value={form.staff_id}
                            label="직원"
                            onChange={e => setForm({ ...form, staff_id: e.target.value })}
                            disabled={!!schedule}
                        >
                            {staffList.filter(s => s.active !== false).map(staff => (
                                <MenuItem key={staff.id} value={staff.id}>
                                    {staff.name} ({staff.role || '직원'})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="시작 시간"
                        type="datetime-local"
                        value={form.start_time}
                        onChange={e => setForm({ ...form, start_time: e.target.value })}
                        fullWidth
                        slotProps={{
                            inputLabel: { shrink: true }
                        }}
                    />

                    <TextField
                        label="종료 시간"
                        type="datetime-local"
                        value={form.end_time}
                        onChange={e => setForm({ ...form, end_time: e.target.value })}
                        fullWidth
                        slotProps={{
                            inputLabel: { shrink: true }
                        }}
                    />

                    {!schedule && (
                        <>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={enableRepeat}
                                        onChange={e => setEnableRepeat(e.target.checked)}
                                    />
                                }
                                label="반복 스케줄"
                            />

                            {enableRepeat && (
                                <Stack spacing={1}>
                                    <Typography variant="caption" color="text.secondary">
                                        반복 요일 선택 (향후 4주 동안 생성됩니다)
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        {weekDays.map(day => (
                                            <Button
                                                key={day.value}
                                                size="small"
                                                variant={repeatDays.includes(day.value) ? 'contained' : 'outlined'}
                                                onClick={() => toggleRepeatDay(day.value)}
                                                sx={{ minWidth: 40 }}
                                            >
                                                {day.label}
                                            </Button>
                                        ))}
                                    </Stack>
                                </Stack>
                            )}
                        </>
                    )}

                    <TextField
                        label="메모"
                        multiline
                        rows={2}
                        value={form.memo || ''}
                        onChange={e => setForm({ ...form, memo: e.target.value })}
                        placeholder="특이사항이나 메모를 입력하세요"
                        fullWidth
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                {schedule && onDelete && (
                    <Button
                        onClick={handleDelete}
                        disabled={loading}
                        color="error"
                        sx={{ mr: 'auto' }}
                    >
                        삭제
                    </Button>
                )}
                <Button onClick={onClose} disabled={loading}>
                    취소
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                >
                    저장
                </Button>
            </DialogActions>
        </Dialog>
    )
}
