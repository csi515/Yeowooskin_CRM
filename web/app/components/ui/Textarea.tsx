'use client'

import clsx from 'clsx'
import React from 'react'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  helpText?: string
  error?: string
  required?: boolean
  maxLength?: number // 글자수 제한
}

const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ label, helpText, error, className, required, ...rest }, ref) => {
    return (
      <label className="block">
        {label && (
          <div className="mb-2 text-base font-semibold text-neutral-700">
            {label}
            {required && <span className="ml-1 text-error-600">*</span>}
          </div>
        )}
                 <textarea
                   ref={ref}
                   {...rest}
                   maxLength={rest.maxLength || 2000}
                   onFocus={(e) => {
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
                   className={clsx(
                     'min-h-24 w-full min-w-0 rounded-lg border border-neutral-400 bg-white px-3 py-2.5 text-[16px] sm:text-sm text-neutral-900 outline-none shadow-sm transition-all duration-200 placeholder:text-neutral-500 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20 touch-manipulation',
                     error && 'border-error-600 focus:border-error-700 focus:ring-error-200',
                     className,
                   )}
                   autoComplete="off"
                   autoCorrect="off"
                   autoCapitalize="off"
                   spellCheck="false"
                   aria-invalid={!!error}
                   aria-required={required}
                 />
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

Textarea.displayName = 'Textarea'

export default Textarea


