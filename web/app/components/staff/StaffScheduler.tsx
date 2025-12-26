'use client'

import { ProcessedEvent } from '@aldabil/react-scheduler/dist/types'
import { Staff } from '@/types/entities'
import { Box, Typography } from '@mui/material'

interface StaffSchedulerProps {
    events: ProcessedEvent[]
    staffList: Staff[]
    onEventChange: (event: ProcessedEvent) => void
}

/**
 * 직원 스케줄러 (임시 비활성화)
 * @aldabil/react-scheduler API 호환성 문제로 인해 일시적으로 비활성화됨
 */
export default function StaffScheduler(_props: StaffSchedulerProps) {
    return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
                스케줄러 기능은 현재 업데이트 중입니다.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                곧 다시 제공될 예정입니다.
            </Typography>
        </Box>
    )
}
