'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import Button from './Button'
import clsx from 'clsx'

type Props = {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ErrorDisplay({
  title = '오류가 발생했습니다',
  message = '잠시 후 다시 시도해주세요.',
  onRetry,
  className,
  size = 'md'
}: Props) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-8 md:p-12'
  }

  return (
    <div
      className={clsx(
        'bg-error-50 border-2 border-error-200 rounded-xl text-center',
        sizeClasses[size],
        className
      )}
      role="alert"
    >
      <div className="flex justify-center mb-4">
        <AlertCircle className="h-12 w-12 md:h-16 md:w-16 text-error-600" />
      </div>
      <h3 className="text-lg md:text-xl font-semibold text-error-900 mb-2">
        {title}
      </h3>
      {message && (
        <p className="text-sm md:text-base text-error-700 mb-6">
          {message}
        </p>
      )}
      {onRetry && (
        <Button
          variant="primary"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={onRetry}
        >
          다시 시도
        </Button>
      )}
    </div>
  )
}
