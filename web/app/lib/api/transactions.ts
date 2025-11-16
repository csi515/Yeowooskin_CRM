/**
 * 거래 관련 API 메서드
 */

import { apiClient } from './client'
import type { Transaction, TransactionCreateInput, TransactionUpdateInput } from '@/types/entities'
import type { TransactionsListQuery } from '@/types/api'

export const transactionsApi = {
  /**
   * 거래 목록 조회
   */
  list: (query?: TransactionsListQuery): Promise<Transaction[]> => {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    if (query?.customer_id) params.set('customer_id', query.customer_id)
    const queryString = params.toString()
    return apiClient.get<Transaction[]>(`/api/transactions${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 거래 상세 조회
   */
  get: (id: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(`/api/transactions/${id}`)
  },

  /**
   * 거래 생성
   */
  create: (input: TransactionCreateInput): Promise<Transaction> => {
    return apiClient.post<Transaction>('/api/transactions', input)
  },

  /**
   * 거래 수정
   */
  update: (id: string, input: TransactionUpdateInput): Promise<Transaction> => {
    return apiClient.put<Transaction>(`/api/transactions/${id}`, input)
  },

  /**
   * 거래 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/transactions/${id}`)
  },
}

