'use client'

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }

export default function Select({ label, className, children, ...rest }: Props) {
  return (
    <label className="block">
      {label && (
        <div className="mb-1 text-sm font-medium text-gray-700">
          {label}
        </div>
      )}
      <select
        {...rest}
        className={`w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${className || ''}`}
      >
        {children}
      </select>
    </label>
  )
}



