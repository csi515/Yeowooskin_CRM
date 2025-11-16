'use client'

import { useEffect, useState } from 'react'
import { customerProductsApi } from '@/app/lib/api/customer-products'
import type { CustomerProduct } from '@/types/entities'

interface CustomerProductWithProduct extends CustomerProduct {
  products?: { name: string } | null
}

interface HoldingsUpdatedEvent extends CustomEvent {
  detail: { customerId: string }
}

export default function CustomerHoldingsBadge({ customerId }: { customerId: string }) {
  const [label, setLabel] = useState<string>('보유 없음')

  const reload = async () => {
    try {
      const arr = await customerProductsApi.list(customerId)
      const items = Array.isArray(arr)
        ? (arr as CustomerProductWithProduct[])
            .map((h) => ({
              name: (h?.products?.name || '(삭제됨)') as string,
              qty: Number(h?.quantity || 0),
            }))
            .filter(x => x.qty > 0)
        : []
      if (!items.length) { setLabel('보유 없음'); return }
      // 동일 상품명이 여러 레코드로 존재할 수 있어 합산
      const byName: Record<string, number> = {}
      items.forEach(i => { byName[i.name] = (byName[i.name] || 0) + i.qty })
      const merged = Object.entries(byName).map(([name, qty]) => ({ name, qty }))
      // 표시: 상위 2개 + 외 N종
      merged.sort((a,b) => b.qty - a.qty)
      const top = merged.slice(0, 2).map(i => `${i.name} x ${i.qty.toLocaleString()}`)
      const remain = merged.length - top.length
      const text = remain > 0 ? `${top.join(', ')} 외 ${remain}종` : top.join(', ')
      setLabel(text)
    } catch {
      setLabel('보유 없음')
    }
  }

  useEffect(() => { reload() }, [customerId])

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as HoldingsUpdatedEvent
      if (String(customEvent?.detail?.customerId || '') === String(customerId)) {
        reload()
      }
    }
    window.addEventListener('holdings-updated', handler)
    return () => window.removeEventListener('holdings-updated', handler)
  }, [customerId])

  return <span>{label}</span>
}


