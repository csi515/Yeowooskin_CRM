'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Clock, Calendar, List, TrendingUp } from 'lucide-react'
import PageHeader, { createActionButton } from '@/app/components/common/PageHeader'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import EmptyState from '@/app/components/EmptyState'
import StaffDetailModal from '@/app/components/modals/StaffDetailModal'
import StatusChangeModal from '@/app/components/modals/StatusChangeModal'
import AttendanceRecordModal from '@/app/components/modals/AttendanceRecordModal'
import ScheduleModal from '@/app/components/modals/ScheduleModal'
import StaffDataGrid from '@/app/components/staff/StaffDataGrid'
import StaffScheduler from '@/app/components/staff/StaffScheduler'
import StaffAttendanceTimeline from '@/app/components/staff/StaffAttendanceTimeline'
import QuickAttendancePanel from '@/app/components/staff/QuickAttendancePanel'
import { staffApi } from '@/app/lib/api/staff'
import { attendanceApi } from '@/app/lib/api/attendance'
import { settingsApi } from '@/app/lib/api/settings'
import { Staff, StaffAttendance, StaffAttendanceCreateInput } from '@/types/entities'
import { AppSettings } from '@/types/settings'
import { Box, Paper, Grid, Typography, Stack, Tabs, Tab, Avatar, Tooltip } from '@mui/material'
import { startOfMonth, endOfMonth, format, addWeeks, getDay, addDays } from 'date-fns'
import { useAppToast } from '@/app/lib/ui/toast'

/**
 * 직원 통합 관리 대시보드
 * 근태 현황판, 스케줄 표, 명부 관리를 하나의 뷰에서 제공
 */
export default function StaffPage() {
  const [rows, setRows] = useState<Staff[]>([])
  const [attendance, setAttendance] = useState<StaffAttendance[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tabIndex, setTabIndex] = useState(0) // 0: 근태현황, 1: 스케줄 표, 2: 명부관리
  const toast = useAppToast()

  // 모달 상태
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [attendanceRecordOpen, setAttendanceRecordOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  // 선택된 항목
  const [selected, setSelected] = useState<Staff | null>(null)
  const [selectedAttendance, setSelectedAttendance] = useState<StaffAttendance | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

      setRows(staffData || [])
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
  const stats = {
    total: rows.length,
    active: rows.filter(r => r.active !== false).length,
    atOffice: rows.filter(r => r.status === 'office').length,
    away: rows.filter(r => r.status === 'away').length,
  }

  // 실제 근무 기록만 필터링 (타임라인용)
  const actualAttendance = (Array.isArray(attendance) ? attendance : []).filter(a => a.type === 'actual')

  // 스케줄만 필터링 (스케줄 표용)
  const schedules = (Array.isArray(attendance) ? attendance : []).filter(a => a.type === 'scheduled')

  // === 출퇴근 기록 핸들러 ===
  const handleCheckIn = async (staffId: string) => {
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

  const handleCheckOut = async (staffId: string) => {
    try {
      // 오늘의 출근 기록 찾기
      const today = new Date()
      const todayRecord = actualAttendance.find(a => {
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
    repeat?: { days: number[] }
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
      setLoading(true)
      await staffApi.update(selected.id, { status })
      await loadAll()
      setStatusOpen(false)
      toast.success('상태가 변경되었습니다')
    } catch (e) {
      console.error(e)
      toast.error('상태 변경에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="직원 통합 관리"
        icon={<Users className="h-5 w-5" />}
        description="출결 확인부터 상세 일정 구성까지 한 곳에서 관리하세요"
        actions={createActionButton(
          '직원 추가',
          () => {
            setSelected(null)
            setDetailOpen(true)
          }
        )}
      />

      {/* 실시간 대시보드 요약 카드 */}
      <Grid container spacing={2}>
        {[
          { label: '전체 직원', value: stats.total, color: 'primary', icon: <Users size={20} /> },
          { label: '현재 근무 중', value: stats.atOffice, color: 'success', icon: <Clock size={20} /> },
          { label: '현재 휴무 중', value: stats.away, color: 'warning', icon: <Calendar size={20} /> },
          { label: '이번달 스케줄', value: schedules.length, color: 'info', icon: <TrendingUp size={20} /> },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${s.color}.light`, color: `${s.color}.main`, display: 'flex' }}>
                {s.icon}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">{s.label}</Typography>
                <Typography variant="h5" fontWeight="900">{s.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 컨텐츠 메인 탭 영역 */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'white' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, bgcolor: '#f9fafb' }}>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} aria-label="staff tabs">
            <Tab label="근무 현황판" icon={<Clock size={18} />} iconPosition="start" />
            <Tab label="스케줄 표" icon={<Calendar size={18} />} iconPosition="start" />
            <Tab label="직원 명부" icon={<List size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          {loading && <LoadingState rows={5} variant="card" />}
          {!loading && error && <ErrorState message={error} onRetry={loadAll} />}

          {!loading && !error && (
            <>
              {tabIndex === 0 && (
                <Stack spacing={3}>
                  <QuickAttendancePanel
                    staffList={rows}
                    attendance={actualAttendance}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                    onOpenRecord={handleOpenAttendanceRecord}
                  />
                  <StaffAttendanceTimeline staffList={rows} attendanceList={actualAttendance} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {rows.filter(r => r.status === 'office').map(r => (
                      <Tooltip key={r.id} title={`${r.name} - 근무 중`}>
                        <Avatar
                          {...(r.profile_image_url ? {
                            src: r.profile_image_url,
                            imgProps: {
                              onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
                                e.currentTarget.style.display = 'none'
                              }
                            }
                          } : {})}
                          sx={{ width: 32, height: 32, border: '2px solid #10b981' }}
                        >
                          {r.name[0]}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </Box>
                </Stack>
              )}
              {tabIndex === 1 && (
                <StaffScheduler
                  staffList={rows}
                  schedules={schedules}
                  onOpenSchedule={handleOpenSchedule}
                />
              )}
              {tabIndex === 2 && (
                <StaffDataGrid rows={rows} onEdit={handleEdit} onStatusClick={handleStatusClick} />
              )}
            </>
          )}

          {rows.length === 0 && !loading && !error && (
            <EmptyState
              title="등록된 직원이 없습니다."
              actionLabel="새 직원 등록"
              actionOnClick={() => { setSelected(null); setDetailOpen(true); }}
            />
          )}
        </Box>
      </Paper>

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
        staffList={rows}
        preSelectedStaff={selected}
        onClose={() => {
          setAttendanceRecordOpen(false)
          setSelectedAttendance(null)
        }}
        onSave={handleSaveAttendanceRecord}
        onDelete={handleDeleteAttendanceRecord}
      />

      <ScheduleModal
        open={scheduleOpen}
        schedule={selectedAttendance}
        staffList={rows}
        preSelectedStaff={selected}
        preSelectedDate={selectedDate}
        defaultWorkHours={settings?.staffSettings?.defaultWorkHours}
        onClose={() => {
          setScheduleOpen(false)
          setSelectedAttendance(null)
          setSelectedDate(null)
        }}
        onSave={handleSaveSchedule}
        onDelete={handleDeleteSchedule}
      />
    </Stack>
  )
}
