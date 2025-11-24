'use client'

import clsx from 'clsx'
import React, { useEffect, useState } from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  helpText?: string
  error?: string
  validating?: boolean
  required?: boolean
  autoFocus?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  maxLength?: number // 글자수 제한
}

const Input = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      helpText,
      error,
      validating,
      className,
      value,
      required,
      autoFocus,
      leftIcon,
      rightIcon,
      ...rest
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!value)
    const [showError, setShowError] = useState(false)

    useEffect(() => {
      setHasValue(!!value)
    }, [value])

    useEffect(() => {
      if (error) {
        setShowError(true)
        const timer = setTimeout(() => setShowError(false), 400)
        return () => clearTimeout(timer)
      }

      return () => {} // 항상 cleanup 함수 반환
    }, [error])

    const getBorderColor = () => {
      if (error) return 'border-error-600 focus:border-error-700 focus:ring-error-200'
      if (validating) return 'border-warning-500 focus:border-warning-600 focus:ring-warning-200'
      if (isFocused) return 'border-secondary-500 focus:border-secondary-500 focus:ring-secondary-500/20'
      return 'border-neutral-400 hover:border-neutral-500'
    }

    return (
      <label className="block">
        {label && (
          <div className="mb-2 flex items-center gap-1 text-base font-semibold text-neutral-700">
            {label}
            {required && <span className="text-error-600">*</span>}
          </div>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              {leftIcon}
            </div>
          )}
          <input
            {...rest}
            ref={ref}
            value={value}
            required={required}
            autoFocus={autoFocus}
            maxLength={rest.maxLength || (rest.type === 'email' ? 255 : rest.type === 'tel' ? 20 : rest.type === 'text' ? 500 : undefined)}
            onFocus={(e) => {
              setIsFocused(true)
              // 모바일에서 입력 필드 포커스 시 자동 스크롤
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setTimeout(() => {
                  e.target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  })
                }, 300)
              }
              rest.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              rest.onBlur?.(e)
            }}
            onChange={(e) => {
              setHasValue(!!e.target.value)
              rest.onChange?.(e)
            }}
            className={clsx(
              'w-full h-11 rounded-lg border border-neutral-400 bg-white px-3 text-[16px] sm:text-sm text-neutral-900 outline-none shadow-sm transition-all duration-200 focus:ring-2 focus:ring-secondary-500/20 touch-manipulation min-w-0',
              leftIcon ? 'pl-10 pr-3' : 'px-3',
              rightIcon ? 'pr-10' : '',
              'placeholder:text-neutral-500 placeholder:transition-opacity placeholder:duration-300',
              hasValue || isFocused ? 'input-placeholder-fade-out' : 'input-placeholder-fade-in',
              getBorderColor(),
              showError && 'input-shake',
              className,
            )}
            autoComplete={rest.type === 'email' ? 'email' : rest.type === 'tel' ? 'tel' : 'off'}
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-required={required}
            aria-invalid={!!error}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <div className="mt-1.5 text-xs sm:text-sm text-error-600 bg-error-50 border border-error-200 rounded-md px-2 py-1.5 animate-slide-in-up">
            {error}
          </div>
        ) : helpText ? (
          <div className="mt-1 text-xs sm:text-sm text-neutral-500">{helpText}</div>
        ) : null}
      </label>
    )
  },
)

Input.displayName = 'Input'

export default Input

