'use client'

import { useState, useEffect } from 'react'
import Input from './Input'
import { formatNumber } from '@/app/lib/utils/format'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  label?: string
  helpText?: string
  error?: string
  value?: number | string
  onChange?: (value: number | null) => void
  formatOnBlur?: boolean
  min?: number
  max?: number
  step?: number
  currency?: boolean
  decimals?: number
}

export default function NumberInput({
  label,
  helpText,
  error,
  value,
  onChange,
  formatOnBlur = true,
  min,
  max,
  step = 1,
  currency = false,
  decimals = 0,
  className,
  ...rest
}: Props) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (value === null || value === undefined) {
      setDisplayValue('')
      return
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value
    
    if (isNaN(numValue)) {
      setDisplayValue('')
      return
    }

    if (formatOnBlur && !isFocused) {
      if (currency) {
        setDisplayValue(formatNumber(numValue, { style: 'currency', currency: 'KRW', minimumFractionDigits: decimals, maximumFractionDigits: decimals }))
      } else {
        setDisplayValue(formatNumber(numValue, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))
      }
    } else {
      setDisplayValue(String(numValue))
    }
  }, [value, isFocused, formatOnBlur, currency, decimals])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // 숫자만 허용 (소수점, 음수 부호 포함)
    const cleanedValue = inputValue.replace(/[^\d.-]/g, '')
    setDisplayValue(cleanedValue)
    
    const numValue = cleanedValue === '' || cleanedValue === '-' ? null : parseFloat(cleanedValue)
    
    if (numValue !== null && !isNaN(numValue)) {
      let finalValue = numValue
      
      if (min !== undefined && finalValue < min) {
        finalValue = min
      }
      if (max !== undefined && finalValue > max) {
        finalValue = max
      }
      
      onChange?.(finalValue)
    } else {
      onChange?.(null)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    rest.onBlur?.(e)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    rest.onFocus?.(e)
  }

  return (
    <Input
      {...Object.fromEntries(
        Object.entries(rest).filter(([key]) => !['label', 'helpText', 'error'].includes(key))
      )}
      {...(label ? { label } : {})}
      {...(helpText ? { helpText } : {})}
      {...(error ? { error } : {})}
      type="text"
      inputMode="numeric"
      step={step}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={className}
    />
  )
}
