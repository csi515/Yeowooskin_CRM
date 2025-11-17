'use client'

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }

export default function Select({ label, className, children, ...rest }: Props) {
  return (
    <label className="block">
      {label && (
        <div className="mb-2 text-sm font-semibold text-neutral-700">
          {label}
        </div>
      )}
      <select
        {...rest}
        className={`w-full h-11 rounded-lg border border-neutral-400 bg-white px-3 text-base text-neutral-900 outline-none shadow-sm transition-all duration-300 hover:border-neutral-500 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 ${className || ''}`}
      >
        {children}
      </select>
    </label>
  )
}



