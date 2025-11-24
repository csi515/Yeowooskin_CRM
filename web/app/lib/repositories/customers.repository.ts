/**
 * 고객 Repository
 */

import { BaseRepository } from './base.repository'
import type { Customer, CustomerCreateInput, CustomerUpdateInput } from '@/types/entities'

export class CustomersRepository extends BaseRepository<Customer> {
  constructor(userId: string) {
    super(userId, 'customers')
  }

  protected override getSearchFields(): string[] {
    return ['name', 'email', 'phone']
  }

  /**
   * 고객 생성
   */
  async createCustomer(input: CustomerCreateInput): Promise<Customer> {
    const name = String(input.name || '').trim()
    if (!name) {
      throw new Error('name required')
    }

    const payload: Partial<Customer> = {
      name,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
    }
    
    // features는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    const featuresValue = input.features
    if (featuresValue !== undefined) {
      if (featuresValue === null) {
        payload.features = null
      } else {
        const trimmed = String(featuresValue).trim()
        payload.features = trimmed ? trimmed : null
      }
    }

    // 건강 정보 필드 추가
    if (input.health_allergies !== undefined) payload.health_allergies = input.health_allergies || null
    if (input.health_medications !== undefined) payload.health_medications = input.health_medications || null
    if (input.health_skin_conditions !== undefined) payload.health_skin_conditions = input.health_skin_conditions || null
    if (input.health_pregnant !== undefined) payload.health_pregnant = input.health_pregnant || null
    if (input.health_breastfeeding !== undefined) payload.health_breastfeeding = input.health_breastfeeding || null
    if (input.health_notes !== undefined) payload.health_notes = input.health_notes || null
    if (input.skin_type !== undefined) payload.skin_type = input.skin_type || null
    if (input.skin_concerns !== undefined) payload.skin_concerns = input.skin_concerns || null
    if (input.birthdate !== undefined) payload.birthdate = input.birthdate || null
    if (input.recommended_visit_interval_days !== undefined) payload.recommended_visit_interval_days = input.recommended_visit_interval_days || null
    
    return this.create(payload)
  }

  /**
   * 고객 업데이트
   */
  async updateCustomer(id: string, input: CustomerUpdateInput): Promise<Customer> {
    const payload: Partial<Customer> = {}
    
    if (input.name !== undefined) {
      const name = String(input.name).trim()
      if (!name) {
        throw new Error('name cannot be empty')
      }
      payload.name = name
    }
    
    if (input.phone !== undefined) payload.phone = input.phone || null
    if (input.email !== undefined) payload.email = input.email || null
    if (input.address !== undefined) payload.address = input.address || null
    // features는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const featuresValue = input.features
    if (featuresValue !== undefined) {
      if (featuresValue === null) {
        payload.features = null
      } else {
        const trimmed = String(featuresValue).trim()
        payload.features = trimmed ? trimmed : null
      }
    }

    // 건강 정보 필드 업데이트
    if (input.health_allergies !== undefined) payload.health_allergies = input.health_allergies || null
    if (input.health_medications !== undefined) payload.health_medications = input.health_medications || null
    if (input.health_skin_conditions !== undefined) payload.health_skin_conditions = input.health_skin_conditions || null
    if (input.health_pregnant !== undefined) payload.health_pregnant = input.health_pregnant || null
    if (input.health_breastfeeding !== undefined) payload.health_breastfeeding = input.health_breastfeeding || null
    if (input.health_notes !== undefined) payload.health_notes = input.health_notes || null
    if (input.skin_type !== undefined) payload.skin_type = input.skin_type || null
    if (input.skin_concerns !== undefined) payload.skin_concerns = input.skin_concerns || null
    if (input.birthdate !== undefined) payload.birthdate = input.birthdate || null
    if (input.recommended_visit_interval_days !== undefined) payload.recommended_visit_interval_days = input.recommended_visit_interval_days || null

    return this.update(id, payload)
  }
}

