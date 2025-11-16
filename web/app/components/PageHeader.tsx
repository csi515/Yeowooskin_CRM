export default function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="-mx-4 md:-mx-0 bg-white/90 backdrop-blur-sm border-b border-neutral-200 shadow-sm sticky top-14 z-sticky">
      <div className="container py-3 md:py-4 lg:py-6 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 mb-2 md:mb-3 lg:mb-6 break-words leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                {subtitle}
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


