import { useMemo, useState } from 'react'
import { usePagination } from './usePagination'
import { Expense, Transaction } from '@/types/entities'
import { FinanceFilters, FinanceDateRange } from '@/types/finance'

export function useFinanceFilters(
  expenses: Expense[],
  transactions: Transaction[],
  dateRange: FinanceDateRange
) {
  const [filters, setFilters] = useState<FinanceFilters>({
    filterType: ['income', 'expense'],
    sortKey: 'date',
    sortDir: 'desc',
    showFilters: true
  })

  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: 0,
  })
  const { page, pageSize } = pagination

  // 결합된 데이터 생성
  const combined = useMemo(() => {
    const inRange = (iso: string) => {
      const d = (iso || '').slice(0, 10)
      return (!dateRange.from || d >= dateRange.from) && (!dateRange.to || d <= dateRange.to)
    }
    const incomeRows = filters.filterType.includes('income') ? transactions
      .filter(t => inRange(t.transaction_date || t.created_at || ''))
      .map(t => ({
        id: t.id,
        type: 'income' as const,
        date: (t.transaction_date || t.created_at || '').slice(0, 10),
        amount: Number(t.amount || 0),
        note: t.category || '',
        raw: t,
      })) : []
    const expenseRows = filters.filterType.includes('expense') ? expenses
      .filter(e => inRange(e.expense_date || ''))
      .map(e => ({
        id: e.id,
        type: 'expense' as const,
        date: (e.expense_date || '').slice(0, 10),
        amount: Number(e.amount || 0),
        note: e.category || e.memo || '',
        raw: e,
      })) : []
    const rows = [...incomeRows, ...expenseRows]
    rows.sort((a, b) => {
      if (filters.sortKey === 'date') {
        const dateA = a.date || ''
        const dateB = b.date || ''
        return filters.sortDir === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA)
      }
      if (a.amount < b.amount) return filters.sortDir === 'asc' ? -1 : 1
      if (a.amount > b.amount) return filters.sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [transactions, expenses, filters, dateRange])

  const pagedCombined = useMemo(() => {
    const start = (page - 1) * pageSize
    return combined.slice(start, start + pageSize)
  }, [combined, page, pageSize])

  // 통계 계산
  const sumIncome = useMemo(() => transactions
    .filter(t => {
      const d = (t.transaction_date || t.created_at || '').slice(0, 10)
      return (!dateRange.from || d >= dateRange.from) && (!dateRange.to || d <= dateRange.to)
    })
    .reduce((s, t) => s + Number(t.amount || 0), 0), [transactions, dateRange])

  const sumExpense = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses])
  const profit = sumIncome - sumExpense

  const updateFilters = (newFilters: Partial<FinanceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const toggleSort = (key: 'date' | 'amount') => {
    const isAsc = filters.sortKey === key && filters.sortDir === 'asc'
    setFilters(prev => ({
      ...prev,
      sortKey: key,
      sortDir: isAsc ? 'desc' : 'asc'
    }))
  }

  return {
    // Filters
    filters,
    updateFilters,
    toggleSort,

    // Pagination
    ...pagination,

    // Data
    combined,
    pagedCombined,

    // Stats
    sumIncome,
    sumExpense,
    profit,
  }
}
