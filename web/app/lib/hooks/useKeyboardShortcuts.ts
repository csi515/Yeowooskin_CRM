'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description?: string
}

/**
 * 전역 키보드 단축키 관리 훅
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 단축키 무시 (Ctrl+K 제외)
      const target = e.target as HTMLElement
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
        const metaMatch = shortcut.meta ? e.metaKey : true
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.alt ? e.altKey : !e.altKey

        // Ctrl+K는 항상 작동
        const isCommandPalette = shortcut.key === 'k' && (e.ctrlKey || e.metaKey)

        if (
          keyMatch &&
          ctrlMatch &&
          metaMatch &&
          shiftMatch &&
          altMatch &&
          (isCommandPalette || !isInputFocused)
        ) {
          e.preventDefault()
          shortcut.handler()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

/**
 * 기본 키보드 단축키 훅
 */
export function useDefaultKeyboardShortcuts() {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        // Command Palette는 별도 컴포넌트에서 처리
        const event = new CustomEvent('open-command-palette')
        window.dispatchEvent(event)
      },
      description: '빠른 검색',
    },
    {
      key: 'n',
      ctrl: true,
      handler: () => {
        router.push('/customers')
        setTimeout(() => {
          const event = new CustomEvent('open-new-customer-modal')
          window.dispatchEvent(event)
        }, 100)
      },
      description: '새 고객 추가',
    },
    {
      key: 'r',
      ctrl: true,
      handler: () => {
        router.push('/appointments')
        setTimeout(() => {
          const event = new CustomEvent('open-new-appointment-modal')
          window.dispatchEvent(event)
        }, 100)
      },
      description: '새 예약 추가',
    },
    {
      key: 't',
      ctrl: true,
      handler: () => {
        const event = new CustomEvent('open-quick-treatment-modal')
        window.dispatchEvent(event)
      },
      description: '빠른 시술 기록',
    },
  ]

  useKeyboardShortcuts(shortcuts)
}

