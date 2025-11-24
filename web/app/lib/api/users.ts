/**
 * 사용자 관리 관련 API 메서드
 */

import { apiClient } from './client'
import type { Profile } from '@/types/entities'

export interface UserListQuery {
  search?: string
  limit?: number
  offset?: number
}

export interface UserListResponse {
  users: (Profile & {
    branches?: {
      id: string
      name: string
      code: string
    } | null
  })[]
  total: number
}

export interface UserUpdateInput {
  role?: 'HQ' | 'OWNER' | 'STAFF'
  branch_id?: string | null
  approved?: boolean
}

export const usersApi = {
  /**
   * 사용자 목록 조회
   */
  list: (query?: UserListQuery): Promise<UserListResponse> => {
    const params = new URLSearchParams()
    if (query?.search) params.set('search', query.search)
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    const queryString = params.toString()
    return apiClient.get<UserListResponse>(`/api/users${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 사용자 정보 수정
   */
  update: (id: string, input: UserUpdateInput): Promise<Profile> => {
    return apiClient.put<Profile>(`/api/users/${id}`, input)
  },

  /**
   * 사용자 삭제 (비활성화)
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/users/${id}`)
  },

  /**
   * 사용자 역할 변경 (HQ 전용)
   */
  updateRole: (id: string, role: 'HQ' | 'OWNER' | 'STAFF', branchId?: string | null): Promise<{ ok: boolean }> => {
    return apiClient.put<{ ok: boolean }>(`/api/admin/users/${id}/role`, { role, branchId })
  },
}

