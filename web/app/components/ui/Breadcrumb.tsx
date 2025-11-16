'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

type BreadcrumbItem = {
  label: string
  href?: string
}

type Props = {
  items: BreadcrumbItem[]
  showHome?: boolean
  homeHref?: string
  className?: string
}

export default function Breadcrumb({
  items,
  showHome = true,
  homeHref = '/',
  className,
}: Props) {
  return (
    <nav
      className={clsx('flex items-center gap-1 text-sm', className)}
      aria-label="Breadcrumb"
    >
      {showHome && (
        <>
          <Link
            href={homeHref}
            className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 transition-colors"
            aria-label="홈"
          >
            <Home className="h-4 w-4" />
          </Link>
          {items.length > 0 && (
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          )}
        </>
      )}
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        
        return (
          <div key={index} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={clsx(
                  isLast ? 'text-neutral-900 font-medium' : 'text-neutral-600'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-4 w-4 text-neutral-400" />}
          </div>
        )
      })}
    </nav>
  )
}
