'use client'

import { memo } from 'react'
import { Calendar, Bell } from 'lucide-react'
import CollapsibleSection from '../ui/CollapsibleSection'
import Input from '../ui/Input'
import Select from '../ui/Select'
import InfoTooltip from '../ui/InfoTooltip'
import { type BookingSettings } from '@/types/settings'
import { DAY_LABELS } from '@/types/settings'
import clsx from 'clsx'

type Props = {
  data: BookingSettings
  onChange: (data: Partial<BookingSettings>) => void
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function BookingSettingsSection({ data, onChange }: Props) {
  const toggleAvailableDay = (day: string) => {
    const days = data.availableDays.includes(day)
      ? data.availableDays.filter((d) => d !== day)
      : [...data.availableDays, day]
    onChange({ availableDays: days })
  }

  const toggleReminderTiming = (hours: number) => {
    const timings = data.reminderTimings.includes(hours)
      ? data.reminderTimings.filter((t) => t !== hours)
      : [...data.reminderTimings, hours].sort((a, b) => b - a)
    onChange({ reminderTimings: timings })
  }

  return (
    <CollapsibleSection
      title="예약 및 스케줄 정책"
      description="예약 정책과 리마인드 알림을 관리합니다."
      icon={<Calendar className="w-6 h-6" />}
      iconColor="from-blue-500 to-blue-600"
    >
      <div className="space-y-6">
        {/* 예약 시간 정책 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">예약 시간 정책</h3>
            <InfoTooltip content="예약 간격과 하루 최대 예약 시간을 설정하세요." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="최소 예약 간격"
              value={String(data.minBookingInterval)}
              onChange={(e) => onChange({ minBookingInterval: Number(e.target.value) })}
            >
              <option value="15">15분</option>
              <option value="30">30분</option>
              <option value="60">60분</option>
            </Select>

            <Input
              label="하루 최대 예약 가능 시간"
              type="number"
              value={data.maxBookingHoursPerDay}
              onChange={(e) => onChange({ maxBookingHoursPerDay: Number(e.target.value) })}
              helpText="하루에 예약 가능한 최대 시간(시간 단위)"
            />
          </div>

          <div>
            <label className="block mb-3 text-base font-semibold text-neutral-700">예약 가능 요일</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleAvailableDay(day)}
                  className={clsx(
                    'p-3 rounded-lg border-2 font-medium transition-all text-sm sm:text-base',
                    'focus-visible:ring-2 focus-visible:ring-[#F472B6] focus-visible:ring-offset-1',
                    data.availableDays.includes(day)
                      ? 'border-[#F472B6] bg-[#FDF2F8] text-[#F472B6] shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 자동 알림 설정 */}
        <div className="border-t border-neutral-200 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">예약 리마인드 알림</h3>
            <InfoTooltip content="고객에게 예약 리마인드 알림을 발송할 시간을 설정하세요." />
          </div>

          <div>
            <label className="block mb-3 text-base font-semibold text-neutral-700">알림 발송 시간</label>
            <div className="flex flex-wrap gap-2">
              {[24, 12, 3, 1].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => toggleReminderTiming(hours)}
                  className={clsx(
                    'px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all',
                    'focus-visible:ring-2 focus-visible:ring-[#F472B6] focus-visible:ring-offset-1',
                    data.reminderTimings.includes(hours)
                      ? 'border-[#F472B6] bg-[#FDF2F8] text-[#F472B6] shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                  )}
                >
                  {hours}시간 전
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

// React.memo로 래핑하여 props가 변경되지 않으면 리렌더링 방지
export default memo(BookingSettingsSection)
