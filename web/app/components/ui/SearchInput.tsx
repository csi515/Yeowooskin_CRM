'use client'

import { useState, useEffect } from 'react'
import Input from './Input'
import { useDebounce } from '@/app/lib/hooks/useDebounce'
import { Search } from 'lucide-react'

type Props = Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> & {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  debounceMs?: number
}

export default function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  debounceMs = 300,
  placeholder = '검색...',
  className,
  ...rest
}: Props) {
  const [localValue, setLocalValue] = useState(controlledValue || '')
  const debouncedValue = useDebounce(localValue, debounceMs)

  // Controlled component 처리
  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue)
    }
  }, [controlledValue])

  // Debounced value 변경 시 onSearch 호출
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedValue)
    }
  }, [debouncedValue, onSearch])

  // 즉시 onChange 호출 (debounce 없음)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange?.(newValue)
  }

  return (
    <Input
      {...rest}
      type="search"
      value={localValue}
      onChange={(e) => handleChange(e)}
      placeholder={placeholder}
      className={className}
      leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
    />
  )
}
