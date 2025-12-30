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
import WeeklyScheduleModal from '@/app/components/modals/WeeklyScheduleModal'
import StaffDataGrid from '@/app/components/staff/StaffDataGrid'
import StaffScheduler from '@/app/components/staff/StaffScheduler'
import StaffAttendanceTimeline from '@/app/components/staff/StaffAttendanceTimeline'
import QuickAttendancePanel from '@/app/components/staff/QuickAttendancePanel'
import { staffApi } from '@/app/lib/api/staff'
import { attendanceApi } from '@/app/lib/api/attendance'
import { settingsApi } from '@/app/lib/api/settings'
import { Staff, StaffAttendance, StaffAttendanceCreateInput } from '@/types/entities'
import { AppSettings } from '@/types/settings'
import { Box, Paper, Grid, Typography, Stack, Avatar, Tooltip } from '@mui/material'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/Tabs'
import { startOfMonth, endOfMonth, format, addWeeks, getDay, addDays } from 'date-fns'
import { useAppToast } from '@/app/lib/ui/toast'
import { Download } from 'lucide-react'
import { exportToCSV } from '@/app/lib/utils/export'
import { useTheme, useMediaQuery } from '@mui/material'

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
  const [weeklyScheduleOpen, setWeeklyScheduleOpen] = useState(false)

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

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleExport = () => {
    if (tabIndex === 2) {
      // Export Staff List
      const data = rows.map(r => ({
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
      const staffMap = rows.reduce((acc, staff) => {
        acc[staff.id] = staff.name
        return acc
      }, {} as Record<string, string>)

      const data = attendance.map(a => ({
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
    <Stack spacing={4} sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <PageHeader
        title="직원 통합 관리"
        icon={<Users className="h-5 w-5" />}
        description="출결 확인부터 상세 일정 구성까지 한 곳에서 관리하세요"
        actions={[
          ...(isMobile ? [] : [createActionButton('CSV 내보내기', handleExport, 'secondary', <Download size={16} />)]),
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

      {/* 실시간 대시보드 요약 카드 */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 3 }}>
          대시보드 개요
        </Typography>
      </Box>
      <Grid container spacing={3}>
        {[
          {
            label: '전체 직원',
            value: stats.total,
            color: 'primary',
            bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            icon: <Users size={24} />,
            description: '등록된 총 직원 수'
          },
          {
            label: '현재 근무 중',
            value: stats.atOffice,
            color: 'success',
            bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            icon: <Clock size={24} />,
            description: '실시간 근무 현황'
          },
          {
            label: '현재 휴무 중',
            value: stats.away,
            color: 'warning',
            bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            icon: <Calendar size={24} />,
            description: '휴가 및 외출 중'
          },
          {
            label: '이번달 스케줄',
            value: schedules.length,
            color: 'info',
            bgColor: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
            icon: <TrendingUp size={24} />,
            description: '등록된 근무 스케줄'
          },
        ].map((s) => (
          <Grid item xs={12} sm={6} lg={3} key={s.label}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'white',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                },
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* 배경 그라데이션 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '120px',
                  background: s.bgColor,
                  borderRadius: '50%',
                  transform: 'translate(40px, -40px)',
                  opacity: 0.1,
                  zIndex: 0
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    background: s.bgColor,
                    color: 'white',
                    display: 'flex',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {s.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
                    {s.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                    {s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.description}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 컨텐츠 메인 탭 영역 */}
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
        <Tabs value={tabIndex.toString()} onValueChange={(val) => setTabIndex(parseInt(val))}>
          <TabsList sx={{
            px: { xs: 2, sm: 3 },
            pt: 2,
            bgcolor: '#f9fafb',
            borderBottom: 'none',
            '& .MuiTabs-flexContainer': {
              gap: { xs: 0, sm: 2 }
            }
          }}>
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

          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {loading && <LoadingState rows={5} variant="card" />}
            {!loading && error && <ErrorState message={error} onRetry={loadAll} />}

            {!loading && !error && (
              <>
                <TabsContent value="0">
                  <Stack spacing={4}>
                    <QuickAttendancePanel
                      staffList={rows}
                      attendance={actualAttendance}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                      onOpenRecord={handleOpenAttendanceRecord}
                    />
                    <StaffAttendanceTimeline staffList={rows} attendanceList={actualAttendance} />

                    {/* 근무중 직원 카드 */}
                    {rows.filter(r => r.status === 'office').length > 0 && (
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
                          {rows.filter(r => r.status === 'office').map(r => (
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
                </TabsContent>

                <TabsContent value="1">
                  <StaffScheduler
                    staffList={rows}
                    schedules={schedules}
                    onOpenSchedule={handleOpenSchedule}
                    onBulkSchedule={handleBulkScheduleApply}
                    onQuickSchedule={handleQuickScheduleCreate}
                  />
                </TabsContent>

                <TabsContent value="2">
                  <StaffDataGrid rows={rows} onEdit={handleEdit} onStatusClick={handleStatusClick} />
                </TabsContent>
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
        </Tabs>
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
