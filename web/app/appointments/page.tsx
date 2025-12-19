'use client'

import React, { useState, useRef, Suspense, lazy } from 'react'
import ReservationCreateModal from '../components/modals/ReservationCreateModal'
import ReservationDetailModal from '../components/modals/ReservationDetailModal'
import MobileTimelineView, { type MobileTimelineViewRef } from '../components/appointments/MobileTimelineView'
import type { AppointmentEvent } from '../components/appointments/types'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, addWeeks, addDays, subMonths, subWeeks, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import { useTheme } from '@mui/material'

// React Big Calendar를 동적 import로 로드하여 번들 크기 감소
const BigCalendarWrapper = lazy(async () => {
  const { Calendar, dateFnsLocalizer } = await import('react-big-calendar')

  // CSS 임포트 추가
  // @ts-expect-error - CSS import
  await import('react-big-calendar/lib/css/react-big-calendar.css')

  // date-fns 로컬라이저 설정
  const localizer = dateFnsLocalizer({
    format,
    parse: (str: string) => new Date(str),
    startOfWeek: () => startOfWeek(new Date(), { locale: ko }),
    getDay: (date: Date) => date.getDay(),
    locales: { ko },
  })

  const WrappedComponent = React.forwardRef<any, any>(
    function BigCalendarWrapperComponent(props, ref) {
      return (
        <Calendar
          {...props}
          ref={ref}
          localizer={localizer}
          culture="ko"
        />
      )
    }
  )

  WrappedComponent.displayName = 'BigCalendarWrapper'

  return {
    default: WrappedComponent
  }
})

type CalendarView = 'month' | 'week' | 'day'

type SelectedAppointment = {
  id: string
  date: string
  start: string
  end: string
  status: string
  notes: string
  service_id?: string
  customer_id?: string
  staff_id?: string
}

type AppointmentRow = {
  id: string
  appointment_date: string
  status: string
  notes?: string | null
  service_id?: string | null
  customer_id?: string | null
  staff_id?: string | null
}

type Product = {
  id: string | number
  name: string
}

type DateRange = { from?: string; to?: string }

const formatKoreanHour = (iso: string): string => {
  try {
    const d = new Date(iso)
    const h = d.getHours()
    const isAM = h < 12
    const hh = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${isAM ? '오전' : '오후'} ${String(hh).padStart(2, '0')}시`
  } catch {
    return ''
  }
}

const mapAppointments = (rows: AppointmentRow[], products: Product[]): AppointmentEvent[] => {
  const idToName: Record<string, string> = {}
  products.forEach((p) => {
    if (p?.id) idToName[String(p.id)] = p.name
  })

  return rows.map((a) => {
    const titleParts: string[] = []
    titleParts.push(formatKoreanHour(a.appointment_date))
    if (a.service_id && idToName[String(a.service_id)]) {
      titleParts.push(idToName[String(a.service_id)] || '')
    }
    const baseTitle = titleParts.filter(Boolean).join(' · ') || '예약'
    const title = a.notes ? `${baseTitle} · ${a.notes}` : baseTitle

    return {
      id: String(a.id),
      title,
      start: new Date(a.appointment_date),
      end: new Date(a.appointment_date),
      allDay: false,
      extendedProps: {
        status: a.status,
        notes: a.notes ?? '',
        service_id: a.service_id ?? null,
        customer_id: a.customer_id ?? null,
        staff_id: a.staff_id ?? null,
        product_name: a.service_id ? idToName[String(a.service_id)] || '' : '',
      },
    }
  })
}

const formatRangeLabel = (start: Date, end: Date, viewType: CalendarView): string => {
  if (viewType === 'month') {
    return format(start, 'yyyy년 M월', { locale: ko })
  }

  if (viewType === 'week') {
    return `${format(start, 'yyyy년 M월 d일', { locale: ko })} ~ ${format(end, 'M월 d일', { locale: ko })}`
  }

  return format(start, 'yyyy년 M월 d일', { locale: ko })
}

type CalendarHeaderProps = {
  view: CalendarView
  rangeLabel: string
  onChangeView: (view: CalendarView) => void
  onToday: () => void
  onPrev: () => void
  onNext: () => void
  actions?: React.ReactNode
}

function CalendarHeader({
  view,
  rangeLabel,
  onChangeView,
  onToday,
  onPrev,
  onNext,
  actions,
}: CalendarHeaderProps) {
  const theme = useTheme()

  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
        {/* 날짜 표시 & 모바일 네비게이션 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarIcon size={20} color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight="bold">
              {rangeLabel || '로딩 중...'}
            </Typography>
          </Stack>

          {/* 모바일 네비게이션 */}
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton onClick={onPrev} size="small" sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <ChevronLeft size={16} />
            </IconButton>
            <Button variant="outline" size="sm" onClick={onToday} style={{ height: 32 }}>오늘</Button>
            <IconButton onClick={onNext} size="small" sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <ChevronRight size={16} />
            </IconButton>
          </Stack>
        </Box>

        {/* 데스크톱 컨트롤 */}
        <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }} alignItems="center">
          {actions}

          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, nextView) => nextView && onChangeView(nextView)}
            size="small"
            aria-label="달력 보기 모드"
          >
            <ToggleButton value="month">월</ToggleButton>
            <ToggleButton value="week">주</ToggleButton>
            <ToggleButton value="day">일</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={0.5}>
            <IconButton onClick={onPrev} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <ChevronLeft size={18} />
            </IconButton>
            <Button variant="outline" onClick={onToday} sx={{ height: 36, borderColor: theme.palette.divider }}>오늘</Button>
            <IconButton onClick={onNext} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <ChevronRight size={18} />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default function AppointmentsPage() {
  const [events, setEvents] = useState<AppointmentEvent[]>([])
  const [view, setView] = useState<CalendarView>('month')
  const [range, setRange] = useState<DateRange>({})
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [rangeLabel, setRangeLabel] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [draft, setDraft] = useState<{ date: string; start: string; end: string; status: string; notes: string }>({
    date: '',
    start: '10:00',
    end: '11:00',
    status: 'scheduled',
    notes: '',
  })
  const [selected, setSelected] = useState<SelectedAppointment | null>(null)
  const calendarRef = useRef<any>(null)
  const timelineRef = useRef<MobileTimelineViewRef>(null)
  const [mobileViewMode, setMobileViewMode] = useState<'timeline' | 'calendar'>('calendar')


  const reloadCalendar = async (opt?: { from?: string; to?: string }): Promise<void> => {
    try {
      const from = opt?.from ?? range.from
      const to = opt?.to ?? range.to

      const { appointmentsApi } = await import('@/app/lib/api/appointments')
      const { productsApi } = await import('@/app/lib/api/products')
      const options: Parameters<typeof appointmentsApi.list>[0] = {}
      if (from) {
        options.from = from
      }
      if (to) {
        options.to = to
      }
      const [rows, products] = await Promise.all([
        appointmentsApi.list(options),
        productsApi.list({ limit: 1000 }),
      ])
      const rowsArray = Array.isArray(rows) ? (rows as AppointmentRow[]) : []
      const productsArray = Array.isArray(products) ? (products as Product[]) : []
      setEvents(mapAppointments(rowsArray, productsArray))
    } catch (error) {
      if (typeof window !== 'undefined') {
        const { logger } = await import('../lib/utils/logger')
        logger.error('예약 캘린더 로딩 실패', error, 'AppointmentsPage')
      } else {
        console.error('예약 캘린더 로딩 실패', error)
      }
    }
  }

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate)
    updateRangeAndLabel(newDate, view)
  }

  const updateRangeAndLabel = (date: Date, viewType: CalendarView) => {
    let start: Date
    let end: Date
    // ... logic remains same ...
    if (viewType === 'month') {
      start = startOfWeek(startOfMonth(date), { locale: ko })
      end = endOfWeek(endOfMonth(date), { locale: ko })
    } else if (viewType === 'week') {
      start = startOfWeek(date, { locale: ko })
      end = endOfWeek(date, { locale: ko })
    } else {
      start = date
      end = date
    }

    const from = start.toISOString()
    const to = end.toISOString()

    setRange({ from, to })
    setRangeLabel(formatRangeLabel(start, end, viewType))
    reloadCalendar({ from, to })
  }

  const handlePrev = () => {
    const newDate = view === 'month'
      ? subMonths(currentDate, 1)
      : view === 'week'
        ? subWeeks(currentDate, 1)
        : subDays(currentDate, 1)
    handleNavigate(newDate)
  }

  const handleNext = () => {
    const newDate = view === 'month'
      ? addMonths(currentDate, 1)
      : view === 'week'
        ? addWeeks(currentDate, 1)
        : addDays(currentDate, 1)
    handleNavigate(newDate)
  }

  const handleToday = () => {
    handleNavigate(new Date())
  }

  const handleChangeView = (nextView: CalendarView) => {
    setView(nextView)
    updateRangeAndLabel(currentDate, nextView)
  }

  const handleSelectSlot = ({ start }: { start: Date; end: Date }) => {
    setDraft({
      date: start.toISOString().slice(0, 10),
      start: '10:00',
      end: '11:00',
      status: 'scheduled',
      notes: '',
    })
    setCreateOpen(true)
  }

  const handleSelectEvent = (event: AppointmentEvent) => {
    const startDate = typeof event.start === 'string' ? new Date(event.start) : event.start
    setSelected({
      id: event.id,
      date: startDate.toISOString().slice(0, 10),
      start: format(startDate, 'HH:mm'),
      end: format(startDate, 'HH:mm'),
      status: event.extendedProps?.status || 'scheduled',
      notes: event.extendedProps?.notes || '',
      service_id: event.extendedProps?.service_id || '',
      customer_id: event.extendedProps?.customer_id || '',
      staff_id: event.extendedProps?.staff_id || '',
    })
    setDetailOpen(true)
  }

  const handleMobileEventClick = (event: AppointmentEvent) => {
    handleSelectEvent(event)
  }

  const handleMobileDateClick = (date: Date) => {
    setDraft({
      date: date.toISOString().slice(0, 10),
      start: '10:00',
      end: '11:00',
      status: 'scheduled',
      notes: '',
    })
    setCreateOpen(true)
  }

  const eventStyleGetter = (event: AppointmentEvent) => {
    const isComplete = String(event.extendedProps?.status || '') === 'complete'
    return {
      style: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        color: '#ffffff',
        opacity: isComplete ? 0.7 : 1,
        textDecoration: isComplete ? 'line-through' : 'none',
      }
    }
  }

  React.useEffect(() => {
    updateRangeAndLabel(currentDate, view)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Stack spacing={3}>
      <CalendarHeader
        view={view}
        rangeLabel={rangeLabel}
        onChangeView={handleChangeView}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={() => {
              setDraft({
                date: new Date().toISOString().slice(0, 10),
                start: '10:00',
                end: '11:00',
                status: 'scheduled',
                notes: '',
              })
              setCreateOpen(true)
            }}
          >
            예약 추가
          </Button>
        }
      />

      {/* 모바일 뷰 전환 버튼 */}
      <Paper sx={{ display: { md: 'none' }, p: 1.5, borderRadius: 3 }}>
        <ToggleButtonGroup
          value={mobileViewMode}
          exclusive
          onChange={(_, next) => {
            if (!next) return;
            setMobileViewMode(next);
            if (next === 'timeline') {
              setTimeout(() => timelineRef.current?.scrollToToday(), 100)
            }
          }}
          fullWidth
          size="small"
        >
          <ToggleButton value="timeline">타임라인</ToggleButton>
          <ToggleButton value="calendar">달력</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* 모바일 타임라인 뷰 */}
      {mobileViewMode === 'timeline' && (
        <Paper sx={{ display: { md: 'none' }, p: 2, borderRadius: 3 }}>
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <MobileTimelineView
              ref={timelineRef}
              events={events}
              selectedDate={currentDate}
              onEventClick={handleMobileEventClick}
              onDateClick={handleMobileDateClick}
            />
          </Suspense>
        </Paper>
      )}

      {/* 모바일 달력 뷰 */}
      {mobileViewMode === 'calendar' && (
        <Paper sx={{ display: { md: 'none' }, p: 0.5, borderRadius: 3, overflow: 'hidden' }}>
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <Box sx={{ height: 'calc(100vh - 280px)', minHeight: 400 }} className="rbc-mobile-calendar">
              <BigCalendarWrapper
                ref={calendarRef}
                events={events}
                view={view}
                date={currentDate}
                onNavigate={handleNavigate}
                onView={setView}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                selectable
                toolbar={false}
                formats={{
                  monthHeaderFormat: 'yyyy년 M월',
                  weekdayFormat: 'eee',
                  dayFormat: 'd',
                }}
                messages={{
                  today: '오늘',
                  previous: '이전',
                  next: '다음',
                  month: '월',
                  week: '주',
                  day: '일',
                  agenda: '일정',
                  date: '날짜',
                  time: '시간',
                  event: '이벤트',
                  noEventsInRange: '이 범위에 이벤트가 없습니다.',
                  showMore: (total: number) => `+${total} 더보기`,
                }}
              />
            </Box>
          </Suspense>
        </Paper>
      )}

      {/* 데스크톱 캘린더 뷰 */}
      <Paper sx={{ display: { xs: 'none', md: 'block' }, p: 2, borderRadius: 3, overflow: 'hidden' }}>
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
          <Box sx={{ height: 500, minWidth: 800 }}>
            <BigCalendarWrapper
              ref={calendarRef}
              events={events}
              view={view}
              date={currentDate}
              onNavigate={handleNavigate}
              onView={setView}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              selectable
              toolbar={false}
              formats={{
                monthHeaderFormat: 'yyyy년 M월',
                weekdayFormat: 'eee',
                dayFormat: 'd',
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
                  `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
              }}
              messages={{
                today: '오늘',
                previous: '이전',
                next: '다음',
                month: '월',
                week: '주',
                day: '일',
                agenda: '일정',
                date: '날짜',
                time: '시간',
                event: '이벤트',
                noEventsInRange: '이 범위에 이벤트가 없습니다.',
                showMore: (total: number) => `+${total} 더보기`,
              }}
            />
          </Box>
        </Suspense>
      </Paper>


      <ReservationCreateModal
        open={createOpen}
        draft={draft}
        onClose={() => setCreateOpen(false)}
        onSaved={async () => {
          await reloadCalendar()
        }}
      />
      <ReservationDetailModal
        open={detailOpen}
        item={selected}
        onClose={() => setDetailOpen(false)}
        onSaved={async () => {
          await reloadCalendar()
        }}
        onDeleted={async () => {
          await reloadCalendar()
        }}
      />
    </Stack>
  )
}
