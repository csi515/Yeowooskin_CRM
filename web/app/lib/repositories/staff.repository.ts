/**
 * 직원 Repository
 */

import { BaseRepository } from './base.repository'
import type { Staff, StaffCreateInput, StaffUpdateInput } from '@/types/entities'

export class StaffRepository extends BaseRepository<Staff> {
  constructor(userId: string) {
    super(userId, 'staff')
  }

  protected getSearchFields(): string[] {
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

    const payload: any = {
      name,
      phone: input.phone || null,
      email: input.email || null,
      role: input.role || null,
      active: input.active !== false,
    }
    
    // notes는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    const notesValue = input.notes
    if (notesValue !== undefined && notesValue !== null && notesValue !== '' && String(notesValue).trim() !== '') {
      payload.notes = String(notesValue).trim()
    }
    if (payload.notes === undefined || payload.notes === null || payload.notes === '' || String(payload.notes).trim() === '') {
      delete payload.notes
    }
    
    return this.create(payload as Staff)
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
    // notes는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const notesValue = input.notes
    if (notesValue !== undefined && notesValue !== null && notesValue !== '' && String(notesValue).trim() !== '') {
      payload.notes = String(notesValue).trim()
    }
    if (payload.notes === undefined || payload.notes === null || payload.notes === '' || String(payload.notes).trim() === '') {
      delete payload.notes
    }
    if (input.active !== undefined) payload.active = input.active

    return this.update(id, payload)
  }
}

