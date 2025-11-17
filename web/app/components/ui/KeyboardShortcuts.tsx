'use client'

import { useEffect } from 'react'

type Shortcut = {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description?: string
}

type Props = {
  shortcuts: Shortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(({ key, ctrl, shift, alt, handler }) => {
        if (
          e.key === key &&
          (ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey) &&
          (shift ? e.shiftKey : !e.shiftKey) &&
          (alt ? e.altKey : !e.altKey)
        ) {
          e.preventDefault()
          handler()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

export default function KeyboardShortcuts({ shortcuts, enabled = true }: Props) {
  useKeyboardShortcuts(shortcuts, enabled)
  return null
}
