'use client'

import Button from './ui/Button'
import { Inbox, FileX, Search, Package } from 'lucide-react'
import clsx from 'clsx'

type EmptyStateType = 'default' | 'no-data' | 'no-search' | 'no-items'

type Props = {
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  actionOnClick?: () => void
  type?: EmptyStateType
  icon?: React.ReactNode
  className?: string
}

const defaultIcons: Record<EmptyStateType, React.ReactNode> = {
  default: <Inbox className="h-16 w-16 text-neutral-300" />,
  'no-data': <FileX className="h-16 w-16 text-neutral-300" />,
  'no-search': <Search className="h-16 w-16 text-neutral-300" />,
  'no-items': <Package className="h-16 w-16 text-neutral-300" />,
}

const defaultTitles: Record<EmptyStateType, string> = {
  default: '데이터가 없습니다.',
  'no-data': '데이터가 없습니다.',
  'no-search': '검색 결과가 없습니다.',
  'no-items': '항목이 없습니다.',
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
}: Props) {
  const displayIcon = icon || defaultIcons[type]
  const displayTitle = title || defaultTitles[type]

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-neutral-200 p-12 max-w-md mx-auto text-center shadow-md',
        className
      )}
    >
      <div className="flex justify-center mb-6">{displayIcon}</div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">{displayTitle}</h3>
      {description && (
        <p className="text-sm text-neutral-600 mb-8 leading-relaxed">{description}</p>
      )}
      {actionLabel && actionOnClick && (
        <Button size="md" variant="primary" onClick={actionOnClick}>
          {actionLabel}
        </Button>
      )}
      {actionLabel && !actionOnClick && actionHref && (
        <a href={actionHref}>
          <Button size="md" variant="primary">{actionLabel}</Button>
        </a>
      )}
    </div>
  )
}


