/**
 * 고객 상품 관련 API 메서드
 */

import { apiClient } from './client'
import type {
  CustomerProduct,
  CustomerProductCreateInput,
  CustomerProductUpdateInput,
  CustomerProductLedger,
} from '@/app/lib/repositories/customer-products.repository'
import type { PaginationParams } from '@/types/common'

export const customerProductsApi = {
  /**
   * 고객별 상품 보유 내역 조회
   */
  list: (customerId: string): Promise<CustomerProduct[]> => {
    return apiClient.get<CustomerProduct[]>(`/api/customer-products?customer_id=${customerId}`)
  },

  /**
   * 상품 보유 내역 생성
   */
  create: (input: CustomerProductCreateInput): Promise<CustomerProduct> => {
    return apiClient.post<CustomerProduct>('/api/customer-products', input)
  },

  /**
   * 상품 보유 내역 수정
   */
  update: (id: string, input: CustomerProductUpdateInput): Promise<CustomerProduct> => {
    return apiClient.put<CustomerProduct>(`/api/customer-products/${id}`, input)
  },

  /**
   * 상품 보유 내역 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/customer-products/${id}`)
  },

  /**
   * 상품 보유 내역의 ledger 조회
   */
  getLedger: (id: string, query?: PaginationParams): Promise<CustomerProductLedger[]> => {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    const queryString = params.toString()
    return apiClient.get<CustomerProductLedger[]>(
      `/api/customer-products/${id}/ledger${queryString ? `?${queryString}` : ''}`
    )
  },

  /**
   * 상품 보유 내역의 ledger 항목 추가
   */
  addLedgerEntry: (id: string, delta: number, reason?: string): Promise<{ ok: boolean }> => {
    return apiClient.post<{ ok: boolean }>(`/api/customer-products/${id}/ledger`, { delta, reason })
  },

  /**
   * 상품 보유 내역의 ledger 항목 업데이트
   */
  updateLedgerEntry: (
    id: string,
    replaceFrom?: string,
    replaceTo?: string,
    deltaOverride?: number
  ): Promise<{ ok: boolean }> => {
    return apiClient.put<{ ok: boolean }>(`/api/customer-products/${id}/ledger`, {
      replace_from: replaceFrom,
      replace_to: replaceTo,
      delta_override: deltaOverride,
    })
  },

  /**
   * 고객별 전체 ledger 조회
   */
  getCustomerLedger: (customerId: string, query?: PaginationParams): Promise<CustomerProductLedger[]> => {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    const queryString = params.toString()
    return apiClient.get<CustomerProductLedger[]>(
      `/api/customers/${customerId}/holdings/ledger${queryString ? `?${queryString}` : ''}`
    )
  },
}

