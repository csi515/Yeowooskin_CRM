'use client'

import { Staff, StaffAttendance } from '@/types/entities'
import StaffScheduler from './StaffScheduler'

interface StaffScheduleTabProps {
  staff: Staff[]
  schedules: StaffAttendance[]
  onOpenSchedule: (staff: Staff, date: Date, schedule?: StaffAttendance) => void
  onBulkSchedule: (staffIds: string[], dates: Date[], startTime: string, endTime: string) => Promise<void>
  onQuickSchedule: (staffId: string, date: Date, startTime: string, endTime: string) => Promise<void>
}

export default function StaffScheduleTab({
  staff,
  schedules,
  onOpenSchedule,
  onBulkSchedule,
  onQuickSchedule
}: StaffScheduleTabProps) {
  return (
    <StaffScheduler
      staffList={staff}
      schedules={schedules}
      onOpenSchedule={onOpenSchedule}
      onBulkSchedule={onBulkSchedule}
      onQuickSchedule={onQuickSchedule}
    />
  )
}
