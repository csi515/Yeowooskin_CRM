import { Expense, Transaction } from './entities'

/**
 * Finance 페이지 관련 타입 정의
 */

export interface FinanceCombinedRow {
  id: string
  type: 'income' | 'expense'
  date: string
  amount: number
  note: string
  raw: Expense | Transaction
}

export interface FinanceDateRange {
  from: string
  to: string
}

export interface FinanceState {
  expenses: Expense[]
  transactions: Transaction[]
  loading: boolean
  error: string
  incomeCategories: string[]
  expenseCategories: string[]
}

export interface FinanceModalState {
  newOpen: boolean
  expenseOpen: boolean
  txOpen: boolean
  expenseDetail: Expense | null
  txDetail: Transaction | null
}

export interface FinanceCreateForm {
  newType: 'income' | 'expense'
  newDate: string
  newAmount: string
  newMemo: string
  selectedCategory: string
}

export interface FinanceFilters {
  filterType: ('income' | 'expense')[]
  sortKey: 'date' | 'amount'
  sortDir: 'asc' | 'desc'
  showFilters: boolean
}
