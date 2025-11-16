'use client'

type Props = {
  label?: string
  required?: boolean
  helpText?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export default function FormField({ label, required, helpText, error, children, className = '' }: Props) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="mb-1 text-sm text-neutral-700 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-600 font-medium">*</span>}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
      {error ? (
        <div className="mt-1 text-xs text-rose-600">{error}</div>
      ) : helpText ? (
        <div className="mt-1 text-xs text-neutral-500">{helpText}</div>
      ) : null}
    </div>
  )
}


