'use client'

import { useEffect, useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import { useAppToast } from '@/app/lib/ui/toast'
import StaffAutoComplete from '../StaffAutoComplete'
import Textarea from '../ui/Textarea'
import { useCustomerAndProductLists } from '../hooks/useCustomerAndProductLists'
import { appointmentsApi } from '@/app/lib/api/appointments'
import { customerProductsApi } from '@/app/lib/api/customer-products'

type Draft = {
  date: string
  start: string
  end: string
  status: string
  notes: string
  customer_id?: string
  staff_id?: string
  service_id?: string
}

export default function ReservationCreateModal({ open, onClose, draft, onSaved }: { open: boolean; onClose: () => void; draft: Draft; onSaved: () => void }) {
  const [form, setForm] = useState<Draft>(draft)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()
  const { customers, products } = useCustomerAndProductLists(open)
  const [customerQuery, setCustomerQuery] = useState('')
  const [showSuggest, setShowSuggest] = useState(false)
  const [holdingsByProduct, setHoldingsByProduct] = useState<Record<string, number>>({})

  // Reset form to fresh draft on open
  useEffect(() => {
    if (open) {
      setForm(draft)
      setCustomerQuery('')
      setShowSuggest(false)
    }
  }, [open, draft])

  // 고객 선택 시 보유 상품 수량 로드
  useEffect(() => {
    const loadHoldings = async () => {
      try {
        if (!open || !form.customer_id) { setHoldingsByProduct({}); return }
        const list = await customerProductsApi.list(form.customer_id)
        const qtyMap: Record<string, number> = {}
        ;(Array.isArray(list) ? list : []).forEach((h) => {
          const pid = String(h.product_id)
          qtyMap[pid] = Number(h.quantity || 0)
        })
        setHoldingsByProduct(qtyMap)
      } catch {
        setHoldingsByProduct({})
      }
    }
    loadHoldings()
  }, [open, form.customer_id])

  const save = async () => {
    try {
      setLoading(true); setError('')
      if (!form.date || !form.start) { setError('날짜와 시작 시간은 필수입니다.'); setLoading(false); return }
      // 로컬 날짜/시간을 UTC ISO 문자열로 변환하여 TZ 오차 방지
      const [y, m, d] = form.date.split('-').map(Number)
      const [hh, mm] = form.start.split(':').map(Number)
      const startIso = new Date(y, (m || 1) - 1, d, hh, mm, 0).toISOString()
      const payload: any = {
        appointment_date: startIso,
        status: form.status,
        customer_id: form.customer_id || null,
        staff_id: form.staff_id || null,
        service_id: form.service_id || null,
      }
      // notes는 값이 있을 때만 포함
      if (form.notes && form.notes.trim() !== '') {
        payload.notes = form.notes.trim()
      }
      await appointmentsApi.create(payload)
      // persist memo for customer detail modal
      try { if (form.customer_id && (form.notes || '').trim()) localStorage.setItem(`memoDraft:${form.customer_id}`, form.notes || '') } catch {}
      onSaved(); onClose(); toast.success('예약이 저장되었습니다.')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
      toast.error('예약 저장 실패', errorMessage)
    } finally { setLoading(false) }
  }

  const filteredCustomers = (() => {
    const q = customerQuery.trim().toLowerCase()
    if (!q) return []
    return customers.filter((c: any) => {
      const name = (c.name || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const phone = (c.phone || '').toLowerCase()
      return name.includes(q) || email.includes(q) || phone.includes(q)
    }).slice(0, 8)
  })()

  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title="새 예약"
        description="날짜와 시간, 고객, 서비스를 선택해 새로운 예약을 등록합니다."
      />
      <ModalBody>
        <div className="grid gap-4 md:grid-cols-[280px,1fr]">
          <div className="space-y-3">
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
          <div className="space-y-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-neutral-700">
                    날짜 <span className="text-rose-600">*</span>
                  </label>
                  <input
                    className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-neutral-700">
                    시작 시간 <span className="text-rose-600">*</span>
                  </label>
                  <input
                    className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
                    type="time"
                    value={form.start}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm text-neutral-700">
                    고객
                  </label>
                  <div className="relative">
                    <input
                      className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 placeholder:text-neutral-400"
                      placeholder="이름/이메일/전화번호로 검색하여 선택"
                      value={customerQuery}
                      onChange={(e) => {
                        setCustomerQuery(e.target.value)
                        setShowSuggest(true)
                      }}
                      onFocus={() => setShowSuggest(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredCustomers.length > 0) {
                          const c = filteredCustomers[0]
                          setForm((f) => ({ ...f, customer_id: c.id }))
                          setCustomerQuery(c.name || '')
                          setShowSuggest(false)
                          e.preventDefault()
                        }
                        if (e.key === 'Escape') setShowSuggest(false)
                      }}
                    />
                    {showSuggest &&
                      customerQuery.trim() &&
                      filteredCustomers.length > 0 && (
                        <ul
                          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-none border-2 border-neutral-500 bg-white"
                          role="listbox"
                        >
                          {filteredCustomers.map((c: any) => (
                            <li
                              key={c.id}
                              role="option"
                              className="cursor-pointer px-3 py-2 text-sm hover:bg-neutral-50"
                              onMouseDown={() => {
                                setForm((f) => ({ ...f, customer_id: c.id }))
                                setCustomerQuery(c.name || '')
                                setShowSuggest(false)
                              }}
                            >
                              <div className="font-medium">{c.name}</div>
                              <div className="text-xs text-neutral-500">
                                {c.email || c.phone || '-'}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    상태
                  </label>
                  <select
                    className="h-10 w-full rounded-none border-2 border-neutral-500 bg-white px-3 text-sm text-neutral-900 outline-none hover:border-neutral-600 focus:border-[#1D4ED8] focus:ring-[4px] focus:ring-[#1D4ED8]/20"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    <option value="scheduled">예약확정</option>
                    <option value="pending">대기</option>
                    <option value="cancelled">취소</option>
                    <option value="complete">완료</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    담당 직원(선택)
                  </label>
                  <StaffAutoComplete
                    value={form.staff_id || ''}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, staff_id: v || undefined }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    서비스/상품
                  </label>
                  <select
                    className="h-10 w-full rounded-none border-2 border-neutral-500 bg-white px-3 text-sm text-neutral-900 outline-none hover:border-neutral-600 focus:border-[#1D4ED8] focus:ring-[4px] focus:ring-[#1D4ED8]/20"
                    value={form.service_id || ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        service_id: e.target.value || undefined,
                      }))
                    }
                  >
                    <option value="">선택 안 함</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {form.service_id && (
                    <div className="mt-1 text-xs text-neutral-500">
                      보유중:{' '}
                      {Number(
                        holdingsByProduct[String(form.service_id)] || 0,
                      )}
                      개
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <Textarea
                    label="메모(선택)"
                    placeholder="고객 요청사항, 준비물 등을 입력하세요"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full md:w-auto">취소</Button>
        <Button variant="primary" onClick={save} disabled={loading} className="w-full md:w-auto">저장</Button>
      </ModalFooter>
    </Modal>
  )
}


