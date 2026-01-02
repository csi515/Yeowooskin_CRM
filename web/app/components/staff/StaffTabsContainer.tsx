'use client'

import { ReactNode } from 'react'
import { Clock, Calendar, List } from 'lucide-react'
import { Box, Typography, Paper } from '@mui/material'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/Tabs'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import EmptyState from '@/app/components/EmptyState'

interface StaffTabsContainerProps {
  tabIndex: number
  onTabChange: (index: number) => void
  loading: boolean
  error: string
  staffCount: number
  onRetry: () => void
  onCreateStaff: () => void
  attendanceTab: ReactNode
  scheduleTab: ReactNode
  listTab: ReactNode
}

export default function StaffTabsContainer({
  tabIndex,
  onTabChange,
  loading,
  error,
  staffCount,
  onRetry,
  onCreateStaff,
  attendanceTab,
  scheduleTab,
  listTab
}: StaffTabsContainerProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        bgcolor: 'white',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Tabs value={tabIndex.toString()} onValueChange={(val) => onTabChange(parseInt(val))}>
        <Box sx={{
          px: { xs: 2, sm: 3 },
          pt: 2,
          bgcolor: '#f9fafb',
          borderBottom: 'none'
        }}>
          <TabsList>
            <TabsTrigger value="0">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={18} />
                <Typography variant="body2" fontWeight={500}>근무 현황판</Typography>
              </Box>
            </TabsTrigger>
            <TabsTrigger value="1">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={18} />
                <Typography variant="body2" fontWeight={500}>스케줄 표</Typography>
              </Box>
            </TabsTrigger>
            <TabsTrigger value="2">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <List size={18} />
                <Typography variant="body2" fontWeight={500}>직원 명부</Typography>
              </Box>
            </TabsTrigger>
          </TabsList>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {loading && <LoadingState rows={5} variant="card" />}
          {!loading && error && <ErrorState message={error} onRetry={onRetry} />}

          {!loading && !error && (
            <>
              <TabsContent value="0">
                {attendanceTab}
              </TabsContent>

              <TabsContent value="1">
                {scheduleTab}
              </TabsContent>

              <TabsContent value="2">
                {listTab}
              </TabsContent>
            </>
          )}

          {staffCount === 0 && !loading && !error && (
            <EmptyState
              title="등록된 직원이 없습니다."
              actionLabel="새 직원 등록"
              actionOnClick={onCreateStaff}
            />
          )}
        </Box>
      </Tabs>
    </Paper>
  )
}
