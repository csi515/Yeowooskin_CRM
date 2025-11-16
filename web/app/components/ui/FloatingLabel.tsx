'use client'

import clsx from 'clsx'
import { useState, useEffect } from 'react'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> & {
  label: string
  helpText?: string
  error?: string
  validating?: boolean
  required?: boolean
  autoFocus?: boolean
}

export default function FloatingLabel({ 
  label, 
  helpText, 
  error, 
  validating, 
  required,
  autoFocus,
  className, 
  value, 
  onFocus,
  onBlur,
  onChange,
  ...rest 
}: Props) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(!!value)

  useEffect(() => {
    setHasValue(!!value)
  }, [value])

  const isFloating = isFocused || hasValue

  const getBorderColor = () => {
    if (error) return 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
    if (required && !value) return 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
    if (validating) return 'border-amber-400 focus:border-amber-500 focus:ring-amber-200'
    if (isFocused) return 'border-blue-500 focus:border-blue-500 focus:ring-blue-300'
    return 'border-neutral-300 hover:border-neutral-400'
  }

  return (
    <div className="relative block">
      <div className="relative">
        <input
          {...rest}
          value={value}
          required={required}
          autoFocus={autoFocus}
          onFocus={(e) => {
            setIsFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur?.(e)
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value)
            onChange?.(e)
          }}
          placeholder=" "
          className={clsx(
            'w-full h-14 rounded-[16px] border px-4 pt-5 pb-2 outline-none focus:ring-2 bg-white shadow-sm transition-all duration-200',
            getBorderColor(),
            error && 'input-shake',
            className,
          )}
          aria-required={required}
          aria-invalid={!!error}
        />
        <label
          className={clsx(
            'absolute left-4 pointer-events-none transition-all duration-200 origin-left',
            isFloating
              ? 'top-2 text-xs text-neutral-500 scale-90'
              : 'top-1/2 -translate-y-1/2 text-sm text-neutral-600',
            required && 'after:content-["*"] after:ml-0.5 after:text-rose-600'
          )}
        >
          {label}
        </label>
      </div>
      {error ? (
        <div className="mt-1 text-xs text-rose-600 animate-in fade-in duration-200">{error}</div>
      ) : helpText ? (
        <div className="mt-1 text-xs text-neutral-500">{helpText}</div>
      ) : null}
    </div>
  )
}
