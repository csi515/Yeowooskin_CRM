/**
 * 초대 관련 API 메서드
 */

import { apiClient } from './client'
import type { Invitation } from '@/types/entities'

export const invitationsApi = {
  /**
   * 초대 목록 조회
   */
  list: (): Promise<Invitation[]> => {
    return apiClient.get<Invitation[]>('/api/invitations')
  },

  /**
   * 초대 생성
   */
  create: (input: { email: string; role: 'OWNER' | 'STAFF'; branch_id?: string }): Promise<{ invitation: Invitation; message: string }> => {
    return apiClient.post<{ invitation: Invitation; message: string }>('/api/invitations', input)
  },

  /**
   * 초대 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/invitations/${id}`)
  },
}

