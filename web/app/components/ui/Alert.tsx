'use client'

import clsx from 'clsx'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import type { ReactNode } from 'react'

type AlertVariant = 'success' | 'warning' | 'error' | 'info'

type Props = {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  description?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  icon?: ReactNode
}

const variantStyles: Record<AlertVariant, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-rose-50 border-rose-200 text-rose-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const defaultIcons: Record<AlertVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  error: <AlertCircle className="h-5 w-5 text-rose-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
}

export default function Alert({
  variant = 'info',
  title,
  children,
  description,
  dismissible = false,
  onDismiss,
  className,
  icon,
}: Props) {
  const displayIcon = icon || defaultIcons[variant]
  const displayContent = children || description

  return (
    <div
      className={clsx(
        'relative rounded-lg border p-4 transition-all duration-200',
        variantStyles[variant],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{displayIcon}</div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold mb-1">{title}</h4>
          )}
          {displayContent && (
            <div className="text-sm">{displayContent}</div>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className={clsx(
              'flex-shrink-0 p-1 rounded-md transition-colors',
              'hover:bg-black/5 active:bg-black/10',
              variant === 'success' && 'text-emerald-700 hover:bg-emerald-100',
              variant === 'warning' && 'text-amber-700 hover:bg-amber-100',
              variant === 'error' && 'text-rose-700 hover:bg-rose-100',
              variant === 'info' && 'text-blue-700 hover:bg-blue-100',
            )}
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
