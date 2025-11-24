/**
 * 시술실 관련 API 메서드
 */

import { apiClient } from './client'
import type { TreatmentRoom, TreatmentRoomCreateInput, TreatmentRoomUpdateInput } from '@/types/entities'

export const treatmentRoomsApi = {
  /**
   * 시술실 목록 조회
   */
  list: (activeOnly?: boolean): Promise<TreatmentRoom[]> => {
    const params = activeOnly ? '?active_only=true' : ''
    return apiClient.get<TreatmentRoom[]>(`/api/treatment-rooms${params}`)
  },

  /**
   * 시술실 상세 조회
   */
  get: (id: string): Promise<TreatmentRoom> => {
    return apiClient.get<TreatmentRoom>(`/api/treatment-rooms/${id}`)
  },

  /**
   * 시술실 생성
   */
  create: (input: TreatmentRoomCreateInput): Promise<TreatmentRoom> => {
    return apiClient.post<TreatmentRoom>('/api/treatment-rooms', input)
  },

  /**
   * 시술실 수정
   */
  update: (id: string, input: TreatmentRoomUpdateInput): Promise<TreatmentRoom> => {
    return apiClient.put<TreatmentRoom>(`/api/treatment-rooms/${id}`, input)
  },

  /**
   * 시술실 삭제 (소프트 삭제)
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/treatment-rooms/${id}`)
  },
}

