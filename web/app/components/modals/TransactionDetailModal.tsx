'use client'

import { useEffect, useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import { useAppToast } from '@/app/lib/ui/toast'
import { customersApi } from '@/app/lib/api/customers'
import { transactionsApi } from '@/app/lib/api/transactions'
import type { Transaction, TransactionUpdateInput, Customer } from '@/types/entities'

type Tx = Omit<Transaction, 'amount' | 'notes'> & { amount: number | string; notes?: string | null }

export default function TransactionDetailModal({ open, onClose, item, onSaved, onDeleted }: { open: boolean; onClose: () => void; item: Transaction | null; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState<Tx | null>(item ? { ...item, amount: item.amount } : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    setForm(item ? { ...item, amount: item.amount } : null)
  }, [item])
  useEffect(() => {
    if (!open) return
    const load = async () => {
      try {
        const data = await customersApi.list({ limit: 1000 })
        setCustomers(Array.isArray(data) ? data : [])
      } catch {
        setCustomers([])
      }
    }
    load()
  }, [open])

  const save = async () => {
    if (!form?.id) return
    try {
      setLoading(true); setError('')
      const amountValue = form.amount === '' || form.amount === null || form.amount === undefined ? null : Number(form.amount)
      if (amountValue === null) {
        setError('금액은 필수입니다.')
        setLoading(false)
        return
      }
      const payload: TransactionUpdateInput = {
        amount: amountValue,
        transaction_date: form.transaction_date || '',
        customer_id: form.customer_id || null,
      }
      // notes는 값이 있을 때만 포함
      if (form.notes && form.notes.trim() !== '') {
        payload.notes = form.notes.trim()
      }
      await transactionsApi.update(form.id, payload)
      onSaved(); onClose(); toast.success('거래가 저장되었습니다.')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
      toast.error('저장 실패', errorMessage)
    } finally { setLoading(false) }
  }
  const removeItem = async () => {
    if (!form?.id) return
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await transactionsApi.delete(form.id)
      onDeleted(); onClose(); toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제 실패')
    }
  }

  if (!open || !form) return null
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="거래 상세" description="거래 일자와 금액을 확인·수정합니다. 일자와 금액을 정확히 입력해주세요." />
      <ModalBody>
        <div className="grid gap-3 md:grid-cols-[200px,1fr]">
          <div className="space-y-2">
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </div>
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-neutral-700 mb-0.5">거래 일자 <span className="text-rose-600">*</span></label>
                  <input className="h-9 w-full min-w-0 rounded-lg border border-neutral-300 px-1.5 sm:px-2.5 text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300" type="date" value={(form.transaction_date || '').slice(0, 10)} onChange={e => setForm(f => f && ({ ...f, transaction_date: e.target.value }))} />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-neutral-700 mb-0.5">금액 <span className="text-rose-600">*</span></label>
                  <input
                    className="h-9 w-full min-w-0 rounded-lg border border-neutral-300 px-1.5 sm:px-2.5 text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 text-right placeholder:text-neutral-400"
                    type="number"
                    placeholder="예: 12,000"
                    autoComplete="off"
                    value={form.amount === null || form.amount === undefined || form.amount === '' ? '' : form.amount}
                    onChange={e => {
                      const val = e.target.value
                      setForm(f => f && ({ ...f, amount: val === '' ? '' : (isNaN(Number(val)) ? '' : Number(val)) }))
                    }}
                    onFocus={e => e.target.select()}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-0.5">고객(선택)</label>
                  <select className="h-9 w-full rounded-lg border border-neutral-300 px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300" value={form.customer_id || ''} onChange={e => setForm(f => f && ({ ...f, customer_id: e.target.value || null }))}>
                    <option value="">선택 안 함</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-0.5">메모(선택)</label>
                  <input className="h-9 w-full rounded-lg border border-neutral-300 px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 placeholder:text-neutral-400" placeholder="추가 설명을 입력하세요" value={form.notes || ''} onChange={e => setForm(f => f && ({ ...f, notes: e.target.value }))} />
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


