import { useState, useEffect, useCallback } from 'react'
import { Expense, Transaction } from '@/types/entities'
import { FinanceState, FinanceDateRange } from '@/types/finance'

function isoMonthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) }
}

export function useFinanceData() {
  const [{ from, to }, setRange] = useState<FinanceDateRange>(() => isoMonthRange())

  const [state, setState] = useState<FinanceState>({
    expenses: [],
    transactions: [],
    loading: false,
    error: '',
    incomeCategories: [],
    expenseCategories: []
  })

  const load = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '' }))
      const { expensesApi } = await import('@/app/lib/api/expenses')
      const { transactionsApi } = await import('@/app/lib/api/transactions')
      const [ex, tr] = await Promise.all([
        expensesApi.list({ from, to }),
        transactionsApi.list({ limit: 500 }),
      ])
      setState(prev => ({
        ...prev,
        expenses: Array.isArray(ex) ? ex : [],
        transactions: Array.isArray(tr) ? tr : []
      }))
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '에러가 발생했습니다.'
      setState(prev => ({ ...prev, error: errorMessage }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [from, to])

  useEffect(() => { load() }, [load])

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { settingsApi } = await import('@/app/lib/api/settings')
        const data = await settingsApi.get()
        if (data?.financialSettings?.incomeCategories) {
          setState(prev => ({ ...prev, incomeCategories: data.financialSettings.incomeCategories }))
        }
        if (data?.financialSettings?.expenseCategories) {
          setState(prev => ({ ...prev, expenseCategories: data.financialSettings.expenseCategories }))
        }
      } catch { }
    }
    loadSettings()
  }, [])

  const updateRange = (newRange: Partial<FinanceDateRange>) => {
    setRange(prev => ({ ...prev, ...newRange }))
  }

  return {
    // Date range
    dateRange: { from, to },
    updateRange,

    // State
    ...state,

    // Actions
    load,
  }
}
