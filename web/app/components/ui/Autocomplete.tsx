'use client'

import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useClickOutside } from '@/app/lib/hooks/useClickOutside'
import { useDebounce } from '@/app/lib/hooks/useDebounce'
import Input from './Input'
import { ChevronDown, X } from 'lucide-react'

type Option = {
  value: string | number
  label: string
  disabled?: boolean
}

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label?: string
  helpText?: string
  error?: string
  options: Option[]
  value?: string | number
  onChange?: (value: string | number | null) => void
  onSearch?: (query: string) => void | Promise<Option[]>
  placeholder?: string
  loading?: boolean
  multiple?: boolean
  clearable?: boolean
  filterable?: boolean
}

export default function Autocomplete({
  label,
  helpText,
  error,
  options,
  value,
  onChange,
  onSearch,
  placeholder = '검색하거나 선택하세요',
  loading = false,
  clearable = true,
  filterable = true,
  className,
  required,
  autoFocus,
  ...inputProps
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  const debouncedQuery = useDebounce(searchQuery, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen)

  useEffect(() => {
    if (onSearch) {
      const loadOptions = async () => {
        const results = await onSearch(debouncedQuery)
        if (results) {
          setFilteredOptions(results)
        }
      }
      loadOptions()
    } else if (filterable) {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [debouncedQuery, options, onSearch, filterable])

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption ? selectedOption.label : ''

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setIsOpen(true)
    if (!e.target.value) {
      onChange?.(null)
    }
  }

  const handleSelect = (option: Option) => {
    if (option.disabled) return
    
    onChange?.(option.value)
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(null)
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
      e.preventDefault()
      const selectedOption = filteredOptions[highlightedIndex]
      if (selectedOption) {
        handleSelect(selectedOption)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <div className="relative">
        <Input
          {...inputProps}
          ref={inputRef}
          {...(label && { label })}
          {...(helpText && { helpText })}
          {...(error && { error })}
          {...(required !== undefined && { required })}
          {...(autoFocus !== undefined && { autoFocus })}
          value={isOpen ? searchQuery : displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true)
            setSearchQuery('')
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-20"
        />
        <div className="absolute right-3 top-[2.25rem] flex items-center gap-1">
          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={clsx(
              'p-1 text-neutral-400 hover:text-neutral-600 transition-transform',
              isOpen && 'rotate-180'
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-sm text-neutral-500">로딩 중...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-500">결과가 없습니다</div>
          ) : (
            <ul className="py-1">
              {filteredOptions.map((option, index) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option)}
                    disabled={option.disabled}
                    className={clsx(
                      'w-full text-left px-4 py-2 text-sm transition-colors',
                      index === highlightedIndex && 'bg-blue-50',
                      option.value === value && 'bg-blue-100 font-medium',
                      option.disabled
                        ? 'text-neutral-300 cursor-not-allowed'
                        : 'text-neutral-700 hover:bg-neutral-50',
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
