/**
 * 예약 Repository
 */

import { BaseRepository } from './base.repository'
import type { Appointment, AppointmentCreateInput, AppointmentUpdateInput } from '@/types/entities'
import type { QueryOptions } from './base.repository'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ApiError } from '../api/errors'

export class AppointmentsRepository extends BaseRepository<Appointment> {
  constructor(userId: string) {
    super(userId, 'appointments')
  }

  /**
   * 날짜 범위로 예약 조회
   */
  async findAll(options: QueryOptions & { from?: string; to?: string } = {}): Promise<Appointment[]> {
    const {
      limit = 200,
      offset = 0,
      from,
      to,
      orderBy = 'appointment_date',
      ascending = true,
    } = options

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('owner_id', this.userId)
      .order(orderBy, { ascending })

    if (from) {
      query = query.gte('appointment_date', from)
    }
    if (to) {
      query = query.lt('appointment_date', to)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return (data || []) as Appointment[]
  }

  /**
   * 예약 생성
   */
  async createAppointment(input: AppointmentCreateInput): Promise<Appointment> {
    const payload: any = {
      customer_id: input.customer_id || null,
      appointment_date: input.appointment_date,
      status: input.status || null,
    }
    
    // staff_id가 명시적으로 제공된 경우에만 포함 (스키마에 없을 수 있음)
    if (input.staff_id !== undefined) {
      payload.staff_id = input.staff_id || null
    }
    
    // service_id가 명시적으로 제공된 경우에만 포함 (스키마에 없을 수 있음)
    if ((input as any).service_id !== undefined) {
      payload.service_id = (input as any).service_id || null
    }
    
    // notes는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    const notesValue = input.notes
    if (notesValue !== undefined && notesValue !== null && notesValue !== '' && String(notesValue).trim() !== '') {
      payload.notes = String(notesValue).trim()
    }
    if (payload.notes === undefined || payload.notes === null || payload.notes === '' || String(payload.notes).trim() === '') {
      delete payload.notes
    }
    
    // total_price는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    if (input.total_price !== undefined && input.total_price !== null && !Number.isNaN(Number(input.total_price))) {
      payload.total_price = Number(input.total_price)
    }
    if (payload.total_price === undefined || payload.total_price === null || Number.isNaN(Number(payload.total_price))) {
      delete payload.total_price
    }
    
    return this.create(payload as Appointment)
  }

  /**
   * 예약 업데이트
   */
  async updateAppointment(id: string, input: AppointmentUpdateInput): Promise<Appointment> {
    const payload: Partial<Appointment> = {}

    if (input.customer_id !== undefined) payload.customer_id = input.customer_id || null
    if (input.staff_id !== undefined) payload.staff_id = input.staff_id || undefined
    if (input.appointment_date !== undefined) payload.appointment_date = input.appointment_date
    if (input.status !== undefined) payload.status = input.status || undefined
    
    // service_id가 명시적으로 제공된 경우에만 업데이트 (스키마에 없을 수 있음)
    if ((input as any).service_id !== undefined) {
      (payload as any).service_id = (input as any).service_id || null
    }
    
    // notes는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const notesValue = input.notes
    if (notesValue !== undefined && notesValue !== null && notesValue !== '' && String(notesValue).trim() !== '') {
      payload.notes = String(notesValue).trim()
    }
    if (payload.notes === undefined || payload.notes === null || payload.notes === '' || String(payload.notes).trim() === '') {
      delete payload.notes
    }
    
    // total_price는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    if (input.total_price !== undefined && input.total_price !== null && !Number.isNaN(Number(input.total_price))) {
      payload.total_price = Number(input.total_price)
    }
    if (payload.total_price === undefined || payload.total_price === null || Number.isNaN(Number(payload.total_price))) {
      delete payload.total_price
    }

    return this.update(id, payload)
  }
}

