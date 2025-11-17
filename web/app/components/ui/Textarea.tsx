'use client'

import clsx from 'clsx'
import React from 'react'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  helpText?: string
  error?: string
  required?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ label, helpText, error, className, required, ...rest }, ref) => {
    return (
      <label className="block">
        {label && (
          <div className="mb-2 text-sm font-semibold text-neutral-700">
            {label}
            {required && <span className="ml-1 text-error-600">*</span>}
          </div>
        )}
        <textarea
          ref={ref}
          {...rest}
          className={clsx(
            'min-h-[88px] w-full rounded-lg border border-neutral-400 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none shadow-sm transition-all duration-300 placeholder:text-neutral-500 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200',
            error && 'border-error-600 focus:border-error-700 focus:ring-error-200',
            className,
          )}
          aria-invalid={!!error}
          aria-required={required}
        />
        {error ? (
          <div className="mt-0.5 text-xs text-rose-600">{error}</div>
        ) : helpText ? (
          <div className="mt-0.5 text-xs text-gray-400">{helpText}</div>
        ) : null}
      </label>
    )
  },
)

Textarea.displayName = 'Textarea'

export default Textarea


