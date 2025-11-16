/**
 * 지출 관련 API 메서드
 */

import { apiClient } from './client'
import type { Expense, ExpenseCreateInput, ExpenseUpdateInput } from '@/types/entities'
import type { ExpensesListQuery } from '@/types/api'

export const expensesApi = {
  /**
   * 지출 목록 조회
   */
  list: (query?: ExpensesListQuery): Promise<Expense[]> => {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const queryString = params.toString()
    return apiClient.get<Expense[]>(`/api/expenses${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 지출 상세 조회
   */
  get: (id: string): Promise<Expense> => {
    return apiClient.get<Expense>(`/api/expenses/${id}`)
  },

  /**
   * 지출 생성
   */
  create: (input: ExpenseCreateInput): Promise<Expense> => {
    return apiClient.post<Expense>('/api/expenses', input)
  },

  /**
   * 지출 수정
   */
  update: (id: string, input: ExpenseUpdateInput): Promise<Expense> => {
    return apiClient.put<Expense>(`/api/expenses/${id}`, input)
  },

  /**
   * 지출 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/expenses/${id}`)
  },
}

