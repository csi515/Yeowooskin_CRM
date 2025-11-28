'use client'

import React, { useState, useRef, lazy, Suspense } from 'react'
import ReservationCreateModal from '../components/modals/ReservationCreateModal'
import ReservationDetailModal from '../components/modals/ReservationDetailModal'
import MobileTimelineView, { type MobileTimelineViewRef } from '../components/appointments/MobileTimelineView'
import type { AppointmentEvent } from '../components/appointments/types'
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'

// FullCalendar 컴포넌트의 ref 타입 정의
type FullCalendarComponentRef = React.ComponentRef<typeof import('@fullcalendar/react').default>

// FullCalendar를 동적 import로 로드하여 번들 크기 감소
const FullCalendarWrapper = lazy(async () => {
  const [
    { default: FullCalendar },
    { default: dayGridPlugin },
    { default: timeGridPlugin },
    { default: interactionPlugin }
  ] = await Promise.all([
    import('@fullcalendar/react'),
    import('@fullcalendar/daygrid'),
    import('@fullcalendar/timegrid'),
    import('@fullcalendar/interaction')
  ])
  
  // forwardRef로 감싸서 ref 전달 지원
  type FullCalendarComponent = typeof FullCalendar
  type FullCalendarComponentProps = React.ComponentProps<FullCalendarComponent>
  type FullCalendarComponentRef = React.ComponentRef<FullCalendarComponent>

  const WrappedComponent = React.forwardRef<FullCalendarComponentRef, FullCalendarComponentProps>(
    function FullCalendarWrapperComponent(props, ref) {
      return (
        <FullCalendar
          {...props}
          ref={ref}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        />
      )
    }
  )
  
  WrappedComponent.displayName = 'FullCalendarWrapper'
  
  return {
    default: WrappedComponent
  }
})

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

// FullCalendar 이벤트 핸들러 타입 정의
type DatesSetArg = {
  start: Date
  end: Date
  view: {
    type: string
    currentStart: Date
    currentEnd: Date
  }
}

type DateClickArg = {
  date: Date
  dateStr: string
  allDay: boolean
  dayEl: HTMLElement
  jsEvent: MouseEvent
  view: {
    type: string
  }
}

type EventClickArg = {
  event: {
    id: string
    title: string
    startStr: string
    endStr: string
    extendedProps?: {
      status?: string
      notes?: string | null
      service_id?: string | null
      customer_id?: string | null
      staff_id?: string | null
    }
  }
  jsEvent: MouseEvent
  view: {
    type: string
  }
}

type EventMountArg = {
  event: {
    id: string
    title: string
    extendedProps?: {
      status?: string
      notes?: string | null
    }
  }
  el: HTMLElement
  view: {
    type: string
  }
}

type DayCellClassNamesArg = {
  date: Date
  dayNumberText: string
  view: {
    type: string
  }
}

type DayCellMountArg = {
  date: Date
  el: HTMLElement
  view: {
    type: string
  }
}

type EventContentArg = {
  event: {
    id: string
    title: string
  }
  view?: {
    type: string
  }
}

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

// AppointmentEvent 타입은 types.ts에서 import

type DateRange = { from?: string; to?: string }

// Helper: 한국어 시간 표기(오전/오후 hh시)
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
      start: a.appointment_date,
      end: a.appointment_date,
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
  const fmt = (d: Date, withYear = false) => {
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    if (withYear) return `${y}년 ${m}월 ${day}일`
    return `${m}월 ${day}일`
  }

  if (viewType === 'dayGridMonth') {
    const y = start.getFullYear()
    const m = start.getMonth() + 1
    return `${y}년 ${m}월`
  }

  if (viewType === 'timeGridWeek') {
    const endAdjusted = new Date(end)
    endAdjusted.setDate(endAdjusted.getDate() - 1)
    return `${fmt(start, true)} ~ ${fmt(endAdjusted)}`
  }

  // day view
  return fmt(start, true)
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
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-3 sm:p-4">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* 날짜 표시 */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900">
              {rangeLabel || '로딩 중...'}
            </h1>
          </div>
          
          {/* 모바일 네비게이션 */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={onPrev}
              aria-label="이전"
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.98] transition touch-manipulation"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-700" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="h-9 px-3 flex items-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.98] transition text-sm font-medium text-neutral-700 touch-manipulation"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="다음"
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.98] transition touch-manipulation"
            >
              <ChevronRight className="h-4 w-4 text-neutral-700" />
            </button>
          </div>
        </div>

        {/* 데스크톱 컨트롤 */}
        <div className="hidden md:flex items-center gap-3">
          {/* 액션 버튼들 */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
          
          {/* 뷰 토글 */}
          <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            {[
              { key: 'dayGridMonth', label: '월' },
              { key: 'timeGridWeek', label: '주' },
              { key: 'timeGridDay', label: '일' },
            ].map((tab) => {
              const active = view === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onChangeView(tab.key as CalendarView)}
                  className={`relative min-w-[60px] rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 touch-manipulation ${
                    active
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* 네비게이션 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              aria-label="이전 기간"
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.98] transition touch-manipulation"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-700" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="h-9 px-3 flex items-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.98] transition text-sm font-medium text-neutral-700 touch-manipulation"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="다음 기간"
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.98] transition touch-manipulation"
            >
              <ChevronRight className="h-4 w-4 text-neutral-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  const [events, setEvents] = useState<AppointmentEvent[]>([])
  const [view, setView] = useState<CalendarView>('dayGridMonth')
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
  const calendarRef = useRef<FullCalendarComponentRef>(null)
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

  const getCalendarApi = () => {
    const inst = calendarRef.current
    if (!inst) return null
    return inst.getApi()
  }

  const handlePrev = () => {
    const api = getCalendarApi()
    if (!api) return
    api.prev()
  }

  const handleNext = () => {
    const api = getCalendarApi()
    if (!api) return
    api.next()
  }

  const handleToday = () => {
    const api = getCalendarApi()
    if (!api) return
    api.today()
  }

  const handleChangeView = (nextView: CalendarView) => {
    setView(nextView)
    const api = getCalendarApi()
    if (!api) return
    const anchor = api.getDate()
    api.changeView(nextView, anchor)
  }

  const handleDatesSet = (arg: DatesSetArg) => {
    // FullCalendar의 dayGridMonth는 보이는 범위의 첫 날(start)이 이전 달일 수 있으므로
    // 실제 현재 뷰의 시작일은 view.currentStart를 사용해야 올바른 월/주/일 레이블이 표시됩니다.
    const gridStart: Date = arg.start
    const gridEnd: Date = arg.end
    const viewStart: Date = arg.view.currentStart || gridStart
    const viewEnd: Date = arg.view.currentEnd || gridEnd

    const from = gridStart ? gridStart.toISOString() : undefined
    const to = gridEnd ? gridEnd.toISOString() : undefined
    const viewType: CalendarView = (arg.view.type as CalendarView) || view

    setRange({ from: from || '', to: to || '' })
    setCurrentDate(viewStart || new Date())
    setRangeLabel(formatRangeLabel(viewStart, viewEnd, viewType))
    reloadCalendar({ from: from || '', to: to || '' })
  }

  const handleDateClick = (info: DateClickArg) => {
    setDraft({
      date: info.dateStr,
      start: '10:00',
      end: '11:00',
      status: 'scheduled',
      notes: '',
    })
    setCreateOpen(true)
  }

  const handleEventClick = ({ event }: EventClickArg) => {
    setSelected({
      id: event.id,
      date: (event.startStr || '').slice(0, 10),
      start: (event.startStr || '').slice(11, 16),
      end: (event.endStr || '').slice(11, 16),
      status: event.extendedProps?.status || 'scheduled',
      notes: event.extendedProps?.notes || '',
      service_id: event.extendedProps?.service_id || '',
      customer_id: event.extendedProps?.customer_id || '',
      staff_id: event.extendedProps?.staff_id || '',
    })
    setDetailOpen(true)
  }

  const handleEventDidMount = (info: EventMountArg) => {
    const status = info.event.extendedProps?.status
      ? ` · ${info.event.extendedProps.status}`
      : ''
    info.el.setAttribute('title', `${info.event.title}${status}`)
    if (String(info.event.extendedProps?.status || '') === 'complete') {
      try {
        info.el.classList.add('line-through', 'opacity-70')
      } catch {
        // noop
      }
    }
  }

  const handleDayCellClassNames = (arg: DayCellClassNamesArg) => {
    const d = arg.date.getDay()
    const classes = ['fc-daycell-modern']
    if (d === 0 || d === 6) {
      classes.push('fc-weekend')
    }
    return classes
  }

  const handleDayCellDidMount = (info: DayCellMountArg) => {
    try {
      info.el.classList.add(
        'transition-colors',
        'hover:bg-slate-50',
        'cursor-pointer',
      )
    } catch {
      // noop
    }
  }

  const renderEventContent = (arg: EventContentArg) => {
    if (arg.view?.type === 'dayGridMonth') {
      const container = document.createElement('div')
      container.className =
        'flex items-center gap-0 text-xs leading-tight text-neutral-800 break-words whitespace-normal px-1 py-0.5'
      container.innerHTML = `
        <span class="break-words whitespace-normal flex-1 min-w-0 font-medium">${arg.event.title || '예약'}</span>
      `
      return { domNodes: [container] }
    }
    return true
  }

  const handleMobileEventClick = (event: AppointmentEvent) => {
    setSelected({
      id: event.id,
      date: (event.start || '').slice(0, 10),
      start: (event.start || '').slice(11, 16),
      end: (event.end || '').slice(11, 16),
      status: event.extendedProps?.status || 'scheduled',
      notes: event.extendedProps?.notes || '',
      service_id: event.extendedProps?.service_id || '',
      customer_id: event.extendedProps?.customer_id || '',
      staff_id: event.extendedProps?.staff_id || '',
    })
    setDetailOpen(true)
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

  return (
    <main className="space-y-3 sm:space-y-4">
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
            leftIcon={<Plus className="h-4 w-4" />}
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
      <div className="md:hidden bg-white rounded-xl border border-neutral-200 shadow-sm p-3">
        <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-1 w-full">
          <button
            type="button"
            onClick={() => {
              setMobileViewMode('timeline')
              // 타임라인으로 전환 후 오늘의 위치로 스크롤
              setTimeout(() => {
                timelineRef.current?.scrollToToday()
              }, 100)
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 touch-manipulation ${
              mobileViewMode === 'timeline'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            타임라인
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('calendar')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 touch-manipulation ${
              mobileViewMode === 'calendar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            달력
          </button>
        </div>
      </div>

      {/* 모바일 타임라인 뷰 */}
      {mobileViewMode === 'timeline' && (
        <div className="md:hidden bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
          <Suspense fallback={
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <div className="pl-4 space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          }>
            <MobileTimelineView
              ref={timelineRef}
              events={events}
              selectedDate={currentDate}
              onEventClick={handleMobileEventClick}
              onDateClick={handleMobileDateClick}
            />
          </Suspense>
        </div>
      )}

      {/* 모바일 달력 뷰 */}
      {mobileViewMode === 'calendar' && (
        <div className="md:hidden bg-white rounded-xl border border-neutral-200 shadow-sm p-1 overflow-hidden">
          <Suspense fallback={
            <div className="h-[calc(100vh-280px)] min-h-[500px] w-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          }>
            <div className="w-full fc-mobile-calendar" style={{ minHeight: 'calc(100vh - 280px)' }}>
              <FullCalendarWrapper
                ref={calendarRef}
                initialView="dayGridMonth"
                initialDate={currentDate}
                headerToolbar={false}
                events={events}
                displayEventTime={false}
                slotMinTime={'00:00:00'}
                slotMaxTime={'23:00:00'}
                datesSet={handleDatesSet}
                dayCellClassNames={handleDayCellClassNames}
                dayCellDidMount={handleDayCellDidMount}
                eventDidMount={handleEventDidMount}
                dateClick={handleDateClick}
                eventContent={renderEventContent}
                eventClick={handleEventClick}
                selectable
                nowIndicator
                height="auto"
                eventBackgroundColor={'#3b82f6'}
                eventBorderColor={'#3b82f6'}
                eventTextColor={'#ffffff'}
                dayMaxEvents={5}
                aspectRatio={1.2}
              />
            </div>
          </Suspense>
        </div>
      )}

      {/* 데스크톱 캘린더 뷰 */}
      <div className="hidden md:block bg-white rounded-xl border border-neutral-200 shadow-sm p-3 lg:p-4 overflow-x-auto">
        <Suspense fallback={
          <div className="h-[600px] w-full flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        }>
          <div className="min-w-[800px]">
            <FullCalendarWrapper
              ref={calendarRef}
              initialView={view}
              initialDate={currentDate}
              headerToolbar={false}
              events={events}
              displayEventTime={true}
              slotMinTime={'00:00:00'}
              slotMaxTime={'23:00:00'}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              datesSet={handleDatesSet}
              dayCellClassNames={handleDayCellClassNames}
              dayCellDidMount={handleDayCellDidMount}
              eventDidMount={handleEventDidMount}
              dateClick={handleDateClick}
              eventContent={renderEventContent}
              eventClick={handleEventClick}
              selectable
              nowIndicator
              height="auto"
              eventBackgroundColor={'#3b82f6'}
              eventBorderColor={'#3b82f6'}
              eventTextColor={'#ffffff'}
              dayMaxEvents={3}
            />
          </div>
        </Suspense>
      </div>

      {/* 모바일 FAB */}
      <button
        className="md:hidden fixed right-4 bottom-4 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl hover:shadow-2xl active:scale-[0.95] inline-flex items-center justify-center z-[1000] touch-manipulation transition-all duration-200 safe-area-inset-bottom"
        style={{
          bottom: 'calc(1rem + env(safe-area-inset-bottom))',
        }}
        aria-label="예약 추가"
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
        <Plus className="h-6 w-6" />
      </button>
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
      </main>
  )
}
