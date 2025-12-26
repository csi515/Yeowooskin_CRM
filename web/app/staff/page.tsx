'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Users, Clock, Calendar, List, TrendingUp } from 'lucide-react'
import PageHeader, { createActionButton } from '@/app/components/common/PageHeader'
import LoadingState from '@/app/components/common/LoadingState'
import ErrorState from '@/app/components/common/ErrorState'
import EmptyState from '@/app/components/EmptyState'
import StaffDetailModal from '@/app/components/modals/StaffDetailModal'
import StatusChangeModal from '@/app/components/modals/StatusChangeModal'
import StaffDataGrid from '@/app/components/staff/StaffDataGrid'
// import StaffScheduler from '@/app/components/staff/StaffScheduler' // 임시 비활성화: @aldabil/react-scheduler API 호환성 문제
import StaffAttendanceTimeline from '@/app/components/staff/StaffAttendanceTimeline'
import { staffApi } from '@/app/lib/api/staff'
import { attendanceApi } from '@/app/lib/api/attendance'
import { appointmentsApi } from '@/app/lib/api/appointments'
import { Staff, StaffAttendance, Appointment } from '@/types/entities'
import { Box, Paper, Grid, Typography, Stack, Tabs, Tab, Avatar, Tooltip } from '@mui/material'
import { startOfMonth, endOfMonth } from 'date-fns'

/**
 * 직원 통합 관리 대시보드
 * 근태 현황판, 스마트 스케줄러, 명부 관리를 하나의 뷰에서 제공
 */
export default function StaffPage() {
  const [rows, setRows] = useState<Staff[]>([])
  const [attendance, setAttendance] = useState<StaffAttendance[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tabIndex, setTabIndex] = useState(0) // 0: 근태현황, 1: 스케줄러, 2: 명부관리

  const [detailOpen, setDetailOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [selected, setSelected] = useState<Staff | null>(null)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const now = new Date()
      const start = startOfMonth(now).toISOString()
      const end = endOfMonth(now).toISOString()

      // 병렬 데이터 로딩 (전체 데이터를 한 번에 가져와서 하위 컴포넌트에 분배)
      const [staffData, attendanceData, appointmentData] = await Promise.all([
        staffApi.list(),
        attendanceApi.list({ start, end }),
        appointmentsApi.list({ from: start, to: end })
      ])

      setRows(staffData || [])
      setAttendance(attendanceData || [])
      setAppointments(appointmentData || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '데이터 로드 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // 예약 데이터를 스케줄러 형식으로 변환
  const schedulerEvents = useMemo(() => appointments.map(app => ({
    event_id: app.id,
    title: app.notes || '예약 시술',
    start: new Date(app.appointment_date),
    end: new Date(new Date(app.appointment_date).getTime() + 60 * 60 * 1000), // 기본 1시간
    admin_id: app.staff_id,
    color: '#6366f1'
  })), [appointments])

  // 필드 기반 통계 계산
  const stats = {
    total: rows.length,
    active: rows.filter(r => r.active !== false).length,
    atOffice: rows.filter(r => r.status === 'office').length,
    away: rows.filter(r => r.status === 'away').length,
  }

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
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
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

      {/* 실시간 대시보드 요약 케이스 */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: '전체 직원', value: stats.total, color: 'primary', icon: <Users size={20} /> },
          { label: '현재 근무 중', value: stats.atOffice, color: 'success', icon: <Clock size={20} /> },
          { label: '현재 휴무 중', value: stats.away, color: 'warning', icon: <Calendar size={20} /> },
          { label: '월간 성과(건)', value: appointments.length, color: 'info', icon: <TrendingUp size={20} /> },
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
            <Tab label="스마트 스케줄러" icon={<Calendar size={18} />} iconPosition="start" />
            <Tab label="직원 명부" icon={<List size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          {loading && <LoadingState rows={5} variant="card" />}
          {!loading && error && <ErrorState message={error} onRetry={loadAll} />}

          {!loading && !error && (
            <>
              {tabIndex === 0 && (
                <Stack spacing={2}>
                  <StaffAttendanceTimeline staffList={rows} attendanceList={attendance} />
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
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    스케줄러 기능은 현재 업데이트 중입니다.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    곧 다시 제공될 예정입니다.
                  </Typography>
                </Box>
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
    </Box>
  )
}
