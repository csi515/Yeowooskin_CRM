/**
 * 시술 프로그램 관련 API 메서드
 */

import { apiClient } from './client'
import type { TreatmentProgram, TreatmentProgramCreateInput, TreatmentProgramUpdateInput } from '@/types/entities'

export const treatmentProgramsApi = {
  /**
   * 시술 프로그램 목록 조회
   */
  list: (customerId?: string): Promise<TreatmentProgram[]> => {
    const params = customerId ? `?customer_id=${customerId}` : ''
    return apiClient.get<TreatmentProgram[]>(`/api/treatment-programs${params}`)
  },

  /**
   * 시술 프로그램 상세 조회
   */
  get: (id: string): Promise<TreatmentProgram> => {
    return apiClient.get<TreatmentProgram>(`/api/treatment-programs/${id}`)
  },

  /**
   * 시술 프로그램 생성
   */
  create: (input: TreatmentProgramCreateInput): Promise<TreatmentProgram> => {
    return apiClient.post<TreatmentProgram>('/api/treatment-programs', input)
  },

  /**
   * 시술 프로그램 수정
   */
  update: (id: string, input: TreatmentProgramUpdateInput): Promise<TreatmentProgram> => {
    return apiClient.put<TreatmentProgram>(`/api/treatment-programs/${id}`, input)
  },

  /**
   * 시술 프로그램 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/treatment-programs/${id}`)
  },

  /**
   * 시술 프로그램 세션 완료
   */
  completeSession: (
    programId: string,
    sessionNumber: number,
    treatmentRecordId?: string,
    appointmentId?: string
  ): Promise<{ ok: boolean }> => {
    return apiClient.post<{ ok: boolean }>(`/api/treatment-programs/${programId}/complete-session`, {
      session_number: sessionNumber,
      treatment_record_id: treatmentRecordId,
      appointment_id: appointmentId,
    })
  },
}

