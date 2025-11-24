'use client'

import { useState, useEffect } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'
import { useAppToast } from '@/app/lib/ui/toast'
import StaffAutoComplete from '../StaffAutoComplete'
import { useCustomerAndProductLists } from '../hooks/useCustomerAndProductLists'
import { appointmentsApi } from '@/app/lib/api/appointments'
import { hapticFeedback } from '@/app/lib/utils/haptic'
import type { AppointmentUpdateInput } from '@/types/entities'

type Item = { id: string; date: string; start: string; end?: string; status: string; notes?: string; customer_id?: string; staff_id?: string; service_id?: string }

export default function ReservationDetailModal({ open, onClose, item, onSaved, onDeleted }: { open: boolean; onClose: () => void; item: Item | null; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState<Item | null>(item)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()
  const { customers, products } = useCustomerAndProductLists(open)

  useEffect(() => { setForm(item || null) }, [item])
  const save = async () => {
    if (!form?.id) return
    try {
      setLoading(true); setError('')
      if (!form.date || !form.start) { setError('날짜와 시작 시간은 필수입니다.'); setLoading(false); return }
      const payload: AppointmentUpdateInput = { status: form.status }
      // notes는 값이 있을 때만 포함
      if (form.notes && form.notes.trim() !== '') {
        payload.notes = form.notes.trim()
      }
      // 날짜/시간을 수정한 경우에만 appointment_date를 보냄 (불필요한 날짜 변경 방지)
      const originalDate = item?.date
      const originalStart = item?.start
      if (form.date !== originalDate || form.start !== originalStart) {
        // 로컬 날짜/시간을 UTC ISO 문자열로 변환하여 TZ 오차 방지
        const [y, m, d] = (form.date || '').split('-').map(Number)
        const [hh, mm] = (form.start || '').split(':').map(Number)
        payload.appointment_date = new Date(y || 2024, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0).toISOString()
      }
      await appointmentsApi.update(form.id, payload)
      hapticFeedback('success')
      onSaved(); onClose(); toast.success('예약이 저장되었습니다.')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
      hapticFeedback('error')
      toast.error('예약 저장 실패', errorMessage)
    } finally { setLoading(false) }
  }

  const removeItem = async () => {
    if (!form?.id) return
    if (!confirm('정말 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.')) return
    hapticFeedback('warning')
    try {
      await appointmentsApi.delete(form.id)
      hapticFeedback('success')
      onDeleted(); onClose(); toast.success('삭제되었습니다.')
    } catch {
      hapticFeedback('error')
      toast.error('삭제 실패')
    }
  }


  if (!open || !form) return null
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="예약 상세" description="예약 정보를 확인하고 수정합니다. 날짜와 시작 시간, 상태를 변경할 수 있습니다." />
      <ModalBody>
        <div className="grid gap-4 md:grid-cols-[280px,1fr]">
          <div className="space-y-3">
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
          <div className="space-y-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="min-w-0">
                  <Input label="날짜" type="date" value={form.date} onChange={e => setForm(f => f && ({ ...f, date: e.target.value }))} className="text-xs sm:text-sm" />
                </div>
                <div className="min-w-0">
                  <Input label="시작" type="time" value={form.start} onChange={e => setForm(f => f && ({ ...f, start: e.target.value }))} className="text-xs sm:text-sm" />
                </div>
                <Select label="상태" value={form.status} onChange={e => setForm(f => f && ({ ...f, status: e.target.value }))}>
                  <option value="scheduled">예약확정</option>
                  <option value="pending">대기</option>
                  <option value="cancelled">취소</option>
                  <option value="complete">완료</option>
                </Select>
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-neutral-700">고객(선택)</div>
                  <select className="w-full h-10 rounded-lg border border-neutral-300 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-300" value={form.customer_id || ''} onChange={e => setForm(f => {
                    if (!f) return f
                    const value = e.target.value
                    if (value) {
                      return { ...f, customer_id: value }
                    }
                    const next = { ...f }
                    delete next.customer_id
                    return next
                  })}>
                    <option value="">선택 안 함</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="col-span-2 block">
                  <div className="mb-1 text-sm font-medium text-neutral-700">담당 직원(선택)</div>
                  <StaffAutoComplete value={form.staff_id || ''} onChange={(v) => setForm(f => {
                    if (!f) return f
                    if (v) {
                      return { ...f, staff_id: v }
                    }
                    const next = { ...f }
                    delete next.staff_id
                    return next
                  })} />
                </label>
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-neutral-700">
                    서비스/상품(선택)
                  </div>
                  <select
                    className="h-10 w-full rounded-none border-2 border-neutral-500 bg-white px-3 text-sm text-neutral-900 outline-none hover:border-neutral-600 focus:border-[#1D4ED8] focus:ring-[4px] focus:ring-[#1D4ED8]/20"
                    value={form.service_id || ''}
                    onChange={(e) =>
                      setForm((f) => {
                        if (!f) return f
                        const value = e.target.value
                        if (value) {
                          return { ...f, service_id: value }
                        }
                        const next = { ...f }
                        delete next.service_id
                        return next
                      })
                    }
                  >
                    <option value="">선택 안 함</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="col-span-2">
                  <Textarea
                    label="메모(선택)"
                    placeholder="메모를 입력하세요(선택)"
                    value={form.notes || ''}
                    onChange={(e) =>
                      setForm((f) => f && ({ ...f, notes: e.target.value }))
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
        <Button variant="danger" onClick={removeItem} disabled={loading} className="w-full md:w-auto">삭제</Button>
        <Button variant="primary" onClick={save} disabled={loading} className="w-full md:w-auto">저장</Button>
      </ModalFooter>
    </Modal>
  )
}

