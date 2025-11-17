'use client'

import { useState } from 'react'
import clsx from 'clsx'
import Input from './Input'
import Textarea from './Textarea'
import Select from './Select'

type FormFieldProps = {
  label: string
  required?: boolean
  error?: string
  helpText?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ 
  label, 
  required, 
  error, 
  helpText, 
  children, 
  className 
}: FormFieldProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      <label className="block text-sm font-semibold text-neutral-700">
        {label}
        {required && <span className="text-error-600 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-error-600 animate-slide-in-up">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-xs text-neutral-500">{helpText}</p>
      )}
    </div>
  )
}

type FormSectionProps = {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={clsx('space-y-5', className)}>
      {title && (
        <div className="border-b border-neutral-200 pb-3">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          {description && (
            <p className="text-sm text-neutral-600 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-5">
        {children}
      </div>
    </div>
  )
}

export { Input, Textarea, Select }
