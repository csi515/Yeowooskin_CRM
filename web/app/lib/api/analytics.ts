/**
 * 통계 및 분석 관련 API 메서드
 */

import { apiClient } from './client'

export interface BranchStat {
  branch_id: string
  branch_name: string
  branch_code: string
  revenue: number
  customer_count: number
  appointment_count: number
  new_customer_count: number
}

export interface AnalyticsQuery {
  from?: string
  to?: string
}

export const analyticsApi = {
  /**
   * 지점별 통계 조회
   */
  getBranchStats: (query?: AnalyticsQuery): Promise<BranchStat[]> => {
    const params = new URLSearchParams()
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const queryString = params.toString()
    return apiClient.get<BranchStat[]>(`/api/analytics/branch-stats${queryString ? `?${queryString}` : ''}`)
  },
}

