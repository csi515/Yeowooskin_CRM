'use client'

import { useState, useRef, lazy, Suspense, useMemo, useEffect } from 'react'
import ReservationCreateModal from '../components/modals/ReservationCreateModal'
import ReservationDetailModal from '../components/modals/ReservationDetailModal'
import FilterBar from '../components/filters/FilterBar'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'

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
  
  return {
    default: function FullCalendarWrapperComponent(props: any) {
      return <FullCalendar {...props} plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} />
    }
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

type AppointmentEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  extendedProps: {
    status?: string
    notes?: string | null
    service_id?: string | null
    customer_id?: string | null
    staff_id?: string | null
    product_name?: string
  }
}

type DateRange = { from?: string; to?: string }

// Helper: 한국어 시간 표기(오전/오후 hh:mm)
const formatKoreanTime = (iso: string): string => {
  try {
    const d = new Date(iso)
    const h = d.getHours()
    const m = d.getMinutes()
    const isAM = h < 12
    const hh = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${isAM ? '오전' : '오후'} ${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  } catch {
    return ''
  }
}

// Helper: 날짜 포맷팅 (월 일 요일)
const formatDateHeader = (date: Date): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayName = days[date.getDay()]
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  if (isToday) {
    return `오늘, ${month}월 ${day}일`
  }
  return `${month}월 ${day}일 ${dayName}요일`
}

const mapAppointments = (rows: AppointmentRow[], products: Product[]): AppointmentEvent[] => {
  const idToName: Record<string, string> = {}
  products.forEach((p) => {
    if (p?.id) idToName[String(p.id)] = p.name
  })

  return rows.map((a) => {
    const timeStr = formatKoreanTime(a.appointment_date)
    const productName = a.service_id && idToName[String(a.service_id)] ? idToName[String(a.service_id)] : null
    const title = productName || '예약'
    const subtitle = a.notes || null

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
        product_name: productName || undefined,
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

// 상태별 색상 매핑
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'complete':
      return 'bg-neutral-200 text-neutral-700'
    case 'cancelled':
      return 'bg-error-100 text-error-700'
    case 'pending':
      return 'bg-warning-100 text-warning-700'
    default:
      return 'bg-secondary-100 text-secondary-700'
  }
}

// 모바일 리스트 뷰 컴포넌트 (구글 캘린더 스타일)
function MobileListView({ 
  events, 
  onEventClick 
}: { 
  events: AppointmentEvent[]
  onEventClick: (event: AppointmentEvent) => void 
}) {
  // 날짜별로 그룹화
  const groupedByDate = useMemo(() => {
    const groups: Record<string, AppointmentEvent[]> = {}
    events.forEach((event) => {
      const dateKey = event.start.slice(0, 10) // YYYY-MM-DD
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })
    
    // 날짜순 정렬
    return Object.keys(groups)
      .sort()
      .map((dateKey) => ({
        date: new Date(dateKey),
        events: groups[dateKey].sort((a, b) => a.start.localeCompare(b.start))
      }))
  }, [events])

  if (groupedByDate.length === 0) {
    return (
      <div className="py-12 text-center">
        <CalendarIcon className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
        <p className="text-neutral-500 text-sm">예약이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groupedByDate.map(({ date, events }) => (
        <div key={date.toISOString()} className="space-y-2">
          {/* 날짜 헤더 */}
          <div className="sticky top-0 z-10 bg-white py-2 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-neutral-900">
                {formatDateHeader(date)}
              </div>
              <div className="flex-1 h-px bg-neutral-200" />
              <div className="text-xs text-neutral-500">
                {events.length}개
              </div>
            </div>
          </div>

          {/* 이벤트 리스트 */}
          <div className="space-y-2 px-1">
            {events.map((event) => {
              const time = formatKoreanTime(event.start)
              const status = event.extendedProps?.status || 'scheduled'
              
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full text-left p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start gap-3">
                    {/* 시간 표시 */}
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="text-sm font-semibold text-neutral-900 min-w-[60px]">
                        {time}
                      </div>
                    </div>
                    
                    {/* 이벤트 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base font-semibold text-neutral-900 truncate">
                          {event.title}
                        </h3>
                        {status !== 'scheduled' && (
                          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status === 'complete' ? '완료' : status === 'cancelled' ? '취소' : '대기'}
                          </span>
                        )}
                      </div>
                      {event.extendedProps?.notes && (
                        <p className="text-sm text-neutral-600 line-clamp-2">
                          {event.extendedProps.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
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
    <FilterBar>
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col items-center justify-center md:items-start gap-2 md:flex-row md:gap-3">
          <div className="text-xl md:text-2xl font-semibold text-neutral-900">
            {rangeLabel || '로딩 중...'}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          {/* 액션 버튼들 (데스크톱) */}
          {actions && (
            <div className="hidden md:flex items-center gap-2">
              {actions}
            </div>
          )}
          
          {/* 월 / 주 / 일 토글 */}
          <div className="inline-flex items-center rounded-lg border border-neutral-300 bg-white p-1 shadow-sm">
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
                  className={`relative min-w-[64px] rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-action-blue-600 text-white shadow-md'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* 이전 / 오늘 / 다음 이동 */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onPrev}
              aria-label="이전 기간"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 bg-white text-base text-neutral-700 shadow-sm hover:bg-neutral-50 active:scale-[0.98] transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="inline-flex h-11 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 active:scale-[0.98] transition whitespace-nowrap"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="다음 기간"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 bg-white text-base text-neutral-700 shadow-sm hover:bg-neutral-50 active:scale-[0.98] transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </FilterBar>
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
  const calendarRef = useRef<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  // 모바일 감지
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const reloadCalendar = async (opt?: { from?: string; to?: string }): Promise<void> => {
    try {
      const from = opt?.from ?? range.from
      const to = opt?.to ?? range.to
      const qs = new URLSearchParams()
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      const aUrl = `/api/appointments${qs.toString() ? `?${qs.toString()}` : ''}`

      const { appointmentsApi } = await import('@/app/lib/api/appointments')
      const { productsApi } = await import('@/app/lib/api/products')
      const [rows, products] = await Promise.all([
        appointmentsApi.list({ from, to }),
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
    if (!inst || typeof inst.getApi !== 'function') return null
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
    const gridStart: Date = arg.start
    const gridEnd: Date = arg.end
    const viewStart: Date = arg.view.currentStart || gridStart
    const viewEnd: Date = arg.view.currentEnd || gridEnd

    const from = gridStart ? gridStart.toISOString() : undefined
    const to = gridEnd ? gridEnd.toISOString() : undefined
    const viewType: CalendarView = (arg.view.type as CalendarView) || view

    setRange({ from, to })
    setCurrentDate(viewStart || new Date())
    setRangeLabel(formatRangeLabel(viewStart, viewEnd, viewType))
    reloadCalendar({ from, to })
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
      service_id: event.extendedProps?.service_id || undefined,
      customer_id: event.extendedProps?.customer_id || undefined,
      staff_id: event.extendedProps?.staff_id || undefined,
    })
    setDetailOpen(true)
  }

  const handleMobileEventClick = (event: AppointmentEvent) => {
    setSelected({
      id: event.id,
      date: (event.start || '').slice(0, 10),
      start: (event.start || '').slice(11, 16),
      end: (event.end || '').slice(11, 16),
      status: event.extendedProps?.status || 'scheduled',
      notes: event.extendedProps?.notes || '',
      service_id: event.extendedProps?.service_id || undefined,
      customer_id: event.extendedProps?.customer_id || undefined,
      staff_id: event.extendedProps?.staff_id || undefined,
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
        'hover:bg-neutral-50',
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
        'flex items-start gap-1 text-[11px] leading-tight text-neutral-800 break-words whitespace-normal'
      container.innerHTML = `
        <span class="inline-flex h-1.5 w-1.5 rounded-full bg-action-blue-600 mt-0.5 flex-shrink-0"></span>
        <span class="break-words whitespace-normal flex-1 min-w-0">${arg.event.title || '예약'}</span>
      `
      return { domNodes: [container] }
    }
    return true
  }

  return (
    <main className="space-y-3 md:space-y-4">
      <CalendarHeader
        view={view}
        rangeLabel={rangeLabel}
        onChangeView={handleChangeView}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
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
          </div>
        }
      />

      {/* 모바일: 리스트 뷰, 데스크톱: 캘린더 뷰 */}
      <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-4 md:p-6">
        {isMobile ? (
          <MobileListView events={events} onEventClick={handleMobileEventClick} />
        ) : (
          <Suspense fallback={<div className="h-96 w-full flex items-center justify-center"><Skeleton className="h-full w-full" /></div>}>
            <div className="min-w-[600px]">
              <FullCalendarWrapper
                ref={calendarRef}
                initialView={view}
                initialDate={currentDate}
                headerToolbar={false}
                events={events}
                displayEventTime={false}
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
                eventBackgroundColor={'#4263EB'}
                eventBorderColor={'#4263EB'}
                eventTextColor={'#ffffff'}
                dayMaxEvents
              />
            </div>
          </Suspense>
        )}
      </div>

      {/* Mobile FAB for quick create */}
      <button
        className="md:hidden fixed right-4 bottom-4 h-14 w-14 rounded-full bg-action-blue-600 text-white shadow-lg hover:bg-action-blue-700 active:scale-[0.98] inline-flex items-center justify-center z-[1000] transition-all"
        aria-label="예약 추가"
        onClick={() => { 
          setDraft({ 
            date: new Date().toISOString().slice(0,10), 
            start: '10:00', 
            end: '11:00', 
            status: 'scheduled', 
            notes: '' 
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
