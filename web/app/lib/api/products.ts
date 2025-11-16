/**
 * 상품 관련 API 메서드
 */

import { apiClient } from './client'
import type { Product, ProductCreateInput, ProductUpdateInput } from '@/types/entities'
import type { ProductsListQuery } from '@/types/api'

export const productsApi = {
  /**
   * 상품 목록 조회
   */
  list: (query?: ProductsListQuery): Promise<Product[]> => {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    if (query?.search) params.set('search', query.search)
    const queryString = params.toString()
    return apiClient.get<Product[]>(`/api/products${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 상품 상세 조회
   */
  get: (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/api/products/${id}`)
  },

  /**
   * 상품 생성
   */
  create: (input: ProductCreateInput): Promise<Product> => {
    return apiClient.post<Product>('/api/products', input)
  },

  /**
   * 상품 수정
   */
  update: (id: string, input: ProductUpdateInput): Promise<Product> => {
    return apiClient.put<Product>(`/api/products/${id}`, input)
  },

  /**
   * 상품 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/products/${id}`)
  },
}

