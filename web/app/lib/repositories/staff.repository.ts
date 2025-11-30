/**
 * 직원 Repository
 */

import { BaseRepository } from './base.repository'
import type { Staff, StaffCreateInput, StaffUpdateInput } from '@/types/entities'

export class StaffRepository extends BaseRepository<Staff> {
  constructor(userId: string, supabase: any) {
    super(userId, 'staff', supabase)
  }

  protected override getSearchFields(): string[] {
    return ['name', 'email', 'phone', 'role']
  }

  /**
   * 직원 생성
   */
  async createStaff(input: StaffCreateInput): Promise<Staff> {
    const name = String(input.name || '').trim()
    if (!name) {
      throw new Error('name required')
    }

    const payload: Record<string, unknown> = {
      name,
      phone: input.phone || null,
      email: input.email || null,
      role: input.role || null,
      active: input.active !== false,
    }

    // notes 필드는 데이터베이스에 컬럼이 없으므로 제외
    // const notesValue = input.notes
    // if (notesValue !== undefined && notesValue !== null && notesValue !== '' && String(notesValue).trim() !== '') {
    //   payload['notes'] = String(notesValue).trim()
    // }

    return this.create(payload as unknown as Staff)
  }

  /**
   * 직원 업데이트
   */
  async updateStaff(id: string, input: StaffUpdateInput): Promise<Staff> {
    const payload: Partial<Staff> = {}

    if (input.name !== undefined) {
      const name = String(input.name).trim()
      if (!name) {
        throw new Error('name cannot be empty')
      }
      payload.name = name
    }

    if (input.phone !== undefined) payload.phone = input.phone || null
    if (input.email !== undefined) payload.email = input.email || null
    if (input.role !== undefined) payload.role = input.role || null
    // notes 필드는 데이터베이스에 컬럼이 없으므로 제외
    // const notesValue = input.notes
    // if (notesValue !== undefined && notesValue !== null && notesValue !== '' && String(notesValue).trim() !== '') {
    //   payload['notes'] = String(notesValue).trim()
    // }
    if (input.active !== undefined) payload.active = input.active

    return this.update(id, payload)
  }
}

