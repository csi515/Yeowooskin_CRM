'use client'

import { useEffect, useMemo, useState } from 'react'
import ExpenseDetailModal from '../components/modals/ExpenseDetailModal'
import TransactionDetailModal from '../components/modals/TransactionDetailModal'
import { Pencil, Plus } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAppToast } from '../lib/ui/toast'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/filters/FilterBar'
import Button from '../components/ui/Button'
import { usePagination } from '../lib/hooks/usePagination'
import { useForm } from '../lib/hooks/useForm'
import type { Expense, Transaction } from '@/types/entities'

type ExpenseForm = {
  expense_date: string
  amount: number
  category: string
  memo: string
}

function isoMonthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return { from: start.toISOString().slice(0,10), to: end.toISOString().slice(0,10) }
}

type FinanceItem = Expense | Transaction

export default function FinancePage() {
  const [{ from, to }, setRange] = useState(() => isoMonthRange())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable')
  // combined는 특별한 형태이므로 useSort를 직접 사용하지 않고 상태만 관리
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: 0, // mergedItems.length로 업데이트됨
  })
  const { page, pageSize, setPage, setPageSize } = pagination
  const [includeIncome, setIncludeIncome] = useState(true)
  const [includeExpense, setIncludeExpense] = useState(true)

  const load = async () => {
    try {
      setLoading(true); setError('')
      const { expensesApi } = await import('@/app/lib/api/expenses')
      const { transactionsApi } = await import('@/app/lib/api/transactions')
      const [ex, tr] = await Promise.all([
        expensesApi.list({ from, to }),
        transactionsApi.list({ limit: 500 }),
      ])
      setExpenses(Array.isArray(ex) ? ex : [])
      setTransactions(Array.isArray(tr) ? tr : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [from, to])

  const sumIncome = useMemo(() => transactions
    .filter(t => {
      const d = (t.transaction_date || t.created_at || '').slice(0,10)
      return (!from || d >= from) && (!to || d < to)
    })
    .reduce((s, t) => s + Number(t.amount || 0), 0), [transactions, from, to])
  const sumExpense = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses])
  const profit = sumIncome - sumExpense

  const [newOpen, setNewOpen] = useState(false)
  const [newType, setNewType] = useState<'income' | 'expense'>('income')
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [newAmount, setNewAmount] = useState<string>('')
  const [newCategory, setNewCategory] = useState<string>('')
  const [newMemo, setNewMemo] = useState<string>('')
  const [expenseDetail, setExpenseDetail] = useState<Expense | null>(null)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [txDetail, setTxDetail] = useState<Transaction | null>(null)
  const [txOpen, setTxOpen] = useState(false)
  const toast = useAppToast()

  const expenseForm = useForm<ExpenseForm>({
    initialValues: {
      expense_date: new Date().toISOString().slice(0,10),
      amount: 0,
      category: '',
      memo: '',
    },
    validationRules: {
      expense_date: { required: true },
      amount: { required: true, min: 0 },
      category: { required: true, minLength: 1 },
    },
    onSubmit: async (values) => {
      try {
        const { expensesApi } = await import('@/app/lib/api/expenses')
        await expensesApi.create(values)
        expenseForm.reset()
        await load()
        toast.success('지출이 추가되었습니다.')
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : '지출 저장 실패'
        toast.error('지출 저장 실패', errorMessage)
      }
    },
  })

  const combined = useMemo(() => {
    const inRange = (iso: string) => {
      const d = (iso || '').slice(0,10)
      return (!from || d >= from) && (!to || d < to)
    }
    const incomeRows = includeIncome ? transactions
      .filter(t => inRange(t.transaction_date || t.created_at || ''))
      .map(t => ({
        id: t.id,
        type: 'income' as const,
        date: (t.transaction_date || t.created_at || '').slice(0,10),
        amount: Number(t.amount || 0),
        note: (t as any).notes || (t as any).memo || '',
        raw: t,
      })) : []
    const expenseRows = includeExpense ? expenses
      .filter(e => inRange(e.expense_date || ''))
      .map(e => ({
        id: e.id,
        type: 'expense' as const,
        date: (e.expense_date || '').slice(0,10),
        amount: Number(e.amount || 0),
        note: e.category || e.memo || '',
        raw: e,
      })) : []
    const rows = [...incomeRows, ...expenseRows]
    rows.sort((a, b) => {
      if (sortKey === 'date') {
        return sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
      }
      if (a.amount < b.amount) return sortDir === 'asc' ? -1 : 1
      if (a.amount > b.amount) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [transactions, expenses, includeIncome, includeExpense, from, to, sortKey, sortDir])

  const pagedCombined = useMemo(() => {
    const start = (page - 1) * pageSize
    return combined.slice(start, start + pageSize)
  }, [combined, page, pageSize])

  const TypeFilter = () => (
    <div className="px-3">
      <div className="text-[11px] font-medium text-neutral-600 mb-1">유형</div>
      <div className="inline-flex rounded-lg border border-neutral-300 bg-white p-1 whitespace-nowrap gap-1 shadow-sm">
        <button
          onClick={() => { setIncludeIncome(v => { const nv = !v; setPage(1); return nv }); }}
          className={`px-4 py-2 text-sm rounded-lg min-w-[100px] transition-all duration-300 ${
            includeIncome 
              ? 'bg-gradient-to-r from-[#F472B6] to-[#EC4899] text-white shadow-lg border-2 border-[#EC4899] font-semibold scale-[1.02]' 
              : 'bg-white text-neutral-500 hover:bg-[#FDF2F8] hover:text-[#F472B6] border-2 border-transparent font-medium'
          }`}
          aria-pressed={includeIncome}
        >
          수입
        </button>
        <button
          onClick={() => { setIncludeExpense(v => { const nv = !v; setPage(1); return nv }); }}
          className={`px-4 py-2 text-sm rounded-lg min-w-[100px] transition-all duration-300 ${
            includeExpense 
              ? 'bg-gradient-to-r from-[#F472B6] to-[#EC4899] text-white shadow-lg border-2 border-[#EC4899] font-semibold scale-[1.02]' 
              : 'bg-white text-neutral-500 hover:bg-[#FDF2F8] hover:text-[#F472B6] border-2 border-transparent font-medium'
          }`}
          aria-pressed={includeExpense}
        >
          지출
        </button>
      </div>
    </div>
  )

  const removeExpense = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      const { expensesApi } = await import('@/app/lib/api/expenses')
      await expensesApi.delete(id)
      await load()
      toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제 실패')
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader title="재무관리" />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="text-sm font-medium text-neutral-700 mb-2">월간 수입</div>
          <div className="text-3xl font-semibold text-emerald-600">₩{Number(sumIncome).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="text-sm font-medium text-neutral-700 mb-2">월간 지출</div>
          <div className="text-3xl font-semibold text-rose-600">₩{Number(sumExpense).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="text-sm font-medium text-neutral-700 mb-2">월간 순이익</div>
          <div className={`text-3xl font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₩{Number(profit).toLocaleString()}</div>
        </div>
      </section>

      <FilterBar>
        <div className="px-3 first:pl-0">
          <div className="text-[11px] font-medium text-neutral-600 mb-1">기간</div>
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} className="h-10 rounded-lg border border-neutral-300 px-3 focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 outline-none bg-white text-neutral-900 transition-all duration-300"/>
            <span className="text-neutral-600 font-medium">~</span>
            <input type="date" value={to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} className="h-10 rounded-lg border border-neutral-300 px-3 focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 outline-none bg-white text-neutral-900 transition-all duration-300"/>
          </div>
        </div>
        <TypeFilter />
        {/* 보기(컴팩트/넓게) 토글 제거 */}
        {/* 새로고침 버튼 제거 */}
      </FilterBar>

      {/* 가운데 영역: 수입/지출 통합 테이블 + 상세보기 버튼 */}
        <section className="bg-white rounded-xl border border-neutral-200 overflow-x-auto shadow-md">
        <div className="p-3 md:p-4 border-b border-neutral-200 text-sm font-medium text-neutral-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          <span>수입/지출 내역</span>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => { setNewType('income'); setNewDate(new Date().toISOString().slice(0,10)); setNewAmount(''); setNewCategory(''); setNewMemo(''); setNewOpen(true) }}
            className="w-full sm:w-auto"
          >
            새 수입/지출
          </Button>
        </div>
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200 sticky top-0 z-10">
              <tr>
                <th className={density==='compact' ? 'text-left p-3 font-medium text-neutral-900' : 'text-left p-4 font-medium text-neutral-900'}>
                  <button className="inline-flex items-center gap-1 hover:text-[#F472B6] transition-colors duration-300 font-medium" onClick={() => { setSortKey('date'); setSortDir(d => (sortKey==='date' && d==='asc') ? 'desc' : 'asc'); setPage(1) }}>
                    일자 {sortKey==='date' ? (sortDir==='asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
              <th className={density==='compact' ? 'text-left p-3 font-medium text-neutral-900' : 'text-left p-4 font-medium text-neutral-900'}>유형</th>
                <th className={density==='compact' ? 'text-right p-3 font-medium text-neutral-900' : 'text-right p-4 font-medium text-neutral-900'}>
                  <button className="inline-flex items-center gap-1 hover:text-[#F472B6] transition-colors duration-300 font-medium" onClick={() => { setSortKey('amount'); setSortDir(d => (sortKey==='amount' && d==='asc') ? 'desc' : 'asc'); setPage(1) }}>
                    금액 {sortKey==='amount' ? (sortDir==='asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
              <th className={density==='compact' ? 'text-left p-3 font-medium text-neutral-900' : 'text-left p-4 font-medium text-neutral-900'}>메모/카테고리</th>
                <th className={density==='compact' ? 'text-right p-3 font-medium text-neutral-900' : 'text-right p-4 font-medium text-neutral-900'}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={`ex-s-${i}`}>
                  <td className={density==='compact' ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-28" /></td>
                <td className={density==='compact' ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-16" /></td>
                  <td className={density==='compact' ? 'p-3 text-right' : 'p-4 text-right'}><Skeleton className="h-4 w-20 ml-auto" /></td>
                <td className={density==='compact' ? 'p-3' : 'p-4'}><Skeleton className="h-4 w-24" /></td>
                  <td className={density==='compact' ? 'p-3' : 'p-4'}><Skeleton className="h-8 w-24 ml-auto" /></td>
                </tr>
              ))}
            {!loading && pagedCombined.map(row => (
              <tr key={`${row.type}-${row.id}`} className="hover:bg-neutral-50 transition-colors duration-300 min-h-[48px] border-b border-neutral-200">
                <td className={density==='compact' ? 'p-3 text-neutral-900' : 'p-4 text-neutral-900'}>{row.date}</td>
                <td className={density==='compact' ? 'p-3' : 'p-4'}>
                  <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                    row.type === 'income' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {row.type === 'income' ? '수입' : '지출'}
                  </span>
                </td>
                <td className={`${density==='compact' ? 'p-3 text-right font-medium' : 'p-4 text-right font-medium'} ${
                  row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}>₩{Number(row.amount || 0).toLocaleString()}</td>
                <td className={density==='compact' ? 'p-3 text-neutral-600' : 'p-4 text-neutral-600'}>{row.note || '-'}</td>
                  <td className={density==='compact' ? 'p-3' : 'p-4'}>
                    <button
                    onClick={() => {
                      if (row.type === 'income') { setTxDetail(row.raw); setTxOpen(true) }
                      else { setExpenseDetail(row.raw); setExpenseOpen(true) }
                    }}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-neutral-300 hover:bg-[#F472B6] hover:text-white hover:border-[#F472B6] transition-all duration-300"
                      aria-label="상세보기"
                      title="상세보기"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && combined.length === 0 && (
              <tr><td colSpan={5}><EmptyState title="표시할 데이터가 없습니다." /></td></tr>
              )}
            </tbody>
          </table>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 md:p-4 border-t border-neutral-200 bg-neutral-50">
          <div className="text-xs sm:text-sm font-medium text-neutral-700">총 {combined.length}개 · {page}/{Math.max(1, Math.ceil(combined.length / pageSize))} 페이지</div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="h-10 w-full sm:w-auto rounded-lg border border-neutral-300 px-3 text-sm font-medium bg-white text-neutral-900 focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 outline-none transition-all duration-300">
                {[10,20,50].map(s => <option key={s} value={s}>{s}/페이지</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} className="h-10 flex-1 sm:flex-none px-4 rounded-lg border border-neutral-300 bg-white text-neutral-900 font-medium hover:bg-[#F472B6] hover:text-white hover:border-[#F472B6] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-neutral-900 transition-all duration-300" disabled={page===1}>이전</button>
                <button onClick={() => setPage(Math.min(Math.ceil(combined.length/pageSize)||1, page + 1))} className="h-10 flex-1 sm:flex-none px-4 rounded-lg border border-neutral-300 bg-white text-neutral-900 font-medium hover:bg-[#F472B6] hover:text-white hover:border-[#F472B6] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-neutral-900 transition-all duration-300" disabled={page>=Math.ceil(combined.length/pageSize)}>다음</button>
              </div>
            </div>
          </div>
        </section>

      {newOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-overlay-60 backdrop-blur-sm animate-overlay-in" 
            onClick={() => setNewOpen(false)}
            style={{ 
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)'
            }}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl border border-neutral-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">새 수입/지출</h2>
            </div>
            
            {/* 수입/지출 선택 구분 칸 */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3">
              <label className="block text-sm font-medium text-neutral-900 mb-2">유형</label>
              <div className="inline-flex rounded-lg border border-neutral-300 bg-white p-1 whitespace-nowrap gap-1 shadow-sm">
                <button 
                  onClick={() => setNewType('income')} 
                  className={`px-4 py-2 text-sm rounded-lg min-w-[100px] transition-all duration-300 ${
                    newType === 'income' 
                      ? 'bg-gradient-to-r from-[#F472B6] to-[#EC4899] text-white shadow-lg border-2 border-[#EC4899] font-semibold scale-[1.02]' 
                      : 'bg-white text-neutral-500 hover:bg-[#FDF2F8] hover:text-[#F472B6] border-2 border-transparent font-medium'
                  }`}
                  aria-pressed={newType === 'income'}
                >
                  수입
                </button>
                <button 
                  onClick={() => setNewType('expense')} 
                  className={`px-4 py-2 text-sm rounded-lg min-w-[100px] transition-all duration-300 ${
                    newType === 'expense' 
                      ? 'bg-gradient-to-r from-[#F472B6] to-[#EC4899] text-white shadow-lg border-2 border-[#EC4899] font-semibold scale-[1.02]' 
                      : 'bg-white text-neutral-500 hover:bg-[#FDF2F8] hover:text-[#F472B6] border-2 border-transparent font-medium'
                  }`}
                  aria-pressed={newType === 'expense'}
                >
                  지출
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-neutral-700 mb-1">일자</label>
                <input type="date" className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 transition-all duration-300" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1">금액</label>
                <input 
                  type="text" 
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 transition-all duration-300" 
                  value={newAmount} 
                  onChange={e => {
                    // 숫자만 추출
                    const numericValue = e.target.value.replace(/[^0-9]/g, '')
                    // 콤마 포맷팅
                    if (numericValue === '') {
                      setNewAmount('')
                    } else {
                      const formatted = Number(numericValue).toLocaleString('ko-KR')
                      setNewAmount(formatted)
                    }
                  }}
                  placeholder="금액을 입력하세요 (원)" 
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1">메모(선택)</label>
                <input className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 placeholder:text-neutral-500 transition-all duration-300" value={newMemo} onChange={e => setNewMemo(e.target.value)} placeholder="설명 입력" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
              <Button variant="secondary" onClick={() => { setNewOpen(false); setNewAmount(''); setNewMemo('') }}>취소</Button>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    // 콤마 제거 후 숫자로 변환
                    const amountValue = newAmount.replace(/[^0-9]/g, '')
                    if (!amountValue || Number(amountValue) === 0) {
                      toast.error('금액을 입력해주세요')
                      return
                    }
                    const amountNumber = Number(amountValue)
                    if (newType === 'income') {
                      const { transactionsApi } = await import('@/app/lib/api/transactions')
                      const createPayload: any = { transaction_date: newDate, amount: amountNumber }
                      // notes가 있을 때만 포함
                      if (newMemo && newMemo.trim() !== '') {
                        createPayload.notes = newMemo.trim()
                      }
                      await transactionsApi.create(createPayload)
                    } else {
                      const { expensesApi } = await import('@/app/lib/api/expenses')
                      const expensePayload: any = { expense_date: newDate, amount: amountNumber }
                      // memo는 값이 있을 때만 포함
                      if (newMemo && newMemo.trim() !== '') {
                        expensePayload.memo = newMemo.trim()
                      }
                      await expensesApi.create(expensePayload)
                    }
                    setNewOpen(false)
                    setNewAmount('')
                    await load()
                    toast.success('저장되었습니다.')
                  } catch (e:any) {
                    toast.error('저장 실패', e?.message)
                  }
                }}
              >추가</Button>
            </div>
          </div>
      </div>
      )}

      {/* FAB: 우측 하단 고정 (모바일/데스크톱 공통) */}
      <button
        aria-label="내역 추가"
        title="내역 추가"
        onClick={() => { setNewType('income'); setNewDate(new Date().toISOString().slice(0,10)); setNewAmount(''); setNewCategory(''); setNewMemo(''); setNewOpen(true) }}
        className="fixed right-4 bottom-4 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-[0.98] inline-flex items-center justify-center"
      >
        +
      </button>
      <ExpenseDetailModal
        open={expenseOpen}
        item={expenseDetail}
        onClose={() => setExpenseOpen(false)}
        onSaved={load}
        onDeleted={load}
      />
      <TransactionDetailModal
        open={txOpen}
        item={txDetail}
        onClose={() => setTxOpen(false)}
        onSaved={load}
        onDeleted={load}
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </main>
  )
}


