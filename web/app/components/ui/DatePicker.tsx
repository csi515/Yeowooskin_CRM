'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Box, Typography, IconButton, Paper, Grid, InputAdornment } from '@mui/material'
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
  if (!value) return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = parseInt(match[1] || '0', 10)
  const month = parseInt(match[2] || '0', 10) - 1
  const day = parseInt(match[3] || '0', 10)

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
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          mt: 1,
          p: 2,
          zIndex: 50,
          width: 280,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton
            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
            size="small"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <ChevronLeft size={18} />
          </IconButton>
          <Typography variant="subtitle2" fontWeight={700}>
            {year}년 {month + 1}월
          </Typography>
          <IconButton
            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
            size="small"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <ChevronRight size={18} />
          </IconButton>
        </Box>
        <Grid container sx={{ mb: 1 }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <Grid item xs={12 / 7} key={day} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" fontWeight={700} color={i === 0 ? 'error.main' : i === 6 ? 'info.main' : 'text.secondary'}>
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={0.5}>
          {days.map((date, idx) => {
            if (!date) {
              return <Grid item xs={12 / 7} key={`empty-${idx}`} sx={{ aspectRatio: '1/1' }} />
            }

            const isSelected = selectedDate &&
              date.getFullYear() === selectedDate.getFullYear() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getDate() === selectedDate.getDate()
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <Grid item xs={12 / 7} key={idx}>
                <IconButton
                  onClick={() => handleDateSelect(date)}
                  size="small"
                  sx={{
                    width: '100%',
                    aspectRatio: '1/1',
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    fontWeight: isToday || isSelected ? 700 : 500,
                    bgcolor: isSelected ? 'primary.main' : isToday ? 'primary.50' : 'transparent',
                    color: isSelected ? 'primary.contrastText' : isToday ? 'primary.main' : 'text.primary',
                    '&:hover': {
                      bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  {date.getDate()}
                </IconButton>
              </Grid>
            )
          })}
        </Grid>
      </Paper>
    )
  }

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%' }} className={className}>
      <Box sx={{ position: 'relative' }}>
        <Input
          {...(label ? { label } : {})}
          {...(helpText ? { helpText } : {})}
          {...(error ? { error } : {})}
          value={displayValue}
          onChange={handleInputChange}
          placeholder={dateFormat.toLowerCase()}
          onClick={() => setIsOpen(true)}
          autoComplete="off"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  <CalendarIcon size={18} />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      {isOpen && renderCalendar()}
    </Box>
  )
}
