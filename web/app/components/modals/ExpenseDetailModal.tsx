'use client'

import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import { expensesApi } from '@/app/lib/api/expenses'
import { settingsApi } from '@/app/lib/api/settings'
import { getExpenseCategories, suggestCategory } from '@/app/lib/utils/expenseCategories'
import { X } from 'lucide-react'
import type { Expense, ExpenseUpdateInput } from '@/types/entities'

type ExpenseForm = Omit<Expense, 'amount' | 'memo'> & { amount: number | string; memo?: string | null }

export default function ExpenseDetailModal({ open, onClose, item, onSaved, onDeleted }: { open: boolean; onClose: () => void; item: Expense | null; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState<ExpenseForm | null>(item ? { ...item, amount: item.amount } : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<string[]>(getExpenseCategories())
  
  // 설정에서 비용 항목 목록 가져오기
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const settings = await settingsApi.get()
        const expenseCategories = settings.financialSettings?.expenseCategories || []
        if (expenseCategories.length > 0) {
          setCategories(expenseCategories)
        }
      } catch (error) {
        console.error('설정 로드 실패:', error)
        // 설정 로드 실패 시 기본 카테고리 사용
        setCategories(getExpenseCategories())
      }
    }
    
    if (open) {
      loadCategories()
    }
  }, [open])

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

  // 금액 포맷팅 (콤마 추가)
  const formatAmount = (val: number | string): string => {
    if (val === '' || val === null || val === undefined) return ''
    const numValue = typeof val === 'string' ? Number(val.replace(/[^0-9]/g, '')) : val
    if (isNaN(numValue) || numValue === 0) return ''
    return numValue.toLocaleString('ko-KR')
  }

  const [amountDisplay, setAmountDisplay] = useState('')

  useEffect(() => {
    if (form?.amount !== undefined) {
      setAmountDisplay(formatAmount(form.amount))
    }
  }, [form?.amount])

  if (!open || !form) return null
  
  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-overlay-60 backdrop-blur-sm animate-overlay-in" 
        onClick={onClose}
        style={{ 
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      />
      <div className="relative w-full max-w-md bg-white rounded-xl border border-neutral-200 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">지출 수정</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-700 mb-1">일자 <span className="text-rose-600">*</span></label>
            <input 
              type="date" 
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 transition-all duration-300" 
              value={form.expense_date} 
              onChange={e => setForm(f => f && ({ ...f, expense_date: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-700 mb-1">금액 <span className="text-rose-600">*</span></label>
            <input 
              type="text" 
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 transition-all duration-300" 
              value={amountDisplay}
              onChange={e => {
                const numericValue = e.target.value.replace(/[^0-9]/g, '')
                if (numericValue === '') {
                  setAmountDisplay('')
                  setForm(f => f && ({ ...f, amount: '' }))
                } else {
                  const formatted = Number(numericValue).toLocaleString('ko-KR')
                  setAmountDisplay(formatted)
                  setForm(f => f && ({ ...f, amount: Number(numericValue) }))
                }
              }}
              placeholder="금액을 입력하세요 (원)"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-700 mb-1">카테고리(선택)</label>
            <select
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 transition-all duration-300"
              value={form.category || ''}
              onChange={e => setForm(f => f && ({ ...f, category: e.target.value }))}
              disabled={loading}
            >
              <option value="">선택하세요</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-700 mb-1">메모(선택)</label>
            <input 
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 placeholder:text-neutral-500 transition-all duration-300" 
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
              disabled={loading}
            />
            {form.memo && !form.category && suggestCategory(form.memo) && (
              <p className="mt-1 text-xs text-blue-600">
                추천 카테고리: {suggestCategory(form.memo)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={loading} 
            className="flex-1 sm:flex-none"
          >
            취소
          </Button>
          <Button 
            variant="danger" 
            onClick={removeItem} 
            disabled={loading} 
            className="flex-1 sm:flex-none"
          >
            삭제
          </Button>
          <Button 
            variant="primary" 
            onClick={save} 
            disabled={loading || !form.expense_date || !form.amount || form.amount === ''} 
            className="flex-1 sm:flex-none"
          >
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}


