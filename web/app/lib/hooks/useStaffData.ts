import { useState, useEffect, useCallback, useMemo } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { staffApi } from '../api/staff'
import { attendanceApi } from '../api/attendance'
import { settingsApi } from '../api/settings'
import { Staff, StaffAttendance } from '@/types/entities'
import { AppSettings } from '@/types/settings'
import { StaffStats } from '@/types/staff'

export function useStaffData() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [attendance, setAttendance] = useState<StaffAttendance[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const now = new Date()
      const start = startOfMonth(now).toISOString()
      const end = endOfMonth(now).toISOString()

      // 병렬 데이터 로딩
      const [staffData, attendanceData, settingsData] = await Promise.all([
        staffApi.list(),
        attendanceApi.list({ start, end }),
        settingsApi.get().catch(() => null) // 설정 로드 실패 시 null
      ])

      setStaff(staffData || [])
      setAttendance(attendanceData || [])
      setSettings(settingsData)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '데이터 로드 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // 통계 계산
  const stats: StaffStats = useMemo(() => ({
    total: staff.length,
    active: staff.filter(r => r.active !== false).length,
    atOffice: staff.filter(r => r.status === 'office').length,
    away: staff.filter(r => r.status === 'away').length,
  }), [staff])

  // 실제 근무 기록만 필터링 (타임라인용)
  const actualAttendance = useMemo(() =>
    attendance.filter(a => a.type === 'actual'),
    [attendance]
  )

  // 스케줄만 필터링 (스케줄 표용)
  const schedules = useMemo(() =>
    attendance.filter(a => a.type === 'scheduled'),
    [attendance]
  )

  // 근무중인 직원들
  const workingStaff = useMemo(() =>
    staff.filter(r => r.status === 'office'),
    [staff]
  )

  return {
    // Data
    staff,
    attendance,
    settings,
    actualAttendance,
    schedules,
    workingStaff,
    stats,

    // State
    loading,
    error,

    // Actions
    loadAll,
  }
}
