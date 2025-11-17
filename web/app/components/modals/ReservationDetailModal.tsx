'use client'

import { useState, useEffect } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useAppToast } from '@/app/lib/ui/toast'
import StaffAutoComplete from '../StaffAutoComplete'
import { useCustomerAndProductLists } from '../hooks/useCustomerAndProductLists'
import { appointmentsApi } from '@/app/lib/api/appointments'

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
      const payload: any = { status: form.status }
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
        payload.appointment_date = new Date(y, (m || 1) - 1, d, hh, mm, 0).toISOString()
      }
      await appointmentsApi.update(form.id, payload)
      onSaved(); onClose(); toast.success('예약이 저장되었습니다.')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
      toast.error('예약 저장 실패', errorMessage)
    } finally { setLoading(false) }
  }

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const removeItem = async () => {
    if (!form?.id) return
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!form?.id) return
    try {
      await appointmentsApi.delete(form.id)
      onDeleted(); onClose(); toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제 실패')
    } finally {
      setDeleteConfirmOpen(false)
    }
  }


  if (!open || !form) return null
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="예약 상세" description="예약 정보를 확인하고 수정합니다. 날짜와 시작 시간, 상태를 변경할 수 있습니다." />
      <ModalBody>
        <div className="space-y-5">
          {error && <p className="text-sm text-error-600">{error}</p>}
          <div className="grid grid-cols-2 gap-5">
                <Input label="날짜" type="date" value={form.date} onChange={e => setForm(f => f && ({ ...f, date: e.target.value }))} />
                <Input label="시작" type="time" value={form.start} onChange={e => setForm(f => f && ({ ...f, start: e.target.value }))} />
                <Select label="상태" value={form.status} onChange={e => setForm(f => f && ({ ...f, status: e.target.value }))}>
                  <option value="scheduled">예약확정</option>
                  <option value="pending">대기</option>
                  <option value="cancelled">취소</option>
                  <option value="complete">완료</option>
                </Select>
                <div className="col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-neutral-700">
                    고객(선택)
                  </label>
                  <Select
                    value={form.customer_id || ''}
                    onChange={(e) => setForm((f) => f && ({ ...f, customer_id: e.target.value || undefined }))}
                  >
                    <option value="">선택 안 함</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-neutral-700">
                    담당 직원(선택)
                  </label>
                  <StaffAutoComplete
                    value={form.staff_id || ''}
                    onChange={(v) => setForm((f) => f && ({ ...f, staff_id: v || undefined }))}
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    label="서비스/상품(선택)"
                    value={form.service_id || ''}
                    onChange={(e) =>
                      setForm(
                        (f) => f && ({ ...f, service_id: e.target.value || undefined }),
                      )
                    }
                  >
                    <option value="">선택 안 함</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
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
        <Button variant="primary" onClick={save} disabled={loading} loading={loading} className="w-full md:w-auto">저장</Button>
      </ModalFooter>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="예약 삭제"
        message="정말 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
    </Modal>
  )
}

