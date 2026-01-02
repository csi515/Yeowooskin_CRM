import { useState } from 'react'
import { useAppToast } from '../ui/toast'
import { exportFinanceToExcel } from '../utils/excelExport'
import { generateTaxReport } from '../utils/taxReport'
import { Expense, Transaction, TransactionCreateInput, ExpenseCreateInput } from '@/types/entities'
import { FinanceCombinedRow, FinanceCreateForm, FinanceDateRange } from '@/types/finance'

export function useFinanceActions(
  combined: FinanceCombinedRow[],
  dateRange: FinanceDateRange,
  sumIncome: number,
  sumExpense: number,
  profit: number,
  load: () => Promise<void>
) {
  const toast = useAppToast()

  const [createForm, setCreateForm] = useState<FinanceCreateForm>({
    newType: 'income',
    newDate: new Date().toISOString().slice(0, 10),
    newAmount: '',
    newMemo: '',
    selectedCategory: ''
  })

  const handleExportExcel = async () => {
    try {
      toast.info('엑셀 파일을 생성하는 중입니다...')
      const exportData: any[] = combined.map((row) => {
        const baseData = {
          date: row.date,
          type: row.type === 'income' ? '수입' as const : '지출' as const,
          amount: row.amount,
        }
        if (row.type === 'expense') {
          return {
            ...baseData,
            category: (row.raw as Expense).category,
            ...(row.note && { memo: row.note }),
          }
        } else {
          return {
            ...baseData,
            ...(row.note && { memo: row.note }),
          }
        }
      })
      const summary = {
        totalIncome: sumIncome,
        totalExpense: sumExpense,
        profit,
        period: dateRange,
      }
      exportFinanceToExcel(exportData, summary)
      toast.success('엑셀 파일이 다운로드되었습니다.')
    } catch (error) {
      console.error(error)
      toast.error('엑셀 내보내기 실패')
    }
  }

  const handleGenerateTaxReport = async () => {
    try {
      toast.info('세무 자료를 생성하는 중입니다...')
      const incomeData = combined
        .filter(row => row.type === 'income')
        .map(row => {
          const t = row.raw as Transaction
          return {
            date: row.date,
            amount: row.amount,
            ...(t.customer_id && { customer: '고객' }),
            ...(t.category && { category: t.category }),
          }
        })
      const expenseData = combined
        .filter(row => row.type === 'expense')
        .map(row => {
          const e = row.raw as Expense
          return {
            date: e.expense_date,
            amount: row.amount,
            category: e.category,
            ...(e.memo && { memo: e.memo }),
          }
        })
      generateTaxReport({
        period: dateRange,
        income: incomeData,
        expense: expenseData,
      })
      toast.success('세무 자료 파일이 다운로드되었습니다.')
    } catch (error) {
      console.error(error)
      toast.error('세무 자료 생성 실패')
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      newType: 'income',
      newDate: new Date().toISOString().slice(0, 10),
      newAmount: '',
      newMemo: '',
      selectedCategory: ''
    })
  }

  const updateCreateForm = (updates: Partial<FinanceCreateForm>) => {
    setCreateForm(prev => ({ ...prev, ...updates }))
  }

  const handleCreateSubmit = async (_incomeCategories: string[], _expenseCategories: string[]): Promise<boolean> => {
    try {
      const amountValue = createForm.newAmount.replace(/[^0-9]/g, '')
      if (!amountValue || Number(amountValue) === 0) {
        toast.error('금액을 입력해주세요')
        return false
      }
      const amountNumber = Number(amountValue)

      if (createForm.newType === 'income') {
        if (!createForm.selectedCategory) {
          toast.error('수입 항목을 선택해주세요')
          return false
        }
        const { transactionsApi } = await import('@/app/lib/api/transactions')
        const createPayload: TransactionCreateInput = {
          transaction_date: createForm.newDate,
          amount: amountNumber,
          category: createForm.selectedCategory,
        }
        await transactionsApi.create(createPayload)
      } else {
        if (!createForm.selectedCategory) {
          toast.error('지출 항목을 선택해주세요')
          return false
        }
        const { expensesApi } = await import('@/app/lib/api/expenses')
        const expensePayload: ExpenseCreateInput = {
          expense_date: createForm.newDate,
          amount: amountNumber,
          category: createForm.selectedCategory,
        }
        if (createForm.newMemo && createForm.newMemo.trim() !== '') {
          expensePayload.memo = createForm.newMemo.trim()
        }
        await expensesApi.create(expensePayload)
      }
      resetCreateForm()
      await load()
      toast.success('저장되었습니다.')
      return true
    } catch (err) {
      toast.error('저장 실패', err instanceof Error ? err.message : '')
      return false
    }
  }

  return {
    // Form state
    createForm,
    updateCreateForm,
    resetCreateForm,

    // Actions
    handleExportExcel,
    handleGenerateTaxReport,
    handleCreateSubmit,
  }
}
