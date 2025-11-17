'use client'

import Button from './ui/Button'
import { Inbox, FileX, Search, Package, Calendar, Users } from 'lucide-react'
import clsx from 'clsx'

type EmptyStateType = 'default' | 'no-data' | 'no-search' | 'no-items' | 'no-appointments' | 'no-customers'

type Props = {
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  actionOnClick?: () => void
  type?: EmptyStateType
  icon?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const defaultIcons: Record<EmptyStateType, React.ReactNode> = {
  default: <Inbox className="h-12 w-12 md:h-16 md:w-16 text-neutral-300" />,
  'no-data': <FileX className="h-12 w-12 md:h-16 md:w-16 text-neutral-300" />,
  'no-search': <Search className="h-12 w-12 md:h-16 md:w-16 text-neutral-300" />,
  'no-items': <Package className="h-12 w-12 md:h-16 md:w-16 text-neutral-300" />,
  'no-appointments': <Calendar className="h-12 w-12 md:h-16 md:w-16 text-neutral-300" />,
  'no-customers': <Users className="h-12 w-12 md:h-16 md:w-16 text-neutral-300" />,
}

const defaultTitles: Record<EmptyStateType, string> = {
  default: '데이터가 없습니다.',
  'no-data': '데이터가 없습니다.',
  'no-search': '검색 결과가 없습니다.',
  'no-items': '항목이 없습니다.',
  'no-appointments': '예약이 없습니다.',
  'no-customers': '고객이 없습니다.',
}

const sizeClasses = {
  sm: 'p-8',
  md: 'p-10 md:p-12',
  lg: 'p-12 md:p-16'
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  type = 'default',
  icon,
  className,
  size = 'md'
}: Props) {
  const displayIcon = icon || defaultIcons[type]
  const displayTitle = title || defaultTitles[type]

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-neutral-200 max-w-md mx-auto text-center shadow-sm',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-center mb-4 md:mb-6" aria-hidden="true">
        {displayIcon}
      </div>
      <h3 className="text-base md:text-lg font-semibold text-neutral-900 mb-2">
        {displayTitle}
      </h3>
      {description && (
        <p className="text-sm md:text-base text-neutral-600 mb-6 md:mb-8 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && actionOnClick && (
        <Button 
          size="md" 
          variant="primary" 
          onClick={actionOnClick}
          className="w-full sm:w-auto"
        >
          {actionLabel}
        </Button>
      )}
      {actionLabel && !actionOnClick && actionHref && (
        <a href={actionHref} className="inline-block">
          <Button size="md" variant="primary" className="w-full sm:w-auto">
            {actionLabel}
          </Button>
        </a>
      )}
    </div>
  )
}
