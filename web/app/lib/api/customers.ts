/**
 * 고객 관련 API 메서드
 */

import { apiClient } from './client'
import type { Customer, CustomerCreateInput, CustomerUpdateInput } from '@/types/entities'
import type { CustomersListQuery } from '@/types/api'

export const customersApi = {
  /**
   * 고객 목록 조회
   */
  list: (query?: CustomersListQuery): Promise<Customer[]> => {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    if (query?.search) params.set('search', query.search)
    const queryString = params.toString()
    return apiClient.get<Customer[]>(`/api/customers${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 고객 상세 조회
   */
  get: (id: string): Promise<Customer> => {
    return apiClient.get<Customer>(`/api/customers/${id}`)
  },

  /**
   * 고객 생성
   */
  create: (input: CustomerCreateInput): Promise<Customer> => {
    return apiClient.post<Customer>('/api/customers', input)
  },

  /**
   * 고객 수정
   */
  update: (id: string, input: CustomerUpdateInput): Promise<Customer> => {
    return apiClient.put<Customer>(`/api/customers/${id}`, input)
  },

  /**
   * 고객 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/customers/${id}`)
  },
}

