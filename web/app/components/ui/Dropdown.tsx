'use client'

import { useState, useRef, ReactNode } from 'react'
import clsx from 'clsx'
import { useClickOutside } from '@/app/lib/hooks/useClickOutside'
import { ChevronDown } from 'lucide-react'
import Button from './Button'

type DropdownItem = {
  label: string
  value?: string | number
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
  icon?: ReactNode
}

type Props = {
  trigger: ReactNode | string
  items: DropdownItem[]
  onSelect?: (item: DropdownItem) => void
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  className?: string
  disabled?: boolean
}

export default function Dropdown({
  trigger,
  items,
  onSelect,
  placement = 'bottom-left',
  className,
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen)

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return
    
    item.onClick?.()
    onSelect?.(item)
    setIsOpen(false)
  }

  const getPlacementClasses = () => {
    switch (placement) {
      case 'bottom-right':
        return 'right-0 left-auto'
      case 'top-left':
        return 'bottom-full top-auto mb-1'
      case 'top-right':
        return 'bottom-full top-auto right-0 left-auto mb-1'
      default:
        return 'left-0 right-auto'
    }
  }

  const triggerContent =
    typeof trigger === 'string' ? (
      <Button variant="secondary" rightIcon={<ChevronDown className="h-4 w-4" />}>
        {trigger}
      </Button>
    ) : (
      trigger
    )

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      <div onClick={() => !disabled && setIsOpen(!isOpen)}>
        {triggerContent}
      </div>
      
      {isOpen && (
        <div
          className={clsx(
            'absolute mt-1 z-50 min-w-[8rem] bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden',
            getPlacementClasses()
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="h-px bg-neutral-200 my-1" role="separator" />
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(item)}
                disabled={item.disabled}
                className={clsx(
                  'w-full flex items-center gap-2 text-left px-4 py-2 text-sm transition-colors',
                  item.disabled
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100',
                )}
                role="menuitem"
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
