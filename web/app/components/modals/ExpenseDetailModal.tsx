'use client'

import { useEffect, useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import { expensesApi } from '@/app/lib/api/expenses'
import type { Expense } from '@/types/entities'

type ExpenseForm = Omit<Expense, 'amount' | 'memo'> & { amount: number | string; memo?: string | null }

export default function ExpenseDetailModal({ open, onClose, item, onSaved, onDeleted }: { open: boolean; onClose: () => void; item: Expense | null; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState<ExpenseForm | null>(item ? { ...item, amount: item.amount } : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setForm(item) }, [item])

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
      const body: any = { 
        expense_date: form.expense_date, 
        amount: amountValue, 
        category: form.category || ''
      }
      // memo는 값이 있을 때만 포함
      if (form.memo && form.memo.trim() !== '') {
        body.memo = form.memo.trim()
      }
      await expensesApi.update(form.id, body)
      onSaved(); onClose()
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally { setLoading(false) }
  }
  const removeItem = async () => {
    if (!form?.id) return
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await expensesApi.delete(form.id)
      onDeleted(); onClose()
    } catch {
      alert('삭제 실패')
    }
  }

  if (!open || !form) return null
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="지출 상세" description="지출 일자와 금액을 확인·수정합니다. 일자와 금액은 필수입니다." />
      <ModalBody>
        <div className="grid gap-4 md:grid-cols-[280px,1fr]">
          <div className="space-y-3">
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
          <div className="space-y-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-700 mb-1">지출 일자 <span className="text-rose-600">*</span></label>
                  <input className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300" type="date" value={form.expense_date} onChange={e => setForm(f => f && ({ ...f, expense_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-neutral-700 mb-1">금액 <span className="text-rose-600">*</span></label>
                  <input 
                    className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 text-right placeholder:text-neutral-400" 
                    type="number" 
                    placeholder="예: 12,000" 
                    value={form.amount === null || form.amount === undefined || form.amount === '' ? '' : form.amount} 
                    onChange={e => {
                      const val = e.target.value
                      setForm(f => f && ({ ...f, amount: val === '' ? '' : (isNaN(Number(val)) ? '' : Number(val)) }))
                    }} 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-700 mb-1">카테고리(선택)</label>
                  <input className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300" placeholder="예) 소모품, 임대료 등" value={form.category || ''} onChange={e => setForm(f => f && ({ ...f, category: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-700 mb-1">메모(선택)</label>
                  <input className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300" placeholder="추가 설명을 입력하세요" value={form.memo || ''} onChange={e => setForm(f => f && ({ ...f, memo: e.target.value }))} />
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


