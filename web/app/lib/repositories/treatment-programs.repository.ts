/**
 * 시술 프로그램 Repository
 */

import { BaseRepository } from './base.repository'
import type { TreatmentProgram, TreatmentProgramCreateInput, TreatmentProgramUpdateInput } from '@/types/entities'
import type { QueryOptions } from './base.repository'

export class TreatmentProgramsRepository extends BaseRepository<TreatmentProgram> {
  constructor(userId: string) {
    super(userId, 'treatment_programs')
  }

  protected override getSearchFields(): string[] {
    return ['program_name', 'notes']
  }

  /**
   * 고객별 시술 프로그램 조회
   */
  async findByCustomerId(customerId: string, options: QueryOptions = {}): Promise<TreatmentProgram[]> {
    const { limit = 50, offset = 0, orderBy = 'started_at', ascending = false } = options

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('customer_id', customerId)
      .eq('owner_id', this.userId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`시술 프로그램 조회 실패: ${error.message}`)
    }

    return (data || []) as TreatmentProgram[]
  }

  /**
   * 시술 프로그램 생성
   */
  async createTreatmentProgram(input: TreatmentProgramCreateInput): Promise<TreatmentProgram> {
    const payload: Partial<TreatmentProgram> = {
      ...input,
      owner_id: this.userId,
      completed_sessions: 0,
      started_at: new Date().toISOString(),
    }

    return this.create(payload as TreatmentProgram)
  }

  /**
   * 시술 프로그램 수정
   */
  async updateTreatmentProgram(id: string, input: TreatmentProgramUpdateInput): Promise<TreatmentProgram> {
    return this.update(id, input)
  }

  /**
   * 시술 프로그램 세션 완료 처리
   */
  async completeSession(programId: string, sessionNumber: number, treatmentRecordId?: string, appointmentId?: string): Promise<void> {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = createSupabaseServerClient()

    // 세션 기록 추가
    await supabase.from('treatment_program_sessions').insert({
      program_id: programId,
      treatment_record_id: treatmentRecordId || null,
      appointment_id: appointmentId || null,
      session_number: sessionNumber,
    })

    // 프로그램 진행도 업데이트
    const { data: program } = await this.findById(programId)
    if (!program) throw new Error('프로그램을 찾을 수 없습니다.')

    const newCompletedSessions = (program.completed_sessions || 0) + 1
    const isCompleted = newCompletedSessions >= program.total_sessions

    await this.update(programId, {
      completed_sessions: newCompletedSessions,
      completed_at: isCompleted ? new Date().toISOString() : null,
    } as Partial<TreatmentProgram>)
  }
}

