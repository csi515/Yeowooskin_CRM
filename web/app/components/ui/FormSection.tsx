'use client'

type Props = {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  divider?: boolean
}

export default function FormSection({ title, description, children, className = '', divider = true }: Props) {
  return (
    <section className={`w-full ${className}`}>
      {divider && <div className="border-t border-gray-200 -mx-6 mb-4" />}
      {(title || description) && (
        <div className="mb-2">
          {title && <h4 className="text-sm font-medium text-neutral-800">{title}</h4>}
          {description && <p className="text-sm text-neutral-600 mt-0.5">{description}</p>}
        </div>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </section>
  )
}


