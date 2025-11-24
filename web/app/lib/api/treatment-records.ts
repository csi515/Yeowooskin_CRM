/**
 * 시술 기록 관련 API 메서드
 */

import { apiClient } from './client'
import type { TreatmentRecord, TreatmentRecordCreateInput, TreatmentRecordUpdateInput } from '@/types/entities'

export const treatmentRecordsApi = {
  /**
   * 시술 기록 목록 조회
   */
  list: (customerId?: string): Promise<TreatmentRecord[]> => {
    const params = customerId ? `?customer_id=${customerId}` : ''
    return apiClient.get<TreatmentRecord[]>(`/api/treatment-records${params}`)
  },

  /**
   * 시술 기록 상세 조회
   */
  get: (id: string): Promise<TreatmentRecord> => {
    return apiClient.get<TreatmentRecord>(`/api/treatment-records/${id}`)
  },

  /**
   * 시술 기록 생성
   */
  create: (input: TreatmentRecordCreateInput): Promise<TreatmentRecord> => {
    return apiClient.post<TreatmentRecord>('/api/treatment-records', input)
  },

  /**
   * 시술 기록 수정
   */
  update: (id: string, input: TreatmentRecordUpdateInput): Promise<TreatmentRecord> => {
    return apiClient.put<TreatmentRecord>(`/api/treatment-records/${id}`, input)
  },

  /**
   * 시술 기록 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/treatment-records/${id}`)
  },
}

