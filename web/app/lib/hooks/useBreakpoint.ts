'use client'

import { useEffect, useState } from 'react'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl')
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl')
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg')
      } else if (width >= breakpoints.md) {
        setBreakpoint('md')
      } else if (width >= breakpoints.sm) {
        setBreakpoint('sm')
      } else {
        setBreakpoint('xs')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)

    return () => {
      window.removeEventListener('resize', updateBreakpoint)
    }
  }, [])

  return breakpoint
}

export function useIsBreakpoint(breakpoint: Breakpoint): boolean {
  const current = useBreakpoint()
  return current === breakpoint
}

export function useIsAboveBreakpoint(breakpoint: Breakpoint): boolean {
  const current = useBreakpoint()
  const currentWidth = breakpoints[current]
  const targetWidth = breakpoints[breakpoint]
  return currentWidth >= targetWidth
}

export function useIsBelowBreakpoint(breakpoint: Breakpoint): boolean {
  const current = useBreakpoint()
  const currentWidth = breakpoints[current]
  const targetWidth = breakpoints[breakpoint]
  return currentWidth < targetWidth
}
