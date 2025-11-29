'use client'

import { useState, memo } from 'react'
import { Store, Clock, Calendar } from 'lucide-react'
import CollapsibleSection from '../ui/CollapsibleSection'
import Input from '../ui/Input'
import Select from '../ui/Select'
import InfoTooltip from '../ui/InfoTooltip'
import { type BusinessProfile } from '@/types/settings'
import { DAY_LABELS } from '@/types/settings'
import clsx from 'clsx'

type Props = {
  data: BusinessProfile
  onChange: (data: Partial<BusinessProfile>) => void
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function BusinessProfileSection({ data, onChange }: Props) {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})

  const toggleDay = (day: string) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }))
  }

  const updateBusinessHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    onChange({
      businessHours: {
        ...data.businessHours,
        [day]: {
          ...(data.businessHours[day] || {}),
          [field]: value,
        },
      },
    })
  }

  const toggleRegularHoliday = (day: string) => {
    const holidays = data.regularHolidays.includes(day)
      ? data.regularHolidays.filter((d) => d !== day)
      : [...data.regularHolidays, day]
    onChange({ regularHolidays: holidays })
  }

  return (
    <CollapsibleSection
      title="가게 기본 정보"
      description="가게의 기본 정보와 영업 시간을 설정합니다."
      icon={<Store className="w-6 h-6" />}
      iconColor="from-pink-500 to-pink-600"
    >
      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="상호명"
              required
              value={data.storeName}
              onChange={(e) => onChange({ storeName: e.target.value })}
              placeholder="예) 여우스킨"
            />
            <Input
              label="대표자 이름"
              value={data.ownerName || ''}
              onChange={(e) => onChange({ ownerName: e.target.value })}
              placeholder="예) 홍길동"
            />
          </div>

          <Input
            label="주소"
            value={data.address || ''}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="예) 서울시 강남구 테헤란로 123"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="전화번호"
              type="tel"
              value={data.phone || ''}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="예) 02-1234-5678"
            />
            <Input
              label="사업자등록번호"
              value={data.businessRegistrationNumber || ''}
              onChange={(e) => onChange({ businessRegistrationNumber: e.target.value })}
              placeholder="예) 123-45-67890"
            />
          </div>

          <Input
            label="업종"
            value={data.businessCategory || ''}
            onChange={(e) => onChange({ businessCategory: e.target.value })}
            placeholder="예) 미용실, 네일샵 등"
          />
        </div>

        {/* 영업 시간 */}
        <div className="border-t border-neutral-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">영업 시간</h3>
            <InfoTooltip content="요일별 영업 시간을 설정하세요. 정기 휴무는 체크박스로 표시할 수 있습니다." />
          </div>

          {/* 영업 시간 요약 뷰 */}
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mb-4">
            {DAYS.map((day) => {
              const hours = data.businessHours[day]
              const isHoliday = data.regularHolidays.includes(day)
              const isClosed = hours?.closed ?? false

              return (
                <div
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={clsx(
                    'text-center p-2 rounded-lg cursor-pointer transition-all',
                    'border-2 hover:shadow-md',
                    isHoliday
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : isClosed
                        ? 'bg-neutral-100 border-neutral-300 text-neutral-500'
                        : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  )}
                >
                  <div className="font-medium text-xs sm:text-sm">{DAY_LABELS[day]}</div>
                  <div className="text-xs mt-1">
                    {isHoliday ? '정기휴무' : isClosed ? '휴무' : `${hours?.open || '09:00'}`}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 상세 설정 */}
          <div className="space-y-3">
            {DAYS.map((day) => {
              const hours = data.businessHours[day]
              const isClosed = hours?.closed ?? false
              const isHoliday = data.regularHolidays.includes(day)

              return (
                <div
                  key={day}
                  className={clsx(
                    'border-2 rounded-lg p-4 transition-all',
                    isHoliday ? 'border-rose-200 bg-rose-50/50' : 'border-neutral-200 bg-white',
                    expandedDays[day] && !isHoliday && 'shadow-md'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isHoliday}
                        onChange={() => toggleRegularHoliday(day)}
                        className="w-4 h-4 rounded border-neutral-300 text-rose-600"
                      />
                      <span className="font-medium text-neutral-700">{DAY_LABELS[day]}</span>
                      {isHoliday && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-rose-600 text-white rounded-full">
                          정기 휴무
                        </span>
                      )}
                    </label>
                    {!isHoliday && (
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {expandedDays[day] ? '접기' : '펼치기'}
                      </button>
                    )}
                  </div>

                  {expandedDays[day] && !isHoliday && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-neutral-200">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isClosed}
                          onChange={(e) => updateBusinessHours(day, 'closed', e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-300"
                        />
                        <span className="text-sm text-neutral-600">이 날은 휴무입니다</span>
                      </label>
                      {!isClosed && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              오픈 시간
                            </label>
                            <input
                              type="time"
                              value={hours?.open || '09:00'}
                              onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                              className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              마감 시간
                            </label>
                            <input
                              type="time"
                              value={hours?.close || '18:00'}
                              onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                              className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 예약 가능 기간 */}
        <div className="border-t border-neutral-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">예약 설정</h3>
          </div>
          <Select
            label="예약 가능 기간"
            value={String(data.bookingAdvanceDays)}
            onChange={(e) => onChange({ bookingAdvanceDays: Number(e.target.value) })}
          >
            <option value="7">1주일 후까지</option>
            <option value="14">2주일 후까지</option>
            <option value="28">4주일 후까지</option>
            <option value="56">8주일 후까지</option>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  )
}

// React.memo로 래핑하여 props가 변경되지 않으면 리렌더링 방지
export default memo(BusinessProfileSection)
