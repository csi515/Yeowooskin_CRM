/**
 * Staff 페이지 관련 타입 정의
 */

export interface StaffStats {
  total: number
  active: number
  atOffice: number
  away: number
}

export interface StaffPageState {
  loading: boolean
  error: string
  tabIndex: number
}

export interface StaffModalState {
  detailOpen: boolean
  statusOpen: boolean
  attendanceRecordOpen: boolean
  scheduleOpen: boolean
  weeklyScheduleOpen: boolean
}

export interface StaffSelectedItems {
  selected: any // Staff | null
  selectedAttendance: any // StaffAttendance | null
  selectedDate: Date | null
}

export interface StaffScheduleRepeat {
  days: number[]
}
