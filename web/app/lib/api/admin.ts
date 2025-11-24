/**
 * 관리자 관련 API 메서드
 */

import { apiClient } from './client'

export interface ApproveUserInput {
  userId: string
  approved: boolean
}

export interface BatchApproveUsersInput {
  userIds: string[]
  approved: boolean
}

export const adminApi = {
  /**
   * 사용자 승인
   */
  async approveUser(input: ApproveUserInput): Promise<{ ok: boolean }> {
    return apiClient.post<{ ok: boolean }>('/api/approve-user', input)
  },

  /**
   * 일괄 승인/거절
   */
  async batchApproveUsers(input: BatchApproveUsersInput): Promise<{ ok: boolean; count: number }> {
    return apiClient.post<{ ok: boolean; count: number }>('/api/approve-users-batch', input)
  },
}

