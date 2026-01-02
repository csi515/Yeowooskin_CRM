import { useState } from 'react'
import { format, addWeeks, getDay, addDays } from 'date-fns'
import { useAppToast } from '../ui/toast'
import { staffApi } from '../api/staff'
import { attendanceApi } from '../api/attendance'
import { exportToCSV } from '../utils/export'
import { Staff, StaffAttendance, StaffAttendanceCreateInput } from '@/types/entities'
import { StaffScheduleRepeat } from '@/types/staff'

export function useStaffHandlers(
  staff: Staff[],
  schedules: StaffAttendance[],
  loadAll: () => Promise<void>
) {
  const toast = useAppToast()

  // Modal states
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [attendanceRecordOpen, setAttendanceRecordOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [weeklyScheduleOpen, setWeeklyScheduleOpen] = useState(false)

  // Selected items
  const [selected, setSelected] = useState<Staff | null>(null)
  const [selectedAttendance, setSelectedAttendance] = useState<StaffAttendance | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // === Export ===
  const handleExport = (tabIndex: number) => {
    if (tabIndex === 2) {
      // Export Staff List
      const data = staff.map(r => ({
        '이름': r.name,
        '직급': r.role || '-',
        '전화번호': r.phone || '-',
        '이메일': r.email || '-',
        '상태': r.active !== false ? '재직' : '퇴사',
        '현재상태': r.status === 'office' ? '근무중' : r.status === 'away' ? '자리비움' : '퇴근'
      }))
      exportToCSV(data, `직원명부_${format(new Date(), 'yyyyMMdd')}.csv`)
    } else {
      // Export Attendance/Schedule
      // Create staff map for name lookup
      const staffMap = staff.reduce((acc, staff) => {
        acc[staff.id] = staff.name
        return acc
      }, {} as Record<string, string>)

      const attendanceData = tabIndex === 0 ? schedules : schedules // Both tabs use schedules for now

      const data = attendanceData.map(a => ({
        '직원명': staffMap[a.staff_id] || '-',
        '유형': a.type === 'actual' ? '실근무' : '스케줄',
        '날짜': format(new Date(a.start_time), 'yyyy-MM-dd'),
        '시작시간': format(new Date(a.start_time), 'HH:mm'),
        '종료시간': format(new Date(a.end_time), 'HH:mm'),
        '상태': a.status,
        '메모': a.memo || '-'
      }))
      exportToCSV(data, `근태기록_${format(new Date(), 'yyyyMM')}.csv`)
    }
    toast.success('CSV 파일이 다운로드되었습니다')
  }

  // === 출퇴근 기록 핸들러 ===
  const handleCheckIn = async (staffId: string): Promise<void> => {
    try {
      const now = new Date()
      const endTime = new Date(now.getTime() + 9 * 60 * 60 * 1000) // 9시간 후

      await attendanceApi.create({
        staff_id: staffId,
        type: 'actual',
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        status: 'normal',
        memo: '출근 기록'
      })

      toast.success('출근 기록이 저장되었습니다')
      await loadAll()
    } catch (error) {
      console.error('출근 실패:', error)
      toast.error('출근 기록에 실패했습니다')
    }
  }

  const handleCheckOut = async (staffId: string): Promise<void> => {
    try {
      // 오늘의 출근 기록 찾기
      const today = new Date()
      const todayRecord = schedules.find(a => {
        const recordDate = new Date(a.start_time)
        return a.staff_id === staffId &&
          recordDate.toDateString() === today.toDateString()
      })

      if (!todayRecord) {
        toast.error('출근 기록을 찾을 수 없습니다')
        return
      }

      // 퇴근 시간 업데이트
      await attendanceApi.update(todayRecord.id, {
        end_time: new Date().toISOString()
      })

      toast.success('퇴근 기록이 저장되었습니다')
      await loadAll()
    } catch (error) {
      console.error('퇴근 실패:', error)
      toast.error('퇴근 기록에 실패했습니다')
    }
  }

  const handleOpenAttendanceRecord = (staff: Staff, record?: StaffAttendance) => {
    setSelected(staff)
    setSelectedAttendance(record || null)
    setAttendanceRecordOpen(true)
  }

  const handleSaveAttendanceRecord = async (data: StaffAttendanceCreateInput) => {
    try {
      if (selectedAttendance) {
        await attendanceApi.update(selectedAttendance.id, data)
        toast.success('근태 기록이 수정되었습니다')
      } else {
        await attendanceApi.create(data)
        toast.success('근태 기록이 추가되었습니다')
      }
      await loadAll()
    } catch (error) {
      console.error('저장 실패:', error)
      throw error
    }
  }

  const handleDeleteAttendanceRecord = async (id: string) => {
    try {
      await attendanceApi.delete(id)
      toast.success('근태 기록이 삭제되었습니다')
      await loadAll()
    } catch (error) {
      console.error('삭제 실패:', error)
      throw error
    }
  }

  // === 스케줄 핸들러 ===
  const handleOpenSchedule = (staff: Staff, date: Date, schedule?: StaffAttendance) => {
    setSelected(staff)
    setSelectedDate(date)
    setSelectedAttendance(schedule || null)
    setScheduleOpen(true)
  }

  const handleSaveSchedule = async (
    data: StaffAttendanceCreateInput,
    repeat?: StaffScheduleRepeat
  ) => {
    try {
      if (selectedAttendance) {
        // 수정 모드
        await attendanceApi.update(selectedAttendance.id, data)
        toast.success('스케줄이 수정되었습니다')
      } else {
        // 추가 모드
        if (repeat && repeat.days.length > 0) {
          // 반복 스케줄 생성 (향후 4주)
          const baseDate = new Date(data.start_time)
          const startTime = format(new Date(data.start_time), 'HH:mm')
          const endTime = format(new Date(data.end_time), 'HH:mm')

          const promises = []
          for (let week = 0; week < 4; week++) {
            for (const day of repeat.days) {
              const targetDate = addWeeks(baseDate, week)
              const targetDay = getDay(targetDate)
              const daysToAdd = (day - targetDay + 7) % 7
              const scheduleDate = addDays(targetDate, daysToAdd)

              const scheduleData: StaffAttendanceCreateInput = {
                ...data,
                start_time: `${format(scheduleDate, 'yyyy-MM-dd')}T${startTime}`,
                end_time: `${format(scheduleDate, 'yyyy-MM-dd')}T${endTime}`
              }

              promises.push(attendanceApi.create(scheduleData))
            }
          }

          await Promise.all(promises)
          toast.success(`${promises.length}개의 스케줄이 생성되었습니다`)
        } else {
          await attendanceApi.create(data)
          toast.success('스케줄이 추가되었습니다')
        }
      }
      await loadAll()
    } catch (error) {
      console.error('저장 실패:', error)
      throw error
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      await attendanceApi.delete(id)
      toast.success('스케줄이 삭제되었습니다')
      await loadAll()
    } catch (error) {
      console.error('삭제 실패:', error)
      throw error
    }
  }

  // 빠른 스케줄 생성 핸들러
  const handleQuickScheduleCreate = async (staffId: string, date: Date, startTime: string, endTime: string) => {
    try {
      // 해당 날짜에 이미 스케줄이 있는지 확인
      const existingSchedule = schedules.find(s =>
        s.staff_id === staffId &&
        s.type === 'scheduled' &&
        format(new Date(s.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      )

      if (existingSchedule) {
        toast.warning('해당 날짜에 이미 스케줄이 있습니다')
        return
      }

      await attendanceApi.create({
        staff_id: staffId,
        type: 'scheduled',
        start_time: `${format(date, 'yyyy-MM-dd')}T${startTime}`,
        end_time: `${format(date, 'yyyy-MM-dd')}T${endTime}`,
        status: 'scheduled',
        memo: '빠른 스케줄 생성'
      })

      toast.success('스케줄이 생성되었습니다')
      await loadAll()
    } catch (error) {
      console.error('빠른 스케줄 생성 실패:', error)
      toast.error('스케줄 생성에 실패했습니다')
      throw error
    }
  }

  // 일괄 스케줄 적용 핸들러
  const handleBulkScheduleApply = async (staffIds: string[], dates: Date[], startTime: string, endTime: string) => {
    try {
      const promises = []

      for (const staffId of staffIds) {
        for (const date of dates) {
          // 해당 날짜에 이미 스케줄이 있는지 확인
          const existingSchedule = schedules.find(s =>
            s.staff_id === staffId &&
            s.type === 'scheduled' &&
            format(new Date(s.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
          )

          if (!existingSchedule) {
            promises.push(attendanceApi.create({
              staff_id: staffId,
              type: 'scheduled',
              start_time: `${format(date, 'yyyy-MM-dd')}T${startTime}`,
              end_time: `${format(date, 'yyyy-MM-dd')}T${endTime}`,
              status: 'scheduled',
              memo: '일괄 스케줄 적용'
            }))
          }
        }
      }

      await Promise.all(promises)
      toast.success(`${promises.length}개의 스케줄이 생성되었습니다`)
      await loadAll()
    } catch (error) {
      console.error('일괄 스케줄 적용 실패:', error)
      toast.error('일괄 스케줄 적용에 실패했습니다')
      throw error
    }
  }

  // === 직원 관리 핸들러 ===
  const handleEdit = (staff: Staff) => {
    setSelected(staff)
    setDetailOpen(true)
  }

  const handleStatusClick = (staff: Staff) => {
    setSelected(staff)
    setStatusOpen(true)
  }

  const handleStatusSave = async (status: string) => {
    if (!selected) return
    try {
      await staffApi.update(selected.id, { status })
      await loadAll()
      setStatusOpen(false)
      toast.success('상태가 변경되었습니다')
    } catch (e) {
      console.error(e)
      toast.error('상태 변경에 실패했습니다')
    }
  }

  const handleCreateStaff = () => {
    setSelected(null)
    setDetailOpen(true)
  }

  // const handleOpenWeeklySchedule = (staff: Staff) => {
  //   setSelected(staff)
  //   setWeeklyScheduleOpen(true)
  // }

  return {
    // Modal states
    detailOpen,
    statusOpen,
    attendanceRecordOpen,
    scheduleOpen,
    weeklyScheduleOpen,

    // Selected items
    selected,
    selectedAttendance,
    selectedDate,

    // Handlers
    handleExport: (tabIndex: number) => handleExport(tabIndex),
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

    // Modal setters
    setDetailOpen,
    setStatusOpen,
    setAttendanceRecordOpen,
    setScheduleOpen,
    setWeeklyScheduleOpen,
    setSelected,
  }
}
