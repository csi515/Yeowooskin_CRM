'use client'

import { Search, X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import Input from './Input'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
  onClear?: () => void
}

export default function SearchInput({
  value,
  onChange,
  placeholder = '검색...',
  className,
  debounceMs = 300,
  onClear
}: Props) {
  const [localValue, setLocalValue] = useState(value)

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    if (debounceMs > 0) {
      const timer = setTimeout(() => {
        onChange(newValue)
      }, debounceMs)
      return () => clearTimeout(timer)
    } else {
      onChange(newValue)
    }
  }

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    onClear?.()
  }

  return (
    <div className={clsx('relative', className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <Search className="h-5 w-5 text-neutral-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-neutral-400 bg-white pl-10 pr-10 text-base text-neutral-900 outline-none shadow-sm transition-all duration-300 placeholder:text-neutral-500 hover:border-neutral-500 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
        aria-label="검색"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="검색어 지우기"
        >
          <X className="h-4 w-4 text-neutral-400" />
        </button>
      )}
    </div>
  )
}
