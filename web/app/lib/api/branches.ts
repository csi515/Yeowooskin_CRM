/**
 * 지점 관련 API 메서드
 */

import { apiClient } from './client'
import type { Branch, BranchCreateInput, BranchUpdateInput } from '@/types/entities'
import type { PaginationParams, SearchParams } from '@/types/common'

export interface BranchListQuery extends PaginationParams, Partial<SearchParams> {}

export const branchApi = {
  /**
   * 지점 목록 조회
   */
  list: (query?: BranchListQuery): Promise<Branch[]> => {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    if (query?.search) params.set('search', query.search)
    const queryString = params.toString()
    return apiClient.get<Branch[]>(`/api/branches${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 지점 상세 조회
   */
  get: (id: string): Promise<Branch> => {
    return apiClient.get<Branch>(`/api/branches/${id}`)
  },

  /**
   * 지점 생성
   */
  create: (input: BranchCreateInput): Promise<Branch> => {
    return apiClient.post<Branch>('/api/branches', input)
  },

  /**
   * 지점 수정
   */
  update: (id: string, input: BranchUpdateInput): Promise<Branch> => {
    return apiClient.put<Branch>(`/api/branches/${id}`, input)
  },

  /**
   * 지점 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/branches/${id}`)
  },
}

