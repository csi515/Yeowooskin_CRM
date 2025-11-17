'use client'

import { useEffect, useState, useMemo } from 'react'
import ExpenseDetailModal from '../components/modals/ExpenseDetailModal'
import TransactionDetailModal from '../components/modals/TransactionDetailModal'
import { Plus, Pencil } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAppToast } from '../lib/ui/toast'
import FilterBar from '../components/filters/FilterBar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../components/ui/Modal'
import { usePagination } from '../lib/hooks/usePagination'
import Pagination from '../components/ui/Pagination'
import type { Expense, Transaction } from '@/types/entities'
import MetricCard from '../components/MetricCard'

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
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [includeIncome, setIncludeIncome] = useState(true)
  const [includeExpense, setIncludeExpense] = useState(true)
  const [newOpen, setNewOpen] = useState(false)
  const [newType, setNewType] = useState<'income' | 'expense'>('income')
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [newAmount, setNewAmount] = useState<string>('')
  const [newMemo, setNewMemo] = useState<string>('')
  const [expenseDetail, setExpenseDetail] = useState<Expense | null>(null)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [txDetail, setTxDetail] = useState<Transaction | null>(null)
  const [txOpen, setTxOpen] = useState(false)
  const toast = useAppToast()

  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 20,
    totalItems: 0,
  })
  const { page, pageSize, setPage, setPageSize } = pagination

  const load = async () => {
    try {
      setLoading(true); setError('')
      const { expensesApi } = await import('@/app/lib/api/expenses')
      const { transactionsApi } = await import('@/app/lib/api/transactions')
      const [ex, tr] = await Promise.all([
        expensesApi.list({ from, to }),
        transactionsApi.list({ limit: 1000 }),
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

  const totalPages = Math.max(1, Math.ceil(combined.length / pageSize))
  const pagedCombined = useMemo(() => {
    const start = (page - 1) * pageSize
    return combined.slice(start, start + pageSize)
  }, [combined, page, pageSize])

  // 페이지네이션 totalItems 업데이트
  useEffect(() => {
    pagination.setTotalItems?.(combined.length)
  }, [combined.length])

  return (
    <main className="space-y-4 md:space-y-5 lg:space-y-6">
      {/* 핵심 지표 카드 - 반응형 */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
        <MetricCard
          label="월간 수입"
          value={`₩${Number(sumIncome).toLocaleString()}`}
          className="h-full"
          colorIndex={1}
        />
        <MetricCard
          label="월간 지출"
          value={`₩${Number(sumExpense).toLocaleString()}`}
          className="h-full"
          colorIndex={0}
        />
        <MetricCard
          label="월간 순이익"
          value={`₩${Number(profit).toLocaleString()}`}
          delta={{
            value: profit >= 0 ? '흑자' : '적자',
            tone: profit >= 0 ? 'up' : 'down'
          }}
          className="h-full"
          colorIndex={profit >= 0 ? 2 : 0}
        />
      </section>

      <FilterBar>
        <div className="flex flex-wrap items-end gap-3 md:gap-4 w-full">
          {/* 기간 선택 */}
          <div className="flex-1 min-w-0 sm:min-w-[280px]">
            <label className="block mb-2 text-sm font-semibold text-neutral-700">기간</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={from}
                onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))}
                className="flex-1"
              />
              <span className="text-neutral-600 font-medium">~</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>

          {/* 유형 필터 */}
          <div className="w-full sm:w-auto">
            <label className="block mb-2 text-sm font-semibold text-neutral-700">유형</label>
            <div className="inline-flex rounded-lg border border-neutral-300 bg-white p-1 shadow-sm">
              <button
                onClick={() => { setIncludeIncome(v => { const nv = !v; setPage(1); return nv }) }}
                className={`px-4 py-2 text-sm rounded-md min-w-[80px] font-semibold transition-all duration-200 ${
                  includeIncome 
                    ? 'bg-action-blue-600 text-white shadow-md' 
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                aria-pressed={includeIncome}
              >
                수입
              </button>
              <button
                onClick={() => { setIncludeExpense(v => { const nv = !v; setPage(1); return nv }) }}
                className={`px-4 py-2 text-sm rounded-md min-w-[80px] font-semibold transition-all duration-200 ${
                  includeExpense 
                    ? 'bg-action-blue-600 text-white shadow-md' 
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                aria-pressed={includeExpense}
              >
                지출
              </button>
            </div>
          </div>

          {/* 추가 버튼 */}
          <div className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setNewType('income')
                setNewDate(new Date().toISOString().slice(0,10))
                setNewAmount('')
                setNewMemo('')
                setNewOpen(true)
              }}
              className="w-full sm:w-auto"
            >
              새 내역
            </Button>
          </div>
        </div>
      </FilterBar>

      {/* 수입/지출 테이블 - 반응형 */}
      <section className="bg-white rounded-xl border border-neutral-200 shadow-md overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="p-4 md:p-5 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-lg md:text-xl font-semibold text-neutral-900">수입/지출 내역</h2>
        </div>

        {/* 모바일: 카드 뷰, 데스크톱: 테이블 뷰 */}
        <div className="overflow-x-auto">
          {/* 데스크톱 테이블 */}
          <table className="hidden lg:table w-full text-sm">
            <thead className="bg-neutral-50 border-b-2 border-neutral-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                  <button
                    className="inline-flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
                    onClick={() => { setSortKey('date'); setSortDir(d => (sortKey==='date' && d==='asc') ? 'desc' : 'asc'); setPage(1) }}
                  >
                    일자 {sortKey==='date' ? (sortDir==='asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left font-semibold text-neutral-700">유형</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-right">
                  <button
                    className="inline-flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
                    onClick={() => { setSortKey('amount'); setSortDir(d => (sortKey==='amount' && d==='asc') ? 'desc' : 'asc'); setPage(1) }}
                  >
                    금액 {sortKey==='amount' ? (sortDir==='asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left font-semibold text-neutral-700">메모/카테고리</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-center font-semibold text-neutral-700">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td className="px-4 md:px-6 py-3 md:py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 md:px-6 py-3 md:py-4"><Skeleton className="h-6 w-16" /></td>
                  <td className="px-4 md:px-6 py-3 md:py-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  <td className="px-4 md:px-6 py-3 md:py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 md:px-6 py-3 md:py-4"><Skeleton className="h-8 w-8 mx-auto" /></td>
                </tr>
              ))}
              {!loading && pagedCombined.map(row => (
                <tr
                  key={`${row.type}-${row.id}`}
                  className="hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (row.type === 'income') { setTxDetail(row.raw); setTxOpen(true) }
                    else { setExpenseDetail(row.raw); setExpenseOpen(true) }
                  }}
                >
                  <td className="px-4 md:px-6 py-3 md:py-4 text-neutral-900 font-medium">{row.date}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                      row.type === 'income' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-error-50 text-error-700 border border-error-200'
                    }`}>
                      {row.type === 'income' ? '수입' : '지출'}
                    </span>
                  </td>
                  <td className={`px-4 md:px-6 py-3 md:py-4 text-right font-semibold ${
                    row.type === 'income' ? 'text-emerald-600' : 'text-error-600'
                  }`}>
                    {row.type === 'income' ? '+' : '-'}₩{Number(row.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-neutral-600">{row.note || '-'}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (row.type === 'income') { setTxDetail(row.raw); setTxOpen(true) }
                        else { setExpenseDetail(row.raw); setExpenseOpen(true) }
                      }}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-neutral-300 hover:bg-action-blue-600 hover:text-white hover:border-action-blue-600 transition-all"
                      aria-label="상세보기"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && combined.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8">
                    <EmptyState
                      title="표시할 데이터가 없습니다."
                      description="새로운 수입 또는 지출 내역을 추가해보세요."
                      actionLabel="새 내역 추가"
                      actionOnClick={() => {
                        setNewType('income')
                        setNewDate(new Date().toISOString().slice(0,10))
                        setNewAmount('')
                        setNewMemo('')
                        setNewOpen(true)
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 모바일/태블릿 카드 뷰 */}
          <div className="lg:hidden divide-y divide-neutral-200">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <div key={`s-${i}`} className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
            {!loading && pagedCombined.map(row => (
              <div
                key={`${row.type}-${row.id}`}
                className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
                onClick={() => {
                  if (row.type === 'income') { setTxDetail(row.raw); setTxOpen(true) }
                  else { setExpenseDetail(row.raw); setExpenseOpen(true) }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                        row.type === 'income' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-error-50 text-error-700 border border-error-200'
                      }`}>
                        {row.type === 'income' ? '수입' : '지출'}
                      </span>
                      <span className="text-sm font-medium text-neutral-900">{row.date}</span>
                    </div>
                    <div className={`text-lg font-bold ${
                      row.type === 'income' ? 'text-emerald-600' : 'text-error-600'
                    }`}>
                      {row.type === 'income' ? '+' : '-'}₩{Number(row.amount || 0).toLocaleString()}
                    </div>
                    {row.note && (
                      <div className="text-sm text-neutral-600 mt-1">{row.note}</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (row.type === 'income') { setTxDetail(row.raw); setTxOpen(true) }
                      else { setExpenseDetail(row.raw); setExpenseOpen(true) }
                    }}
                    className="h-10 w-10 flex-shrink-0 inline-flex items-center justify-center rounded-lg border border-neutral-300 hover:bg-action-blue-600 hover:text-white hover:border-action-blue-600 transition-all"
                    aria-label="상세보기"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            {!loading && combined.length === 0 && (
              <div className="p-8">
                <EmptyState
                  title="표시할 데이터가 없습니다."
                  description="새로운 수입 또는 지출 내역을 추가해보세요."
                  actionLabel="새 내역 추가"
                  actionOnClick={() => {
                    setNewType('income')
                    setNewDate(new Date().toISOString().slice(0,10))
                    setNewAmount('')
                    setNewMemo('')
                    setNewOpen(true)
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 페이지네이션 */}
        {combined.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={combined.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
          />
        )}
      </section>

      {/* 새 내역 추가 모달 */}
      {newOpen && (
        <Modal open={newOpen} onClose={() => { setNewOpen(false); setNewAmount(''); setNewMemo('') }} size="md">
          <ModalHeader
            title="새 수입/지출"
            description="내역을 추가합니다."
          />
          <ModalBody>
            <div className="space-y-5">
              {/* 유형 선택 */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-neutral-700">유형</label>
                <div className="inline-flex rounded-lg border border-neutral-300 bg-white p-1 shadow-sm">
                  <button 
                    onClick={() => setNewType('income')} 
                    className={`px-4 py-2 text-sm rounded-md min-w-[80px] font-semibold transition-all duration-200 ${
                      newType === 'income' 
                        ? 'bg-action-blue-600 text-white shadow-md' 
                        : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                    aria-pressed={newType === 'income'}
                  >
                    수입
                  </button>
                  <button 
                    onClick={() => setNewType('expense')} 
                    className={`px-4 py-2 text-sm rounded-md min-w-[80px] font-semibold transition-all duration-200 ${
                      newType === 'expense' 
                        ? 'bg-action-blue-600 text-white shadow-md' 
                        : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                    aria-pressed={newType === 'expense'}
                  >
                    지출
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Input
                  label="일자"
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                <Input
                  label="금액"
                  type="text"
                  required
                  value={newAmount}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '')
                    if (numericValue === '') {
                      setNewAmount('')
                    } else {
                      setNewAmount(Number(numericValue).toLocaleString('ko-KR'))
                    }
                  }}
                  placeholder="금액 입력"
                />
              </div>
              <Textarea
                label="메모(선택)"
                placeholder="설명을 입력하세요"
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => { setNewOpen(false); setNewAmount(''); setNewMemo('') }}
            >
              취소
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const amountValue = newAmount.replace(/[^0-9]/g, '')
                  if (!amountValue || Number(amountValue) === 0) {
                    toast.error('금액을 입력해주세요')
                    return
                  }
                  const amountNumber = Number(amountValue)
                  if (newType === 'income') {
                    const { transactionsApi } = await import('@/app/lib/api/transactions')
                    const createPayload: any = { transaction_date: newDate, amount: amountNumber }
                    if (newMemo && newMemo.trim() !== '') {
                      createPayload.notes = newMemo.trim()
                    }
                    await transactionsApi.create(createPayload)
                  } else {
                    const { expensesApi } = await import('@/app/lib/api/expenses')
                    const expensePayload: any = { expense_date: newDate, amount: amountNumber }
                    if (newMemo && newMemo.trim() !== '') {
                      expensePayload.memo = newMemo.trim()
                    }
                    await expensesApi.create(expensePayload)
                  }
                  setNewOpen(false)
                  setNewAmount('')
                  await load()
                  toast.success('저장되었습니다.')
                } catch (e: any) {
                  toast.error('저장 실패', e?.message)
                }
              }}
            >
              추가
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Mobile FAB */}
      <button
        aria-label="내역 추가"
        onClick={() => {
          setNewType('income')
          setNewDate(new Date().toISOString().slice(0,10))
          setNewAmount('')
          setNewMemo('')
          setNewOpen(true)
        }}
        className="md:hidden fixed right-4 bottom-4 h-14 w-14 rounded-full bg-action-blue-600 text-white shadow-lg hover:bg-action-blue-700 active:scale-[0.98] inline-flex items-center justify-center z-[1000] transition-all"
      >
        <Plus className="h-6 w-6" />
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
      {error && <p className="text-sm text-error-600">{error}</p>}
    </main>
  )
}
