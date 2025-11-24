/**
 * 시술 기록 Repository
 */

import { BaseRepository } from './base.repository'
import type { TreatmentRecord, TreatmentRecordCreateInput, TreatmentRecordUpdateInput } from '@/types/entities'
import type { QueryOptions } from './base.repository'

export class TreatmentRecordsRepository extends BaseRepository<TreatmentRecord> {
  constructor(userId: string) {
    super(userId, 'treatment_records')
  }

  protected override getSearchFields(): string[] {
    return ['treatment_name', 'treatment_content', 'notes']
  }

  /**
   * 고객별 시술 기록 조회
   */
  async findByCustomerId(customerId: string, options: QueryOptions = {}): Promise<TreatmentRecord[]> {
    const { limit = 50, offset = 0, orderBy = 'treatment_date', ascending = false } = options

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('customer_id', customerId)
      .eq('owner_id', this.userId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`시술 기록 조회 실패: ${error.message}`)
    }

    return (data || []) as TreatmentRecord[]
  }

  /**
   * 시술 기록 생성
   */
  async createTreatmentRecord(input: TreatmentRecordCreateInput): Promise<TreatmentRecord> {
    const payload: Partial<TreatmentRecord> = {
      ...input,
      owner_id: this.userId,
      treatment_date: input.treatment_date || new Date().toISOString(),
    }

    return this.create(payload as TreatmentRecord)
  }

  /**
   * 시술 기록 수정
   */
  async updateTreatmentRecord(id: string, input: TreatmentRecordUpdateInput): Promise<TreatmentRecord> {
    return this.update(id, input)
  }
}

