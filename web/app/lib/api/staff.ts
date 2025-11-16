/**
 * 직원 관련 API 메서드
 */

import { apiClient } from './client'
import type { Staff, StaffCreateInput, StaffUpdateInput } from '@/types/entities'
import type { StaffListQuery } from '@/types/api'

export const staffApi = {
  /**
   * 직원 목록 조회
   */
  list: (query?: StaffListQuery): Promise<Staff[]> => {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    if (query?.search) params.set('search', query.search)
    const queryString = params.toString()
    return apiClient.get<Staff[]>(`/api/staff${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 직원 상세 조회
   */
  get: (id: string): Promise<Staff> => {
    return apiClient.get<Staff>(`/api/staff/${id}`)
  },

  /**
   * 직원 생성
   */
  create: (input: StaffCreateInput): Promise<Staff> => {
    return apiClient.post<Staff>('/api/staff', input)
  },

  /**
   * 직원 수정
   */
  update: (id: string, input: StaffUpdateInput): Promise<Staff> => {
    return apiClient.put<Staff>(`/api/staff/${id}`, input)
  },

  /**
   * 직원 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/staff/${id}`)
  },
}

