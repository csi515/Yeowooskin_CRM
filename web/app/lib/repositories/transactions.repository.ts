/**
 * 거래 Repository
 */

import { BaseRepository } from './base.repository'
import type { Transaction, TransactionCreateInput, TransactionUpdateInput } from '@/types/entities'
import type { QueryOptions } from './base.repository'

export class TransactionsRepository extends BaseRepository<Transaction> {
  constructor(userId: string) {
    super(userId, 'transactions')
  }

  /**
   * 고객별 거래 조회
   */
  override async findAll(options: QueryOptions & { customer_id?: string } = {}): Promise<Transaction[]> {
    const {
      limit = 50,
      offset = 0,
      customer_id,
      orderBy = 'transaction_date',
      ascending = false,
    } = options

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('owner_id', this.userId)
      .order(orderBy, { ascending })

    if (customer_id) {
      query = query.eq('customer_id', customer_id)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      this.handleSupabaseError(error)
    }

    return (data || []) as Transaction[]
  }

  /**
   * 거래 생성
   */
  async createTransaction(input: TransactionCreateInput): Promise<Transaction> {
    const payload: Partial<Transaction> = {
      customer_id: input.customer_id || null,
      amount: input.amount,
      transaction_date: input.transaction_date || new Date().toISOString(),
    }

    if (input.type !== undefined) {
      const typeValue = String(input.type).trim()
      if (typeValue) {
        payload['type'] = typeValue
      }
    }

    // appointment_id가 명시적으로 제공된 경우에만 포함
    if (input.appointment_id !== undefined) {
      payload.appointment_id = input.appointment_id || null
    }

    // payment_method는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    const paymentMethodValue = input.payment_method
    if (paymentMethodValue !== undefined) {
      if (paymentMethodValue === null) {
        payload['payment_method'] = null
      } else {
        const trimmed = String(paymentMethodValue).trim()
        payload['payment_method'] = trimmed ? trimmed : null
      }
    }

    // notes는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    // undefined, null, 빈 문자열, 공백만 있는 경우 제외
    const notesValue = input.notes
    if (notesValue !== undefined) {
      if (notesValue === null) {
        payload['notes'] = null
      } else {
        const trimmed = String(notesValue).trim()
        payload['notes'] = trimmed ? trimmed : null
      }
    }

    return this.create(payload)
  }

  /**
   * 거래 업데이트
   */
  async updateTransaction(id: string, input: TransactionUpdateInput): Promise<Transaction> {
    const payload: Partial<Transaction> = {}

    // appointment_id는 명시적으로 제공된 경우에만 업데이트
    if (input.appointment_id !== undefined) {
      payload.appointment_id = input.appointment_id || null
    }
    if (input.customer_id !== undefined) {
      const customerId = input.customer_id
      payload.customer_id = customerId === null || customerId === '' ? null : customerId
    }
    if (input.type !== undefined) {
      const typeValue = String(input.type).trim()
      if (typeValue) {
        payload['type'] = typeValue
      } else {
        delete payload['type']
      }
    }
    if (input.amount !== undefined) payload.amount = input.amount
    // payment_method는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const paymentMethodValue = input.payment_method
    if (paymentMethodValue !== undefined) {
      if (paymentMethodValue === null) {
        payload['payment_method'] = null
      } else {
        const trimmed = String(paymentMethodValue).trim()
        payload['payment_method'] = trimmed ? trimmed : null
      }
    }
    if (input.transaction_date !== undefined) {
      payload.transaction_date = input.transaction_date
    }
    // notes는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const notesValue = input.notes
    if (notesValue !== undefined) {
      if (notesValue === null) {
        payload['notes'] = null
      } else {
        const trimmed = String(notesValue).trim()
        payload['notes'] = trimmed ? trimmed : null
      }
    }

    return this.update(id, payload)
  }
}

