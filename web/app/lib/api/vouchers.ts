/**
 * 바우처 관련 API 메서드
 */

import { apiClient } from './client'
import type {
  Voucher,
  VoucherCreateInput,
  VoucherUseInput,
  VoucherUseResult,
} from '@/app/lib/repositories/vouchers.repository'

export const vouchersApi = {
  /**
   * 고객별 바우처 조회
   */
  listByCustomer: (customerId: string): Promise<Voucher[]> => {
    return apiClient.get<Voucher[]>(`/api/customers/${customerId}/vouchers`)
  },

  /**
   * 바우처 생성
   */
  create: (customerId: string, input: Omit<VoucherCreateInput, 'customer_id'>): Promise<Voucher> => {
    return apiClient.post<Voucher>(`/api/customers/${customerId}/vouchers`, input)
  },

  /**
   * 바우처 사용
   */
  use: (voucherId: string, input: VoucherUseInput): Promise<VoucherUseResult> => {
    return apiClient.post<VoucherUseResult>(`/api/vouchers/${voucherId}/use`, input)
  },

  /**
   * 바우처 사용 취소
   */
  cancelUse: (voucherId: string, useId: string): Promise<{ ok: boolean; remaining_amount: number }> => {
    return apiClient.delete<{ ok: boolean; remaining_amount: number }>(`/api/vouchers/${voucherId}/use/${useId}`)
  },
}

