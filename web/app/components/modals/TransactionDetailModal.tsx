'use client'

import { useEffect, useState, useCallback } from 'react'
import Button from '../ui/Button'
import { useAppToast } from '@/app/lib/ui/toast'
import { customersApi } from '@/app/lib/api/customers'
import { transactionsApi } from '@/app/lib/api/transactions'
import { settingsApi } from '@/app/lib/api/settings'
import { getExpenseCategories } from '@/app/lib/utils/expenseCategories'
import { X } from 'lucide-react'
import type { Transaction, TransactionUpdateInput, Customer } from '@/types/entities'

type Tx = Omit<Transaction, 'amount' | 'notes'> & { amount: number | string; notes?: string | null; category?: string }

export default function TransactionDetailModal({ open, onClose, item, onSaved, onDeleted }: { open: boolean; onClose: () => void; item: Transaction | null; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState<Tx | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useAppToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [categories, setCategories] = useState<string[]>(getExpenseCategories())
  
  // notes에서 카테고리 추출 (형식: "카테고리: 메모" 또는 "카테고리")
  const parseNotes = useCallback((notes: string | null | undefined): { category: string; memo: string } => {
    if (!notes) return { category: '', memo: '' }
    const match = notes.match(/^(.+?):\s*(.+)$/)
    if (match) {
      return { category: match[1] || '', memo: match[2] || '' }
    }
    // 카테고리 목록에 있는지 확인
    const categoryMatch = categories.find(cat => notes.trim() === cat)
    return categoryMatch ? { category: categoryMatch, memo: '' } : { category: '', memo: notes }
  }, [categories])
  
  // 카테고리와 메모를 notes로 결합
  const combineNotes = useCallback((category: string, memo: string): string | null => {
    if (category && memo) return `${category}: ${memo}`
    if (category) return category
    if (memo) return memo
    return null
  }, [])
  
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
        setCategories(getExpenseCategories())
      }
    }
    
    if (open) {
      loadCategories()
    }
  }, [open])

  useEffect(() => { 
    if (item) {
      const parsed = parseNotes(item.notes)
      setForm({ 
        ...item, 
        amount: item.amount,
        category: parsed.category,
        notes: parsed.memo
      })
    } else {
      setForm(null)
    }
  }, [item, parseNotes])
  
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
        customer_id: form.customer_id || null,
      }

      // transaction_date가 유효한 경우에만 포함
      if (form.transaction_date) {
        payload.transaction_date = form.transaction_date
      }
      // 카테고리와 메모를 결합하여 notes에 저장
      const combinedNotes = combineNotes(form.category || '', form.notes || '')
      if (combinedNotes) {
        payload.notes = combinedNotes
      } else {
        payload.notes = null
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
          <h2 className="text-lg font-medium">수입 수정</h2>
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
              value={(form.transaction_date || '').slice(0,10)} 
              onChange={e => setForm(f => f && ({ ...f, transaction_date: e.target.value }))}
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
            <label className="block text-sm font-medium text-neutral-700 mb-0.5">고객(선택)</label>
            <select 
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 transition-all duration-300" 
              value={form.customer_id || ''} 
              onChange={e => setForm(f => f && ({ ...f, customer_id: e.target.value || null }))}
              disabled={loading}
            >
              <option value="">선택 안 함</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-700 mb-1">메모(선택)</label>
            <input 
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 placeholder:text-neutral-500 transition-all duration-300" 
              placeholder="추가 설명을 입력하세요" 
              value={form.notes || ''} 
              onChange={e => setForm(f => f && ({ ...f, notes: e.target.value }))}
              disabled={loading}
            />
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
            disabled={loading || !form.transaction_date || !form.amount || form.amount === ''} 
            className="flex-1 sm:flex-none"
          >
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}


