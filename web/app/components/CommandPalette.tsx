'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Calendar, FileText, X } from 'lucide-react'
import Modal, { ModalBody } from './ui/Modal'
import { customersApi } from '@/app/lib/api/customers'
import { useDebounce } from '@/app/lib/hooks/useDebounce'
import { hapticFeedback } from '@/app/lib/utils/haptic'
import type { Customer } from '@/types/entities'

interface CommandItem {
  id: string
  type: 'customer' | 'action'
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Ctrl+K로 열기
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true)
      setQuery('')
      setSelectedIndex(0)
    }
    window.addEventListener('open-command-palette', handleOpen)
    return () => window.removeEventListener('open-command-palette', handleOpen)
  }, [])

  // 고객 검색
  useEffect(() => {
    if (!open || debouncedQuery.length < 2) {
      setCustomers([])
      return
    }

    const searchCustomers = async () => {
      try {
        setLoading(true)
        const data = await customersApi.list({ search: debouncedQuery, limit: 10 })
        setCustomers(data)
      } catch (err) {
        console.error('고객 검색 실패:', err)
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }

    searchCustomers()
  }, [open, debouncedQuery])

  // 명령어 목록 생성
  const commands: CommandItem[] = [
    {
      id: 'new-customer',
      type: 'action',
      title: '새 고객 추가',
      subtitle: '고객 정보를 등록합니다',
      icon: <User className="h-4 w-4" />,
      action: () => {
        router.push('/customers')
        setOpen(false)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-new-customer-modal'))
        }, 100)
      },
    },
    {
      id: 'new-appointment',
      type: 'action',
      title: '새 예약 추가',
      subtitle: '예약을 생성합니다',
      icon: <Calendar className="h-4 w-4" />,
      action: () => {
        router.push('/appointments')
        setOpen(false)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-new-appointment-modal'))
        }, 100)
      },
    },
    {
      id: 'quick-treatment',
      type: 'action',
      title: '빠른 시술 기록',
      subtitle: '시술 기록을 빠르게 입력합니다',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        window.dispatchEvent(new CustomEvent('open-quick-treatment-modal'))
      },
    },
    ...customers.map((customer) => ({
      id: `customer-${customer.id}`,
      type: 'customer' as const,
      title: customer.name || '이름 없음',
      subtitle: customer.phone || customer.email || '',
      icon: <User className="h-4 w-4" />,
      action: () => {
        router.push('/customers')
        setOpen(false)
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('open-customer-detail', { detail: { customerId: customer.id } })
          )
        }, 100)
      },
    })),
  ]

  // 필터링된 명령어
  const filteredCommands = commands.filter((cmd) => {
    if (!query) return cmd.type === 'action'
    const searchLower = query.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.subtitle?.toLowerCase().includes(searchLower)
    )
  })

  // 키보드 네비게이션
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          hapticFeedback('light')
          filteredCommands[selectedIndex].action()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredCommands, selectedIndex])

  // 모달 열릴 때 입력 필드 포커스
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // 선택 인덱스 리셋
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="lg" closeOnOutsideClick>
      <ModalBody className="p-0">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-neutral-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="고객 검색 또는 명령어 입력... (Ctrl+K)"
              className="flex-1 outline-none text-sm"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-neutral-100"
              aria-label="닫기"
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-neutral-500">검색 중...</div>
          ) : filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              {query ? '결과가 없습니다' : '검색어를 입력하세요'}
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors ${
                    index === selectedIndex ? 'bg-neutral-50' : ''
                  }`}
                >
                  <div className="text-neutral-400">{cmd.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900">{cmd.title}</div>
                    {cmd.subtitle && (
                      <div className="text-xs text-neutral-500 truncate">{cmd.subtitle}</div>
                    )}
                  </div>
                  {cmd.type === 'customer' && (
                    <div className="text-xs text-neutral-400">고객</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
          <div className="flex items-center justify-between">
            <span>↑↓ 선택, Enter 실행, Esc 닫기</span>
            <span>Ctrl+K로 열기</span>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}

