/**
 * 시술실 Repository
 */

import { BaseRepository } from './base.repository'
import type { TreatmentRoom, TreatmentRoomCreateInput, TreatmentRoomUpdateInput } from '@/types/entities'

export class TreatmentRoomsRepository extends BaseRepository<TreatmentRoom> {
  constructor(userId: string) {
    super(userId, 'treatment_rooms')
  }

  protected override getSearchFields(): string[] {
    return ['name', 'code', 'description']
  }

  /**
   * 활성 시술실만 조회
   */
  async findActive(options: { limit?: number; offset?: number } = {}): Promise<TreatmentRoom[]> {
    const { limit = 100, offset = 0 } = options

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('owner_id', this.userId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`시술실 조회 실패: ${error.message}`)
    }

    return (data || []) as TreatmentRoom[]
  }

  /**
   * 시술실 생성
   */
  async createTreatmentRoom(input: TreatmentRoomCreateInput): Promise<TreatmentRoom> {
    const payload: Partial<TreatmentRoom> = {
      ...input,
      owner_id: this.userId,
      capacity: input.capacity || 1,
      active: input.active !== undefined ? input.active : true,
    }

    return this.create(payload as TreatmentRoom)
  }

  /**
   * 시술실 수정
   */
  async updateTreatmentRoom(id: string, input: TreatmentRoomUpdateInput): Promise<TreatmentRoom> {
    return this.update(id, input)
  }

  /**
   * 시술실 소프트 삭제
   */
  async softDeleteRoom(id: string): Promise<TreatmentRoom> {
    return this.update(id, { deleted_at: new Date().toISOString() } as Partial<TreatmentRoom>)
  }

  /**
   * 시술실 복구
   */
  async restoreRoom(id: string): Promise<TreatmentRoom> {
    return this.update(id, { deleted_at: null } as Partial<TreatmentRoom>)
  }
}

