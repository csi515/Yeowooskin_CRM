/**
 * 포인트 관련 API 메서드
 */

import { apiClient } from './client'
import type {
  PointsBalance,
  PointsLedgerCreateInput,
  PointsReport,
} from '@/app/lib/repositories/points.repository'
import type { PaginationParams, DateRangeParams } from '@/types/common'

export const pointsApi = {
  /**
   * 고객의 포인트 잔액 및 ledger 조회
   */
  getBalance: (
    customerId: string,
    options?: PaginationParams & DateRangeParams & { withLedger?: boolean }
  ): Promise<PointsBalance> => {
    const params = new URLSearchParams()
    if (options?.limit) params.set('limit', String(options.limit))
    if (options?.offset) params.set('offset', String(options.offset))
    if (options?.from) params.set('from', options.from)
    if (options?.to) params.set('to', options.to)
    if (options?.withLedger !== undefined) params.set('with_ledger', String(options.withLedger))
    const queryString = params.toString()
    return apiClient.get<PointsBalance>(`/api/customers/${customerId}/points${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 포인트 ledger 항목 추가
   */
  addLedgerEntry: (customerId: string, input: PointsLedgerCreateInput): Promise<{ ok: boolean; balance: number }> => {
    return apiClient.post<{ ok: boolean; balance: number }>(`/api/customers/${customerId}/points`, input)
  },

  /**
   * 포인트 리포트 생성
   */
  getReport: (customerId: string, from?: string, to?: string): Promise<PointsReport> => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const queryString = params.toString()
    return apiClient.get<PointsReport>(`/api/customers/${customerId}/points/report${queryString ? `?${queryString}` : ''}`)
  },
}

