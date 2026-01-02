'use client'

import { Stack, Paper, Typography, Box, Avatar, Tooltip } from '@mui/material'
import { Staff, StaffAttendance } from '@/types/entities'
import QuickAttendancePanel from './QuickAttendancePanel'
import StaffAttendanceTimeline from './StaffAttendanceTimeline'

interface StaffAttendanceTabProps {
  staff: Staff[]
  actualAttendance: StaffAttendance[]
  workingStaff: Staff[]
  onCheckIn: (staffId: string) => Promise<void>
  onCheckOut: (staffId: string) => Promise<void>
  onOpenAttendanceRecord: (staff: Staff, record?: StaffAttendance) => void
}

export default function StaffAttendanceTab({
  staff,
  actualAttendance,
  workingStaff,
  onCheckIn,
  onCheckOut,
  onOpenAttendanceRecord
}: StaffAttendanceTabProps) {
  return (
    <Stack spacing={4}>
      <QuickAttendancePanel
        staffList={staff}
        attendance={actualAttendance}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
        onOpenRecord={onOpenAttendanceRecord}
      />
      <StaffAttendanceTimeline staffList={staff} attendanceList={actualAttendance} />

      {/* 근무중 직원 카드 */}
      {workingStaff.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'success.light',
            border: '1px solid',
            borderColor: 'success.main'
          }}
        >
          <Typography variant="h6" fontWeight={600} color="success.dark" gutterBottom>
            현재 근무 중인 직원
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            {workingStaff.map(r => (
              <Tooltip key={r.id} title={`${r.name} - 근무 중`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    {...(r.profile_image_url ? {
                      src: r.profile_image_url,
                      imgProps: {
                        onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none'
                        }
                      }
                    } : {})}
                    sx={{
                      width: 40,
                      height: 40,
                      border: '3px solid #10b981',
                      bgcolor: 'success.main'
                    }}
                  >
                    {r.name[0]}
                  </Avatar>
                  <Typography variant="body2" fontWeight={500} color="success.dark">
                    {r.name}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Paper>
      )}
    </Stack>
  )
}
