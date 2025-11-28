'use client'

import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Calendar } from 'lucide-react'
import { useClickOutside } from '@/app/lib/hooks/useClickOutside'
import Input from './Input'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  label?: string
  helpText?: string
  error?: string
  value?: Date | string | null
  onChange?: (date: Date | null) => void
  dateFormat?: string
}

const defaultDateFormat = 'YYYY-MM-DD'

function formatDate(date: Date, format: string = defaultDateFormat): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
}

function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match || !match[1] || !match[2] || !match[3]) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const day = parseInt(match[3], 10)
  
  const date = new Date(year, month, day)
  if (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  ) {
    return date
  }
  
  return null
}

export default function DatePicker({
  label,
  helpText,
  error,
  value,
  onChange,
  dateFormat = defaultDateFormat,
  className,
  ...rest
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayValue, setDisplayValue] = useState('')
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    if (value instanceof Date) return value
    if (typeof value === 'string') {
      const parsed = parseDate(value)
      return parsed || new Date()
    }
    return new Date()
  })
  
  const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen)

  useEffect(() => {
    if (value instanceof Date) {
      setDisplayValue(formatDate(value, dateFormat))
      setCalendarDate(value)
    } else if (typeof value === 'string' && value) {
      const parsed = parseDate(value)
      if (parsed) {
        setDisplayValue(formatDate(parsed, dateFormat))
        setCalendarDate(parsed)
      } else {
        setDisplayValue(value)
      }
    } else {
      setDisplayValue('')
    }
  }, [value, dateFormat])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    if (inputValue) {
      const parsed = parseDate(inputValue)
      if (parsed) {
        onChange?.(parsed)
      }
    } else {
      onChange?.(null)
    }
  }

  const handleDateSelect = (date: Date) => {
    onChange?.(date)
    setIsOpen(false)
  }

  const renderCalendar = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const selectedDate = value instanceof Date ? value : (typeof value === 'string' ? parseDate(value) : null)
    
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 z-50 w-72">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            ←
          </button>
          <span className="font-medium">
            {year}년 {month + 1}월
          </span>
          <button
            type="button"
            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="text-center text-xs text-neutral-500 font-medium py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) {
              return <div key={idx} className="aspect-square" />
            }
            
            const isSelected = selectedDate && 
              date.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime()
            const isToday = date.toDateString() === new Date().toDateString()
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDateSelect(date)}
                className={clsx(
                  'aspect-square text-sm rounded hover:bg-neutral-100 transition-colors',
                  isSelected && 'bg-blue-500 text-white hover:bg-blue-600',
                  !isSelected && isToday && 'bg-blue-50 text-blue-600 font-medium',
                  !isSelected && !isToday && 'text-neutral-700'
                )}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <div className="relative">
        <Input
          {...Object.fromEntries(
            Object.entries(rest).filter(([key]) => !['label', 'helpText', 'error'].includes(key))
          )}
          {...(label ? { label } : {})}
          {...(helpText ? { helpText } : {})}
          {...(error ? { error } : {})}
          value={displayValue}
          onChange={handleInputChange}
          placeholder={dateFormat.toLowerCase()}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-[2.25rem] p-1 text-neutral-400 hover:text-neutral-600"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>
      {isOpen && renderCalendar()}
    </div>
  )
}
