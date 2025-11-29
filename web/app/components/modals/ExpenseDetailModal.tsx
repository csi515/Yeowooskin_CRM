'use client'

import { useEffect, useState } from 'react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import { expensesApi } from '@/app/lib/api/expenses'
import { getExpenseCategories, suggestCategory } from '@/app/lib/utils/expenseCategories'
import type { Expense, ExpenseUpdateInput } from '@/types/entities'

type ExpenseForm = Omit<Expense, 'amount' | 'memo'> & { amount: number | string; memo?: string | null }

export default function ExpenseDetailModal({ open, onClose, item, onSaved, onDeleted }: { open: boolean; onClose: () => void; item: Expense | null; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState<ExpenseForm | null>(item ? { ...item, amount: item.amount } : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories] = useState<string[]>(getExpenseCategories())

  useEffect(() => {
    setForm(item ? { ...item, amount: item.amount } : null)
  }, [item])

  // 메모 입력 시 자동 카테고리 추천 (별도 effect로 분리)
  useEffect(() => {
    if (!item && form?.memo && !form.category) {
      const suggested = suggestCategory(form.memo)
      if (suggested) {
        setForm(f => f ? { ...f, category: suggested } : null)
      }
    }
  }, [form?.memo, form?.category, item])

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
      const body: ExpenseUpdateInput = {
        expense_date: form.expense_date,
        amount: amountValue,
        category: form.category || '',
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
        <div className="grid gap-3 md:grid-cols-[200px,1fr]">
          <div className="space-y-2">
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </div>
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-neutral-700 mb-0.5">지출 일자 <span className="text-rose-600">*</span></label>
                  <input className="h-9 w-full min-w-0 rounded-lg border border-neutral-300 px-1.5 sm:px-2.5 text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300" type="date" value={form.expense_date} onChange={e => setForm(f => f && ({ ...f, expense_date: e.target.value }))} />
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
                  <label className="block text-xs font-medium text-neutral-700 mb-0.5">카테고리(선택)</label>
                  <div className="flex gap-2">
                    <select
                      className="h-9 flex-1 rounded-lg border border-neutral-300 px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 bg-white"
                      value={form.category || ''}
                      onChange={e => setForm(f => f && ({ ...f, category: e.target.value }))}
                    >
                      <option value="">선택하세요</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input
                      className="h-9 flex-1 rounded-lg border border-neutral-300 px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
                      placeholder="직접 입력"
                      value={form.category || ''}
                      onChange={e => setForm(f => f && ({ ...f, category: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-0.5">메모(선택)</label>
                  <input
                    className="h-9 w-full rounded-lg border border-neutral-300 px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
                    placeholder="추가 설명을 입력하세요 (자동 분류 지원)"
                    value={form.memo || ''}
                    onChange={e => {
                      const memoValue = e.target.value
                      setForm(f => {
                        if (!f) return null
                        const updated = { ...f, memo: memoValue }
                        // 메모 입력 시 자동 카테고리 추천
                        if (memoValue && !f.category) {
                          const suggested = suggestCategory(memoValue)
                          if (suggested) {
                            updated.category = suggested
                          }
                        }
                        return updated
                      })
                    }}
                  />
                  {form.memo && !form.category && suggestCategory(form.memo) && (
                    <p className="mt-1 text-xs text-blue-600">
                      추천 카테고리: {suggestCategory(form.memo)}
                    </p>
                  )}
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


