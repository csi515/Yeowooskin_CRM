'use client'

import React, { useId, useState } from 'react'
import clsx from 'clsx'

type TabsProps = {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  className?: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, value: controlled, onValueChange, className, children }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const value = controlled ?? internalValue
  const setValue = onValueChange ?? setInternalValue

  const childArray = React.Children.toArray(children)

  return (
    <div data-tabs-value={value} className={className}>
      {childArray.map((child) => {
        if (!React.isValidElement(child)) return child
        const displayName = (child.type as any)?.displayName

        if (displayName === 'TabsList') {
          return React.cloneElement(child, {
            ...child.props,
            value,
            onValueChange: setValue
          })
        }

        if (displayName === 'TabsContent') {
          const childValue = (child.props as any).value
          return React.cloneElement(child, {
            ...child.props,
            selected: childValue === value
          })
        }

        return child
      })}
    </div>
  )
}
 
type TabsListProps = {
  children: React.ReactNode
  value?: string
  onValueChange?: (v: string) => void
  className?: string
}
export function TabsList({ children, value, onValueChange, className }: TabsListProps) {
  const childArray = React.Children.toArray(children)

  return (
    <div className={clsx('flex items-center gap-6 border-b border-neutral-200', className)} role="tablist">
      {childArray.map((child) => {
        if (!React.isValidElement(child)) return child
        const displayName = (child.type as any)?.displayName

        if (displayName === 'TabsTrigger') {
          const childValue = (child.props as any).value
          const selected = childValue === value
          return React.cloneElement(child, {
            ...child.props,
            selected,
            onSelect: () => onValueChange?.(childValue)
          })
        }

        return child
      })}
    </div>
  )
}
TabsList.displayName = 'TabsList'

type TabsTriggerProps = {
  value: string
  children: React.ReactNode
  selected?: boolean
  onSelect?: () => void
  className?: string
}
export function TabsTrigger({ value: _v, children, selected, onSelect, className }: TabsTriggerProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'relative px-6 py-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-lg transition-all duration-300',
        selected 
          ? 'text-[#F472B6] bg-[#FDF2F8]' 
          : 'hover:bg-neutral-50',
        className
      )}
      role="tab"
      aria-selected={selected}
      aria-controls={selected ? undefined : undefined}
    >
      {children}
      <span
        className={clsx(
          'absolute left-0 -bottom-[1px] h-[2px] w-full rounded-full bg-[#F472B6] transition-all duration-300',
          selected ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
        )}
      />
    </button>
  )
}
 TabsTrigger.displayName = 'TabsTrigger'
 
type TabsContentProps = {
  value: string
  children: React.ReactNode
  className?: string
  selected?: boolean
}
export function TabsContent({ value, children, className, selected }: TabsContentProps) {
  const id = useId()
  if (!selected) return null
  return (
    <div
      id={`tabs-content-${id}-${value}`}
      data-value={value}
      className={clsx('pt-6 animate-fade-in', className)}
      role="tabpanel"
    >
      {children}
    </div>
  )
}
 TabsContent.displayName = 'TabsContent'
 
 export default Tabs
 

