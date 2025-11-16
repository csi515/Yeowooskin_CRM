'use client'

import type { ReactNode } from 'react'

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'contrast'
export type ButtonSize = 'sm' | 'md'

// Input types
export type InputSize = 'sm' | 'md' | 'lg'

// Modal types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

// Drawer types
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

// Table types
export type SortDirection = 'asc' | 'desc' | null

// Breakpoint types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Common component props
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

export interface WithLabelProps {
  label?: string
  helpText?: string
  error?: string
}

export interface WithSizeProps {
  size?: 'sm' | 'md' | 'lg'
}

export interface WithVariantProps {
  variant?: string
}

// Dropdown item
export interface DropdownItem {
  label: string
  value?: string | number
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
  icon?: ReactNode
}

// Breadcrumb item
export interface BreadcrumbItem {
  label: string
  href?: string
}

// Autocomplete option
export interface AutocompleteOption {
  value: string | number
  label: string
  disabled?: boolean
}
