'use client'

import clsx from 'clsx'

type Props = {
  title: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
  className?: string
}

export default function PageHeader({ 
  title, 
  subtitle, 
  description,
  actions, 
  breadcrumbs,
  className 
}: Props) {
  return (
    <div className={clsx(
      'bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm sticky top-14 md:top-16 z-[1019]',
      className
    )}>
      <div className="container py-4 md:py-5 px-4 md:px-6">
        {/* 브레드크럼 */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-3" aria-label="브레드크럼">
            <ol className="flex items-center gap-2 text-sm text-neutral-600">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && <span className="text-neutral-400">/</span>}
                  {crumb.href ? (
                    <a 
                      href={crumb.href}
                      className="hover:text-neutral-900 transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-neutral-900 font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 break-words leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-base md:text-lg text-neutral-600">
                {subtitle}
              </p>
            )}
            {description && (
              <p className="mt-2 text-sm text-neutral-500">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
