'use client'

import Scheduler from '@aldabil/react-scheduler'
import { Staff } from '@/types/entities'
import { Box, Paper, Typography, useTheme, useMediaQuery } from '@mui/material'
import { ProcessedEvent } from '@aldabil/react-scheduler/dist/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface StaffSchedulerProps {
    events: ProcessedEvent[]
    staffList: Staff[]
    onEventChange: (event: ProcessedEvent) => void
}

/**
 * 고밀도 기능을 갖춘 직원별 스마트 스케줄러
 */
export default function StaffScheduler({ events, staffList, onEventChange }: StaffSchedulerProps) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // 리소스(직원) 정의
    const resources = staffList.map(s => ({
        admin_id: s.id,
        title: s.name,
        mobile: s.phone || '',
        avatar: s.profile_image_url || '',
        color: theme.palette.primary.main
    }))

    return (
        <Paper variant="outlined" sx={{ p: 0, borderRadius: 2, overflow: 'hidden', height: 600 }}>
            {/* 팁: z-index 이슈 및 팝업 최적화 */}
            <Scheduler
                view={isMobile ? 'day' : 'week'}
                events={events}
                resources={resources}
                resourceFields={{
                    idField: 'admin_id',
                    textField: 'title',
                    subTextField: 'mobile',
                    avatarField: 'avatar',
                    colorField: 'color',
                }}
                resourceViewMode="tabs" // 직원별 필터링을 위한 탭 모드
                hourFormat="12"
                locale={ko}
                onConfirm={async (event: ProcessedEvent, action: 'edit' | 'create') => {
                    if (action === 'edit' || action === 'create') {
                        onEventChange(event)
                    }
                    return event
                }}
                onEventDrop={async (_droppedOn: any, updatedEvent: ProcessedEvent, _originalEvent: ProcessedEvent) => {
                    onEventChange(updatedEvent)
                    return updatedEvent
                }}
                fields={[
                    {
                        name: 'admin_id',
                        type: 'select',
                        options: staffList.map(s => ({ id: s.id, text: s.name, value: s.id })),
                        config: { label: '담당 직원', required: true }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        options: [
                            { id: 'scheduled', text: '예약됨', value: 'scheduled' },
                            { id: 'completed', text: '완료됨', value: 'completed' },
                            { id: 'cancelled', text: '취소됨', value: 'cancelled' },
                        ],
                        config: { label: '상세 상태' }
                    }
                ]}
                viewerExtraComponent={(_fields, event) => {
                    return (
                        <Box sx={{ p: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                시작: {format(new Date(event.start), 'HH:mm')} / 종료: {format(new Date(event.end), 'HH:mm')}
                            </Typography>
                        </Box>
                    )
                }}
                month={undefined} // 월간 뷰는 공간 효율을 위해 제외 (요청사항: 고밀도)
                day={{
                    startHour: 9,
                    endHour: 22,
                    step: 30,
                }}
                week={{
                    startHour: 9,
                    endHour: 22,
                    step: 30,
                }}
                sx={{
                    '& .rs__cell': {
                        height: '40px !important', // 고밀도 설정을 위한 셀 높이 축소
                    },
                    '& .rs__event__item': {
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        boxShadow: theme.shadows[1],
                    }
                }}
            />
        </Paper>
    )
}
