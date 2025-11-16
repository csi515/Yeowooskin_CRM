/**
 * 예약 관련 API 메서드
 */

import { apiClient } from './client'
import type { Appointment, AppointmentCreateInput, AppointmentUpdateInput } from '@/types/entities'
import type { AppointmentsListQuery } from '@/types/api'

export const appointmentsApi = {
  /**
   * 예약 목록 조회
   */
  list: (query?: AppointmentsListQuery): Promise<Appointment[]> => {
    const params = new URLSearchParams()
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    if (query?.from) params.set('from', query.from)
    if (query?.to) params.set('to', query.to)
    const queryString = params.toString()
    return apiClient.get<Appointment[]>(`/api/appointments${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 예약 상세 조회
   */
  get: (id: string): Promise<Appointment> => {
    return apiClient.get<Appointment>(`/api/appointments/${id}`)
  },

  /**
   * 예약 생성
   */
  create: (input: AppointmentCreateInput): Promise<Appointment> => {
    return apiClient.post<Appointment>('/api/appointments', input)
  },

  /**
   * 예약 수정
   */
  update: (id: string, input: AppointmentUpdateInput): Promise<Appointment> => {
    return apiClient.put<Appointment>(`/api/appointments/${id}`, input)
  },

  /**
   * 예약 삭제
   */
  delete: (id: string): Promise<{ ok: boolean }> => {
    return apiClient.delete<{ ok: boolean }>(`/api/appointments/${id}`)
  },
}

