'use client'

import { useState, useEffect, useMemo } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { Calendar, Clock, Phone, Mail, ChevronRight } from 'lucide-react'
import { appointmentsApi } from '@/app/lib/api/appointments'
import { customersApi } from '@/app/lib/api/customers'
import { hapticFeedback } from '@/app/lib/utils/haptic'
import Link from 'next/link'

interface TodayAppointment {
  id: string
  appointment_date: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  product_name: string
  status: string
}

interface TodayScheduleWidgetProps {
  initialAppointments?: TodayAppointment[]
}

export default function TodayScheduleWidget({ initialAppointments = [] }: TodayScheduleWidgetProps) {
  const [appointments, setAppointments] = useState<TodayAppointment[]>(initialAppointments)
  const [loading, setLoading] = useState(false)

  // 오늘 날짜 범위
  const todayRange = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }, [])

  // 오늘 예약 로드
  useEffect(() => {
    const loadTodayAppointments = async () => {
      try {
        setLoading(true)
        const data = await appointmentsApi.list({
          from: todayRange.start,
          to: todayRange.end,
        })

        if (Array.isArray(data) && data.length > 0) {
          // 고객 정보 가져오기
          const customerIds = [...new Set(data.map((a: any) => a.customer_id).filter(Boolean))]
          const customers = await Promise.all(
            customerIds.map(async (id) => {
              try {
                const customer = await customersApi.get(id)
                return { id, ...customer }
              } catch {
                return null
              }
            })
          )

          const customersMap = Object.fromEntries(
            customers.filter(Boolean).map((c: any) => [c.id, c])
          )

          const appointmentsWithDetails: TodayAppointment[] = data.map((a: any) => ({
            id: a.id,
            appointment_date: a.appointment_date,
            customer_name: customersMap[a.customer_id]?.name || '고객',
            customer_phone: customersMap[a.customer_id]?.phone || undefined,
            customer_email: customersMap[a.customer_id]?.email || undefined,
            product_name: a.service_id ? '서비스' : '예약',
            status: a.status || 'scheduled',
          }))

          // 시간순 정렬
          appointmentsWithDetails.sort((a, b) => {
            return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
          })

          setAppointments(appointmentsWithDetails)
        } else {
          setAppointments([])
        }
      } catch (err) {
        console.error('오늘 예약 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTodayAppointments()
  }, [todayRange])

  // 다음 예약 찾기
  const nextAppointment = useMemo(() => {
    const now = new Date()
    return appointments.find((apt) => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate > now
    })
  }, [appointments])

  // 다음 예약까지 남은 시간
  const timeUntilNext = useMemo(() => {
    if (!nextAppointment) return null

    const now = new Date()
    const nextDate = new Date(nextAppointment.appointment_date)
    const diff = nextDate.getTime() - now.getTime()

    if (diff < 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    }
    return `${minutes}분`
  }, [nextAppointment])

  const handleCall = (phone: string) => {
    hapticFeedback('light')
    window.location.href = `tel:${phone}`
  }

  const handleEmail = (email: string) => {
    hapticFeedback('light')
    window.location.href = `mailto:${email}`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-pink-600" />
          <h2 className="text-lg font-bold text-neutral-900">오늘의 일정</h2>
        </div>
        <Link href="/appointments">
          <Button variant="outline" size="sm" className="text-xs">
            전체 보기
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* 다음 예약 카운트다운 */}
      {nextAppointment && timeUntilNext && (
        <div className="mb-4 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-pink-700 font-medium mb-1">다음 예약까지</div>
              <div className="text-lg font-bold text-pink-900">{timeUntilNext}</div>
              <div className="text-sm text-pink-800 mt-1 truncate">
                {nextAppointment.customer_name} · {formatTime(nextAppointment.appointment_date)}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {nextAppointment.customer_phone && (
                <button
                  onClick={() => handleCall(nextAppointment.customer_phone!)}
                  className="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors touch-manipulation"
                  aria-label="전화하기"
                >
                  <Phone className="h-4 w-4" />
                </button>
              )}
              {nextAppointment.customer_email && (
                <button
                  onClick={() => handleEmail(nextAppointment.customer_email!)}
                  className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors touch-manipulation"
                  aria-label="이메일 보내기"
                >
                  <Mail className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 오늘 예약 목록 */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-sm text-neutral-500">로딩 중...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-sm text-neutral-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
            <div>오늘 예약이 없습니다</div>
            <Link href="/appointments" className="text-pink-600 underline mt-2 inline-block">
              예약 추가하기
            </Link>
          </div>
        ) : (
          appointments.map((apt) => {
            const aptDate = new Date(apt.appointment_date)
            const isPast = aptDate < new Date()
            const isNow = Math.abs(aptDate.getTime() - new Date().getTime()) < 30 * 60 * 1000 // 30분 이내

            return (
              <div
                key={apt.id}
                className={`p-3 rounded-lg border transition-all ${
                  isNow
                    ? 'bg-pink-50 border-pink-300 shadow-sm'
                    : isPast
                    ? 'bg-neutral-50 border-neutral-200 opacity-60'
                    : 'bg-white border-neutral-200 hover:border-pink-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className={`h-4 w-4 ${isNow ? 'text-pink-600' : 'text-neutral-400'}`} />
                      <span className={`text-sm font-medium ${isNow ? 'text-pink-900' : 'text-neutral-700'}`}>
                        {formatTime(apt.appointment_date)}
                      </span>
                      {isNow && (
                        <span className="px-2 py-0.5 bg-pink-600 text-white text-xs rounded-full">
                          진행 중
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-neutral-900 truncate">{apt.customer_name}</div>
                    <div className="text-xs text-neutral-600 truncate">{apt.product_name}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {apt.customer_phone && (
                      <button
                        onClick={() => handleCall(apt.customer_phone!)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors touch-manipulation"
                        aria-label="전화하기"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    )}
                    {apt.customer_email && (
                      <button
                        onClick={() => handleEmail(apt.customer_email!)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors touch-manipulation"
                        aria-label="이메일 보내기"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

