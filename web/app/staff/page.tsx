'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import PageHeader, { createActionButton } from '@/app/components/common/PageHeader'
import StaffDetailModal from '@/app/components/modals/StaffDetailModal'
import StatusChangeModal from '@/app/components/modals/StatusChangeModal'
import AttendanceRecordModal from '@/app/components/modals/AttendanceRecordModal'
import ScheduleModal from '@/app/components/modals/ScheduleModal'
import WeeklyScheduleModal from '@/app/components/modals/WeeklyScheduleModal'
import StaffStatsCards from '@/app/components/staff/StaffStatsCards'
import StaffTabsContainer from '@/app/components/staff/StaffTabsContainer'
import StaffAttendanceTab from '@/app/components/staff/StaffAttendanceTab'
import StaffScheduleTab from '@/app/components/staff/StaffScheduleTab'
import StaffListTab from '@/app/components/staff/StaffListTab'
import { Stack } from '@mui/material'
import { Download } from 'lucide-react'
import { useTheme, useMediaQuery } from '@mui/material'

// Hooks
import { useStaffData } from '@/app/lib/hooks/useStaffData'
import { useStaffHandlers } from '@/app/lib/hooks/useStaffHandlers'

/**
 * 직원 통합 관리 대시보드
 * 근태 현황판, 스케줄 표, 명부 관리를 하나의 뷰에서 제공
 */
export default function StaffPage() {
  const [tabIndex, setTabIndex] = useState(0) // 0: 근태현황, 1: 스케줄 표, 2: 명부관리

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Data hook
  const {
    staff,
    actualAttendance,
    schedules,
    workingStaff,
    stats,
    loading,
    error,
    loadAll,
    settings
  } = useStaffData()

  // Handlers hook
  const {
    detailOpen,
    statusOpen,
    attendanceRecordOpen,
    scheduleOpen,
    weeklyScheduleOpen,
    selected,
    selectedAttendance,
    selectedDate,
    handleExport,
    handleCheckIn,
    handleCheckOut,
    handleOpenAttendanceRecord,
    handleSaveAttendanceRecord,
    handleDeleteAttendanceRecord,
    handleOpenSchedule,
    handleSaveSchedule,
    handleDeleteSchedule,
    handleQuickScheduleCreate,
    handleBulkScheduleApply,
    handleEdit,
    handleStatusClick,
    handleStatusSave,
    handleCreateStaff,
    setDetailOpen,
    setStatusOpen,
    setAttendanceRecordOpen,
    setScheduleOpen,
    setWeeklyScheduleOpen,
    setSelected,
  } = useStaffHandlers(staff, schedules, loadAll)


  return (
    <Stack spacing={4} sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <PageHeader
        title="직원 통합 관리"
        icon={<Users className="h-5 w-5" />}
        description="출결 확인부터 상세 일정 구성까지 한 곳에서 관리하세요"
        actions={[
          ...(isMobile ? [] : [createActionButton('CSV 내보내기', () => handleExport(tabIndex), 'secondary', <Download size={16} />)]),
          createActionButton(
            '직원 추가',
            () => {
              setSelected(null)
              setDetailOpen(true)
            }
          ),
          // 주간 스케줄 버튼은 스케줄 탭(index 1)일 때만 보이거나 항상 보이게 할 수 있음
          ...(tabIndex === 1 ? [createActionButton('주간 반복 설정', () => { setSelected(null); setWeeklyScheduleOpen(true) }, 'primary')] : [])
        ]}
      />

      {/* 통계 카드 */}
      <StaffStatsCards
        stats={stats}
        schedulesCount={schedules.length}
      />

      {/* 탭 컨테이너 */}
      <StaffTabsContainer
        tabIndex={tabIndex}
        onTabChange={setTabIndex}
        loading={loading}
        error={error}
        staffCount={staff.length}
        onRetry={loadAll}
        onCreateStaff={handleCreateStaff}
        attendanceTab={
          <StaffAttendanceTab
            staff={staff}
            actualAttendance={actualAttendance}
            workingStaff={workingStaff}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onOpenAttendanceRecord={handleOpenAttendanceRecord}
          />
        }
        scheduleTab={
          <StaffScheduleTab
            staff={staff}
            schedules={schedules}
            onOpenSchedule={handleOpenSchedule}
            onBulkSchedule={handleBulkScheduleApply}
            onQuickSchedule={handleQuickScheduleCreate}
          />
        }
        listTab={
          <StaffListTab
            staff={staff}
            onEdit={handleEdit}
            onStatusClick={handleStatusClick}
          />
        }
      />

      {/* 모달 관리 */}
      <StaffDetailModal
        open={detailOpen}
        item={selected}
        onClose={() => setDetailOpen(false)}
        onSaved={loadAll}
        onDeleted={loadAll}
      />

      <StatusChangeModal
        open={statusOpen}
        staff={selected}
        onClose={() => setStatusOpen(false)}
        onSave={handleStatusSave}
      />

      <AttendanceRecordModal
        open={attendanceRecordOpen}
        record={selectedAttendance}
        staffList={staff}
        preSelectedStaff={selected}
        onClose={() => {
          setAttendanceRecordOpen(false)
        }}
        onSave={handleSaveAttendanceRecord}
        onDelete={handleDeleteAttendanceRecord}
      />

      <ScheduleModal
        open={scheduleOpen}
        schedule={selectedAttendance}
        staffList={staff}
        preSelectedStaff={selected}
        preSelectedDate={selectedDate}
        defaultWorkHours={settings?.staffSettings?.defaultWorkHours}
        onClose={() => {
          setScheduleOpen(false)
        }}
        onSave={handleSaveSchedule}
        onDelete={handleDeleteSchedule}
      />

      {selected && (
        <WeeklyScheduleModal
          open={weeklyScheduleOpen}
          staff={selected}
          onClose={() => setWeeklyScheduleOpen(false)}
          onSaved={loadAll}
        />
      )}
    </Stack>
  )
}
