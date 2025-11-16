/**
 * 관리자 관련 API 메서드
 */

import { apiClient } from './client'

export interface ApproveUserInput {
  userId: string
  approved: boolean
}

export const adminApi = {
  /**
   * 사용자 승인
   */
  async approveUser(input: ApproveUserInput): Promise<{ ok: boolean }> {
    return apiClient.post<{ ok: boolean }>('/api/approve-user', input)
  },
}

