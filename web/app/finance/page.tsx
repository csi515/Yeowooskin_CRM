'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import ExpenseDetailModal from '../components/modals/ExpenseDetailModal'
import TransactionDetailModal from '../components/modals/TransactionDetailModal'
import { Pencil, Plus, Download } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import FloatingActionButton from '../components/common/FloatingActionButton'
import { useAppToast } from '../lib/ui/toast'
import Button from '../components/ui/Button'
import { usePagination } from '../lib/hooks/usePagination'
import { useForm } from '../lib/hooks/useForm'
import { exportFinanceToExcel, type FinanceExportData } from '../lib/utils/excelExport'
import { generateTaxReport } from '../lib/utils/taxReport'
import { FileText } from 'lucide-react'
import { createOwnerOrAbovePage } from '../lib/hocs/createProtectedPage'
import { useCurrentUser } from '../lib/hooks/useCurrentUser'
import type { Expense, Transaction, TransactionCreateInput, ExpenseCreateInput, Branch } from '@/types/entities'

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

function FinancePage() {
  const { currentUser, isHQ, branchId } = useCurrentUser()
  const [{ from, to }, setRange] = useState(() => isoMonthRange())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const { expensesApi } = await import('@/app/lib/api/expenses')
      const { transactionsApi } = await import('@/app/lib/api/transactions')

      // 지점 필터링 파라미터
      const branchFilter = isHQ ? {} : { branch_id: selectedBranchId || branchId }

      const [ex, tr] = await Promise.all([
        expensesApi.list({ from, to, ...branchFilter }),
        transactionsApi.list({ limit: 500, ...branchFilter }),
      ])
      setExpenses(Array.isArray(ex) ? ex : [])
      setTransactions(Array.isArray(tr) ? tr : [])
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setError(errorMessage)
    } finally { setLoading(false) }
  }, [from, to, isHQ, selectedBranchId, branchId])

  // 지점 목록 로드 (HQ 전용)
  const loadBranches = useCallback(async () => {
    if (!isHQ) return

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
      const supabase = createSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name')

      if (error) throw error

      setBranches(data || [])
      // 기본적으로 첫 번째 지점 선택
      if (data && data.length > 0 && !selectedBranchId) {
        setSelectedBranchId(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load branches:', err)
    }
  }, [isHQ, selectedBranchId])

  // 초기 로드 및 지점 설정
  useEffect(() => {
    if (isHQ) {
      loadBranches()
    } else if (branchId && !selectedBranchId) {
      setSelectedBranchId(branchId)
    }
  }, [isHQ, branchId, selectedBranchId, loadBranches])

  useEffect(() => { load() }, [load])

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
  const [newMemo, setNewMemo] = useState<string>('')
  const [newCategory, setNewCategory] = useState<string>('')
  const [expenseCategories, setExpenseCategories] = useState<string[]>([])
  const [expenseDetail, setExpenseDetail] = useState<Expense | null>(null)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [txDetail, setTxDetail] = useState<Transaction | null>(null)
  const [txOpen, setTxOpen] = useState(false)
  const toast = useAppToast()
  
  // 설정에서 비용 항목 목록 가져오기
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { settingsApi } = await import('@/app/lib/api/settings')
        const settings = await settingsApi.get()
        const categories = settings.financialSettings?.expenseCategories || []
        if (categories.length > 0) {
          setExpenseCategories(categories)
        } else {
          // 설정에 카테고리가 없으면 기본값 사용
          const { getExpenseCategories } = await import('@/app/lib/utils/expenseCategories')
          setExpenseCategories(getExpenseCategories())
        }
      } catch (error) {
        console.error('설정 로드 실패:', error)
        // 설정 로드 실패 시 기본 카테고리 사용
        const { getExpenseCategories } = await import('@/app/lib/utils/expenseCategories')
        setExpenseCategories(getExpenseCategories())
      }
    }
    
    loadCategories()
  }, [])

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
        note: t.notes || '',
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
    <div className="w-full sm:w-auto">
      <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">유형</label>
      <div className="inline-flex rounded-lg border border-neutral-300 bg-neutral-50 p-1 whitespace-nowrap gap-1 shadow-sm">
        <button
          onClick={() => { setIncludeIncome(v => { const nv = !v; setPage(1); return nv }); }}
          className={`px-4 py-2 text-sm rounded-md min-w-[80px] transition-all duration-200 touch-manipulation ${
            includeIncome 
              ? 'bg-white text-blue-600 shadow-sm font-semibold' 
              : 'text-neutral-600 hover:text-neutral-900 font-medium'
          }`}
          aria-pressed={includeIncome}
        >
          수입
        </button>
        <button
          onClick={() => { setIncludeExpense(v => { const nv = !v; setPage(1); return nv }); }}
          className={`px-4 py-2 text-sm rounded-md min-w-[80px] transition-all duration-200 touch-manipulation ${
            includeExpense 
              ? 'bg-white text-blue-600 shadow-sm font-semibold' 
              : 'text-neutral-600 hover:text-neutral-900 font-medium'
          }`}
          aria-pressed={includeExpense}
        >
          지출
        </button>
      </div>
    </div>
  )

  const handleExportExcel = async () => {
    try {
      toast.info('엑셀 파일을 생성하는 중입니다...')
      
      // 내보낼 데이터 준비
      const exportData: FinanceExportData[] = combined.map((row) => ({
        date: row.date,
        type: row.type === 'income' ? '수입' : '지출',
        amount: row.amount,
        category: row.type === 'expense' ? (row.raw as Expense).category : '',
        memo: row.note || '',
      }))

      const summary = {
        totalIncome: sumIncome,
        totalExpense: sumExpense,
        profit,
        period: { from, to },
      }

      // 엑셀 내보내기 실행
      exportFinanceToExcel(exportData, summary)
      
      toast.success('엑셀 파일이 다운로드되었습니다.')
    } catch (error) {
      console.error('엑셀 내보내기 오류:', error)
      toast.error('엑셀 내보내기 실패', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    }
  }

  const handleGenerateTaxReport = async () => {
    try {
      toast.info('세무 자료를 생성하는 중입니다...')
      
      const incomeData = transactions
        .filter(t => {
          const d = (t.transaction_date || t.created_at || '').slice(0, 10)
          return (!from || d >= from) && (!to || d < to)
        })
        .map(t => ({
          date: (t.transaction_date || t.created_at || '').slice(0, 10),
          amount: Number(t.amount || 0),
          customer: t.customer_id ? '고객' : '',
          notes: t.notes || '',
        }))

      const expenseData = expenses.map(e => ({
        date: e.expense_date,
        amount: Number(e.amount || 0),
        category: e.category,
        memo: e.memo || '',
      }))

      generateTaxReport({
        period: { from, to },
        income: incomeData,
        expense: expenseData,
      })
      
      toast.success('세무 자료 파일이 다운로드되었습니다.')
    } catch (error) {
      console.error('세무 자료 생성 오류:', error)
      toast.error('세무 자료 생성 실패', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    }
  }

  return (
    <main className="space-y-2 md:space-y-3">
      {/* 헤더 영역 - 지점 선택 및 엑셀 내보내기 버튼 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">재무 관리</h1>
          {isHQ && branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="h-9 px-3 rounded-lg border border-neutral-300 bg-white text-sm focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 outline-none"
            >
              <option value="">전체 지점</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          )}
          {!isHQ && currentUser?.branch && (
            <span className="text-sm text-neutral-600 bg-neutral-100 px-2 py-1 rounded">
              {currentUser.branch.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText className="h-4 w-4" />}
            onClick={handleGenerateTaxReport}
            className="hidden sm:flex"
          >
            세무 자료 생성
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExportExcel}
            className="hidden sm:flex"
          >
            엑셀로 내보내기
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExportExcel}
            className="sm:hidden"
            aria-label="엑셀로 내보내기"
          >
            내보내기
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl border-2 border-emerald-200 p-3 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300">
          <div className="text-xs sm:text-sm font-semibold text-emerald-700 mb-1 sm:mb-2">월간 수입</div>
          <div className="text-xl sm:text-3xl font-bold text-emerald-700">₩{Number(sumIncome).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-xl border-2 border-rose-200 p-3 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300">
          <div className="text-xs sm:text-sm font-semibold text-rose-700 mb-1 sm:mb-2">월간 지출</div>
          <div className="text-xl sm:text-3xl font-bold text-rose-700">₩{Number(sumExpense).toLocaleString()}</div>
        </div>
        <div className={`rounded-xl border-2 p-3 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 ${
          profit >= 0 
            ? 'bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200' 
            : 'bg-gradient-to-br from-rose-50 to-pink-100 border-rose-200'
        }`}>
          <div className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>월간 순이익</div>
          <div className={`text-xl sm:text-3xl font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₩{Number(profit).toLocaleString()}</div>
        </div>
      </section>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 min-w-0 overflow-hidden">
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">기간</label>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <input 
                type="date" 
                value={from} 
                onChange={e => setRange(r => ({ ...r, from: e.target.value }))} 
                className="h-11 flex-1 min-w-0 rounded-lg border border-neutral-300 px-2 sm:px-4 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 outline-none bg-white text-xs sm:text-sm text-neutral-900 transition-all duration-200 touch-manipulation"
              />
              <span className="text-neutral-600 font-medium text-xs sm:text-sm flex-shrink-0">~</span>
              <input 
                type="date" 
                value={to} 
                onChange={e => setRange(r => ({ ...r, to: e.target.value }))} 
                className="h-11 flex-1 min-w-0 rounded-lg border border-neutral-300 px-2 sm:px-4 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 outline-none bg-white text-xs sm:text-sm text-neutral-900 transition-all duration-200 touch-manipulation"
              />
            </div>
          </div>
          <TypeFilter />
        </div>
      </div>

      {/* 가운데 영역: 수입/지출 통합 테이블 + 상세보기 버튼 */}
        <section className="bg-white rounded-xl border border-neutral-200 shadow-md overflow-hidden">
        <div className="p-3 md:p-4 border-b border-neutral-200 text-sm font-medium text-neutral-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          <span>수입/지출 내역</span>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => { setNewType('income'); setNewDate(new Date().toISOString().slice(0,10)); setNewAmount(''); setNewMemo(''); setNewCategory(''); setNewOpen(true) }}
            className="w-full sm:w-auto"
          >
            새 수입/지출
          </Button>
        </div>
          <div className="overflow-x-auto -mx-3 md:mx-0">
          <table className="w-full text-xs sm:text-sm min-w-[640px]">
            <thead className="bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 border-b-2 border-purple-200 sticky top-0 z-[40]">
              <tr>
                <th className="text-left p-2 sm:p-4 font-semibold text-pink-700 whitespace-nowrap min-w-[90px]">
                  <button className="inline-flex items-center gap-1 hover:text-pink-900 transition-colors duration-300 font-semibold" onClick={() => { setSortKey('date'); setSortDir(d => (sortKey==='date' && d==='asc') ? 'desc' : 'asc'); setPage(1) }}>
                    일자 {sortKey==='date' ? (sortDir==='asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
              <th className="text-left p-2 sm:p-4 font-semibold text-purple-700 whitespace-nowrap min-w-[60px]">유형</th>
                <th className="text-right p-2 sm:p-4 font-semibold text-blue-700 whitespace-nowrap min-w-[100px]">
                  <button className="inline-flex items-center gap-1 hover:text-blue-900 transition-colors duration-300 font-semibold" onClick={() => { setSortKey('amount'); setSortDir(d => (sortKey==='amount' && d==='asc') ? 'desc' : 'asc'); setPage(1) }}>
                    금액 {sortKey==='amount' ? (sortDir==='asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
              <th className="text-left p-2 sm:p-4 font-semibold text-emerald-700 whitespace-nowrap min-w-[120px]">메모/카테고리</th>
                <th className="text-right p-2 sm:p-4 font-semibold text-amber-700 min-w-[60px] sticky right-0 bg-gradient-to-r from-transparent via-purple-100/50 to-purple-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={`ex-s-${i}`}>
                  <td className="p-2 sm:p-4"><Skeleton className="h-4 w-20 sm:w-28" /></td>
                <td className="p-2 sm:p-4"><Skeleton className="h-4 w-12 sm:w-16" /></td>
                  <td className="p-2 sm:p-4 text-right"><Skeleton className="h-4 w-16 sm:w-20 ml-auto" /></td>
                <td className="p-2 sm:p-4"><Skeleton className="h-4 w-20 sm:w-24" /></td>
                  <td className="p-2 sm:p-4 sticky right-0 bg-white"><Skeleton className="h-6 w-6 sm:h-8 sm:w-8 ml-auto" /></td>
                </tr>
              ))}
            {!loading && pagedCombined.map(row => (
              <tr key={`${row.type}-${row.id}`} className="hover:bg-neutral-50 transition-colors duration-300 min-h-[48px] border-b border-neutral-200">
                <td className="p-2 sm:p-4 text-neutral-900 whitespace-nowrap">{row.date}</td>
                <td className="p-2 sm:p-4">
                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs font-medium ${
                    row.type === 'income' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {row.type === 'income' ? '수입' : '지출'}
                  </span>
                </td>
                <td className={`p-2 sm:p-4 text-right font-medium whitespace-nowrap ${
                  row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}>₩{Number(row.amount || 0).toLocaleString()}</td>
                <td className="p-2 sm:p-4 text-neutral-600 min-w-0">
                  <div className="truncate max-w-[150px] sm:max-w-none" title={row.note || '-'}>{row.note || '-'}</div>
                </td>
                  <td className="p-2 sm:p-4 sticky right-0 bg-white z-10">
                    <button
                    onClick={() => {
                      if (row.type === 'income') { setTxDetail(row.raw); setTxOpen(true) }
                      else { setExpenseDetail(row.raw); setExpenseOpen(true) }
                    }}
                      className="h-6 w-6 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg border border-neutral-300 hover:bg-[#F472B6] hover:text-white hover:border-[#F472B6] transition-all duration-300 flex-shrink-0"
                      aria-label="상세보기"
                      title="상세보기"
                    >
                      <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && combined.length === 0 && (
              <tr><td colSpan={5} className="p-4"><EmptyState title="표시할 데이터가 없습니다." /></td></tr>
              )}
            </tbody>
          </table>
          </div>
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
                <label className="block text-sm text-neutral-700 mb-1">카테고리(선택)</label>
                <select
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 transition-all duration-300"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1">메모(선택)</label>
                <input className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 placeholder:text-neutral-500 transition-all duration-300" value={newMemo} onChange={e => setNewMemo(e.target.value)} placeholder="설명 입력" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
              <Button variant="secondary" onClick={() => { setNewOpen(false); setNewAmount(''); setNewMemo(''); setNewCategory('') }} className="flex-1 sm:flex-none">취소</Button>
              <Button
                variant="primary"
                className="flex-1 sm:flex-none"
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
                      const createPayload: TransactionCreateInput = { transaction_date: newDate, amount: amountNumber }
                      // 카테고리와 메모를 결합하여 notes에 저장
                      const notesParts: string[] = []
                      if (newCategory && newCategory.trim() !== '') {
                        notesParts.push(newCategory.trim())
                      }
                      if (newMemo && newMemo.trim() !== '') {
                        notesParts.push(newMemo.trim())
                      }
                      if (notesParts.length > 0) {
                        createPayload.notes = notesParts.length === 2 
                          ? `${notesParts[0]}: ${notesParts[1]}` 
                          : notesParts[0]
                      }
                      await transactionsApi.create(createPayload)
                    } else {
                      const { expensesApi } = await import('@/app/lib/api/expenses')
                      const expensePayload: ExpenseCreateInput = { 
                        expense_date: newDate, 
                        amount: amountNumber, 
                        category: newCategory || '기타' 
                      }
                      // memo는 값이 있을 때만 포함
                      if (newMemo && newMemo.trim() !== '') {
                        expensePayload.memo = newMemo.trim()
                      }
                      await expensesApi.create(expensePayload)
                    }
                    setNewOpen(false)
                    setNewAmount('')
                    setNewMemo('')
                    setNewCategory('')
                    await load()
                    toast.success('저장되었습니다.')
                  } catch (err) {
                    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
                    toast.error('저장 실패', message)
                  }
                }}
              >추가</Button>
            </div>
          </div>
      </div>
      )}

      {/* 모바일 FAB */}
      <FloatingActionButton
        onClick={() => { setNewType('income'); setNewDate(new Date().toISOString().slice(0,10)); setNewAmount(''); setNewMemo(''); setNewCategory(''); setNewOpen(true) }}
        label="내역 추가"
      />
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

export default createOwnerOrAbovePage(FinancePage)