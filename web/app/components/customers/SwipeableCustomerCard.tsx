'use client'

import { useState, useRef } from 'react'
import { Pencil, Trash2, Phone, Mail } from 'lucide-react'
import { hapticFeedback } from '@/app/lib/utils/haptic'
import type { Customer } from '@/types/entities'
import CustomerHoldingsBadge from '../CustomerHoldingsBadge'

interface SwipeableCustomerCardProps {
  customer: Customer
  points: number
  onEdit: (customer: Customer) => void
  onDelete?: (customer: Customer) => void
  onCall?: (phone: string) => void
  onEmail?: (email: string) => void
}

export default function SwipeableCustomerCard({
  customer,
  points,
  onEdit,
  onDelete,
  onCall,
  onEmail,
}: SwipeableCustomerCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number>(0)
  const startOffsetRef = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    startXRef.current = touch.clientX
    startOffsetRef.current = swipeOffset
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    const currentX = touch.clientX
    const deltaX = currentX - startXRef.current
    const newOffset = Math.max(-200, Math.min(0, startOffsetRef.current + deltaX))
    setSwipeOffset(newOffset)
  }

  const handleTouchEnd = () => {
    if (swipeOffset < -60) {
      setSwipeOffset(-120)
    } else {
      setSwipeOffset(0)
    }
  }

  const handleAction = (action: () => void) => {
    hapticFeedback('light')
    action()
    setSwipeOffset(0)
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {/* 액션 버튼 (스와이프 시 표시) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center bg-neutral-100">
        <div className="flex items-center h-full">
          {customer.phone && (
            <button
              onClick={() => handleAction(() => onCall?.(customer.phone!))}
              className="h-full px-4 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              aria-label="전화하기"
            >
              <Phone className="h-5 w-5" />
            </button>
          )}
          {customer.email && (
            <button
              onClick={() => handleAction(() => onEmail?.(customer.email!))}
              className="h-full px-4 bg-green-500 text-white hover:bg-green-600 transition-colors"
              aria-label="이메일 보내기"
            >
              <Mail className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => handleAction(() => onEdit(customer))}
            className="h-full px-4 bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            aria-label="수정"
          >
            <Pencil className="h-5 w-5" />
          </button>
          {onDelete && (
            <button
              onClick={() => handleAction(() => onDelete(customer))}
              className="h-full px-4 bg-red-500 text-white hover:bg-red-600 transition-colors"
              aria-label="삭제"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* 카드 컨텐츠 */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (swipeOffset < 0) {
            setSwipeOffset(0)
          } else {
            onEdit(customer)
          }
        }}
        className="relative bg-white p-4 transition-transform duration-200 touch-manipulation"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 truncate">{customer.name}</h3>
            {customer.phone && (
              <div className="text-sm text-neutral-600 mt-1">{customer.phone}</div>
            )}
            {customer.email && (
              <div className="text-sm text-neutral-500 truncate">{customer.email}</div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            {points > 0 && (
              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium">
                {points.toLocaleString()}P
              </span>
            )}
          </div>
        </div>

        <div className="mt-2">
          <CustomerHoldingsBadge customerId={customer.id} />
        </div>

        {customer.last_visit_date && (
          <div className="mt-2 text-xs text-neutral-500">
            최근 방문: {new Date(customer.last_visit_date).toLocaleDateString('ko-KR')}
          </div>
        )}
      </div>
    </div>
  )
}

