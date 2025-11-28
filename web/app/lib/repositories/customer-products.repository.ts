/**
 * 고객 상품 보유 내역 Repository
 */

import { BaseRepository } from './base.repository'
import { NotFoundError } from '../api/errors'
import type { QueryOptions } from './base.repository'

export interface CustomerProduct {
  id: string
  owner_id: string
  customer_id: string
  product_id: string
  quantity: number
  notes?: string | null
  created_at?: string
  updated_at?: string
  products?: {
    name: string
  }
}

export interface CustomerProductLedger {
  id: string
  owner_id: string
  customer_id: string
  product_id: string
  customer_product_id: string
  delta: number
  reason?: string | null
  created_at?: string
}

export interface CustomerProductCreateInput {
  customer_id: string
  product_id: string
  quantity: number
  notes?: string | null
  reason?: string
}

export interface CustomerProductUpdateInput {
  quantity?: number
  notes?: string | null
  reason?: string
  no_ledger?: boolean
}

export class CustomerProductsRepository extends BaseRepository<CustomerProduct> {
  constructor(userId: string) {
    super(userId, 'customer_products')
  }

  /**
   * 고객별 상품 보유 내역 조회
   */
  async findByCustomerId(customerId: string): Promise<CustomerProduct[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*, products(name)')
      .eq('owner_id', this.userId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })

    if (error) {
      this.handleSupabaseError(error)
    }

    return (data || []) as CustomerProduct[]
  }

  /**
   * 상품 보유 내역 생성
   */
  async createHolding(input: CustomerProductCreateInput): Promise<CustomerProduct> {
    const { customer_id, product_id, quantity, notes } = input

    if (!customer_id || !product_id) {
      throw new Error('customer_id and product_id required')
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      throw new Error('invalid quantity')
    }

    const payload: Record<string, unknown> = {
      customer_id,
      product_id,
      quantity,
    }

    // notes는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    if (notes !== undefined && notes !== null && notes !== '' && String(notes).trim() !== '') {
      payload['notes'] = String(notes).trim()
    }
    if (payload['notes'] === undefined || payload['notes'] === null || payload['notes'] === '' || String(payload['notes']).trim() === '') {
      delete payload['notes']
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({ ...payload, owner_id: this.userId } as Omit<CustomerProduct, 'id' | 'created_at' | 'updated_at'>)
      .select('*, products(name)')
      .single()

    if (error) {
      this.handleSupabaseError(error)
    }

    // 레저 항목은 자동으로 생성하지 않음 - 사용자가 직접 입력해야 함

    return data as CustomerProduct
  }

  /**
   * 상품 보유 내역 업데이트 (ledger 기록 포함)
   */
  async updateHolding(id: string, input: CustomerProductUpdateInput): Promise<CustomerProduct> {
    // 기존 수량 조회
    const { data: prev, error: findError } = await this.supabase
      .from(this.tableName)
      .select('id, customer_id, product_id, quantity')
      .eq('id', id)
      .eq('owner_id', this.userId)
      .single()

    if (findError || !prev) {
      throw new NotFoundError('holding not found')
    }

    const patch: Record<string, unknown> = {}
    if (typeof input.quantity !== 'undefined') {
      patch['quantity'] = Number(input.quantity)
    }
    // notes는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const notesValue = input.notes
    if (notesValue !== undefined && notesValue !== null && notesValue !== '' && String(notesValue).trim() !== '') {
      patch['notes'] = String(notesValue).trim()
    }
    if (patch['notes'] === undefined || patch['notes'] === null || patch['notes'] === '' || String(patch['notes']).trim() === '') {
      delete patch['notes']
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(patch as Partial<CustomerProduct>)
      .eq('id', id)
      .eq('owner_id', this.userId)
      .select('*, products(name)')
      .single()

    if (error) {
      this.handleSupabaseError(error)
    }

    // ledger 기록 (변경 시)
    if (!input.no_ledger) {
      try {
        const beforeQty = Number(prev.quantity || 0)
        const afterQty = typeof patch['quantity'] !== 'undefined' ? Number(patch['quantity']) : beforeQty
        const delta = afterQty - beforeQty

        if (delta !== 0) {
          await this.supabase.from('customer_product_ledger').insert({
            owner_id: this.userId,
            customer_id: prev.customer_id,
            product_id: prev.product_id,
            customer_product_id: id,
            delta,
            reason: input.reason || 'update',
          })
        }
      } catch {
        // ledger 기록 실패는 무시
      }
    }

    return data as CustomerProduct
  }

  /**
   * 상품 보유 내역의 ledger 조회
   */
  async getLedger(customerProductId: string, options: QueryOptions = {}): Promise<CustomerProductLedger[]> {
    const { limit = 20, offset = 0 } = options

    const { data, error } = await this.supabase
      .from('customer_product_ledger')
      .select('*')
      .eq('owner_id', this.userId)
      .eq('customer_product_id', customerProductId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      this.handleSupabaseError(error)
    }

    return (data || []) as CustomerProductLedger[]
  }

  /**
   * 상품 보유 내역의 ledger 항목 추가
   */
  async addLedgerEntry(customerProductId: string, delta: number, reason: string): Promise<void> {
    // customer_product 정보 조회
    const { data: holding, error: findError } = await this.supabase
      .from(this.tableName)
      .select('id, customer_id, product_id')
      .eq('owner_id', this.userId)
      .eq('id', customerProductId)
      .single()

    if (findError || !holding) {
      throw new NotFoundError('holding not found')
    }

    const { error } = await this.supabase.from('customer_product_ledger').insert({
      owner_id: this.userId,
      customer_id: holding.customer_id,
      product_id: holding.product_id,
      customer_product_id: customerProductId,
      delta,
      reason,
    })

    if (error) {
      this.handleSupabaseError(error)
    }
  }

  /**
   * 상품 보유 내역의 ledger 항목 업데이트
   */
  async updateLedgerEntry(
    customerProductId: string,
    replaceFrom: string,
    replaceTo: string,
    deltaOverride?: number
  ): Promise<void> {
    // replaceFrom이 있으면 해당 텍스트를 포함하는 최신 항목을 찾음
    if (replaceFrom) {
      const { data: matching, error: findError } = await this.supabase
        .from('customer_product_ledger')
        .select('id, reason, delta')
        .eq('owner_id', this.userId)
        .eq('customer_product_id', customerProductId)
        .like('reason', `%${replaceFrom}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (findError || !matching) {
        // 매칭되는 항목이 없으면 조용히 실패 (에러를 던지지 않음)
        return
      }

      const currentReason = (matching.reason || '').toString()
      const newReason = currentReason.replace(replaceFrom, replaceTo)

      const updatePayload: Record<string, unknown> = { reason: newReason }
      if (typeof deltaOverride !== 'undefined' && !Number.isNaN(deltaOverride)) {
        updatePayload['delta'] = deltaOverride
      }

      const { error: updateError } = await this.supabase
        .from('customer_product_ledger')
        .update(updatePayload)
        .eq('id', matching.id)

      if (updateError) {
        this.handleSupabaseError(updateError)
      }
    } else {
      // replaceFrom이 없으면 최신 항목을 업데이트
      const { data: latest, error: findError } = await this.supabase
        .from('customer_product_ledger')
        .select('id, reason, delta')
        .eq('owner_id', this.userId)
        .eq('customer_product_id', customerProductId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (findError || !latest) {
        throw new NotFoundError('ledger not found')
      }

      const updatePayload: Record<string, unknown> = { reason: replaceTo || latest.reason }
      if (typeof deltaOverride !== 'undefined' && !Number.isNaN(deltaOverride)) {
        updatePayload['delta'] = deltaOverride
      }

      const { error: updateError } = await this.supabase
        .from('customer_product_ledger')
        .update(updatePayload)
        .eq('id', latest.id)

      if (updateError) {
        this.handleSupabaseError(updateError)
      }
    }
  }

  /**
   * 고객별 전체 ledger 조회
   */
  async getCustomerLedger(customerId: string, options: QueryOptions = {}): Promise<CustomerProductLedger[]> {
    const { limit = 50, offset = 0 } = options

    const { data, error } = await this.supabase
      .from('customer_product_ledger')
      .select('*')
      .eq('owner_id', this.userId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      this.handleSupabaseError(error)
    }

    return (data || []) as CustomerProductLedger[]
  }
}

