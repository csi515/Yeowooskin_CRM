'use client'

import { useState, useEffect } from 'react'
import {
    Box,
    Grid,
    Typography,
    Checkbox,
    FormControlLabel,
    Divider,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material'
import { Save, Calendar, Repeat } from 'lucide-react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useAppToast } from '../../lib/ui/toast'
import { settingsApi } from '../../lib/api/settings'
import { Staff } from '@/types/entities'
import { BusinessProfile } from '@/types/settings'

interface WeeklyScheduleModalProps {
    open: boolean
    onClose: () => void
    staff: Staff
    onSaved: () => void
}

interface DaySchedule {
    dayKey: string // monday, tuesday...
    dayLabel: string
    isHoliday: boolean
    startTime: string
    endTime: string
}

const DEFAULT_DAYS: DaySchedule[] = [
    { dayKey: 'monday', dayLabel: '월요일', isHoliday: false, startTime: '09:00', endTime: '18:00' },
    { dayKey: 'tuesday', dayLabel: '화요일', isHoliday: false, startTime: '09:00', endTime: '18:00' },
    { dayKey: 'wednesday', dayLabel: '수요일', isHoliday: false, startTime: '09:00', endTime: '18:00' },
    { dayKey: 'thursday', dayLabel: '목요일', isHoliday: false, startTime: '09:00', endTime: '18:00' },
    { dayKey: 'friday', dayLabel: '금요일', isHoliday: false, startTime: '09:00', endTime: '18:00' },
    { dayKey: 'saturday', dayLabel: '토요일', isHoliday: false, startTime: '09:00', endTime: '18:00' },
    { dayKey: 'sunday', dayLabel: '일요일', isHoliday: true, startTime: '09:00', endTime: '18:00' },
]

export default function WeeklyScheduleModal({
    open,
    onClose,
    staff,
    onSaved
}: WeeklyScheduleModalProps) {
    const [saving, setSaving] = useState(false)
    const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_DAYS)
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
    const [repeatWeeks, setRepeatWeeks] = useState(1)
    const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
    const toast = useAppToast()

    useEffect(() => {
        if (open) {
            fetchSettings()
        }
    }, [open])

    const fetchSettings = async () => {
        try {
            const settings = await settingsApi.get()
            if (settings && settings.businessProfile) {
                setBusinessProfile(settings.businessProfile)
                // Optionally adjust default start/end times based on business hours
            }
        } catch (error) {
            console.error('Failed to load settings', error)
        }
    }

    const handleDayChange = (index: number, field: keyof DaySchedule, value: string | boolean) => {
        const newSchedule = [...schedule]
        const currentDay = newSchedule[index]
        if (!currentDay) return

        newSchedule[index] = {
            ...currentDay,
            [field]: value
        } as DaySchedule
        setSchedule(newSchedule)
    }

    const handleSubmit = async () => {
        try {
            setSaving(true)

            // Validate against business hours if needed
            // For now, simpler validation
            if (!startDate) {
                toast.error('시작 날짜를 선택해주세요')
                return
            }

            const payload = {
                staff_id: staff.id,
                start_date: startDate,
                repeat_weeks: repeatWeeks,
                schedule: schedule.map(d => ({
                    day_of_week: d.dayKey, // monday
                    is_holiday: d.isHoliday,
                    start_time: d.startTime,
                    end_time: d.endTime
                }))
            }

            const res = await fetch('/api/staff/schedule/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error('Failed to save schedule')

            toast.success('스케줄이 설정되었습니다')
            onSaved()
            onClose()
        } catch (error) {
            console.error('Error saving schedule:', error)
            toast.error('스케줄 저장에 실패했습니다')
        } finally {
            setSaving(false)
        }
    }

    // Helper to get min/max time from business profile for a specific day
    const getBusinessHours = (dayKey: string) => {
        if (!businessProfile?.businessHours) return null
        return businessProfile.businessHours[dayKey]
    }

    return (
        <Modal open={open} onClose={onClose} size="lg">
            <ModalHeader title={`${staff.name} 주간 스케줄 설정`} onClose={onClose} />
            <ModalBody>
                <Box className="space-y-6">
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <Input
                                label="스케줄 시작일 (월요일 권장)"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                fullWidth
                                leftIcon={<Calendar size={16} />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>반복 설정</InputLabel>
                                <Select
                                    value={repeatWeeks}
                                    onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                                    label="반복 설정"
                                    startAdornment={<Repeat size={16} className="mr-2 text-gray-500" />}
                                >
                                    <MenuItem value={1}>1주만 적용</MenuItem>
                                    <MenuItem value={2}>2주 반복</MenuItem>
                                    <MenuItem value={4}>4주 (1달) 반복</MenuItem>
                                    <MenuItem value={8}>8주 (2달) 반복</MenuItem>
                                    <MenuItem value={12}>12주 (3달) 반복</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Divider />

                    <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
                        {schedule.map((day, index) => {
                            const businessHours = getBusinessHours(day.dayKey)
                            const isShopClosed = businessHours?.closed

                            return (
                                <Box key={day.dayKey} sx={{ mb: 2, p: 2, bgcolor: day.isHoliday ? 'grey.50' : 'white', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={2}>
                                            <Typography fontWeight="bold" color={day.dayKey === 'sunday' ? 'error.main' : (day.dayKey === 'saturday' ? 'primary.main' : 'inherit')}>
                                                {day.dayLabel}
                                            </Typography>
                                            {isShopClosed && <Typography variant="caption" color="error">매장 휴무</Typography>}
                                        </Grid>
                                        <Grid item xs={12} sm={3}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={day.isHoliday}
                                                        onChange={(e) => handleDayChange(index, 'isHoliday', e.target.checked)}
                                                        size="small"
                                                    />
                                                }
                                                label="휴무"
                                            />
                                        </Grid>
                                        {!day.isHoliday && (
                                            <>
                                                <Grid item xs={6} sm={3}>
                                                    <Input
                                                        type="time"
                                                        label="출근"
                                                        value={day.startTime}
                                                        onChange={(e) => handleDayChange(index, 'startTime', e.target.value)}
                                                        size="small"
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={6} sm={4}>
                                                    <Input
                                                        type="time"
                                                        label="퇴근"
                                                        value={day.endTime}
                                                        onChange={(e) => handleDayChange(index, 'endTime', e.target.value)}
                                                        size="small"
                                                        fullWidth
                                                    />
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                </Box>
                            )
                        })}
                    </Box>
                </Box>
            </ModalBody>
            <ModalFooter>
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="ghost" onClick={onClose}>취소</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={saving}
                        leftIcon={<Save size={18} />}
                    >
                        스케줄 생성
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    )
}
