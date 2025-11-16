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
          <div className="mb-1 text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-0.5 text-rose-600">*</span>}
          </div>
        )}
        <textarea
          ref={ref}
          {...rest}
          className={clsx(
            'min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-200',
            className,
          )}
          aria-invalid={!!error}
          aria-required={required}
        />
        {error ? (
          <div className="mt-1 text-xs text-rose-600">{error}</div>
        ) : helpText ? (
          <div className="mt-1 text-xs text-gray-500">{helpText}</div>
        ) : null}
      </label>
    )
  },
)

Textarea.displayName = 'Textarea'

export default Textarea


