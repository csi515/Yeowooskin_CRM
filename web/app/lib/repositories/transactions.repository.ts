/**
 * 거래 Repository
 */

import { BaseRepository } from './base.repository'
import type { Transaction, TransactionCreateInput, TransactionUpdateInput } from '@/types/entities'
import type { QueryOptions } from './base.repository'
import { ApiError } from '../api/errors'

export class TransactionsRepository extends BaseRepository<Transaction> {
  constructor(userId: string) {
    super(userId, 'transactions')
  }

  /**
   * 고객별 거래 조회
   */
  async findAll(options: QueryOptions & { customer_id?: string } = {}): Promise<Transaction[]> {
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
      throw new ApiError(error.message, 500)
    }

    return (data || []) as Transaction[]
  }

  /**
   * 거래 생성
   */
  async createTransaction(input: TransactionCreateInput): Promise<Transaction> {
    const payload: any = {
      customer_id: input.customer_id || null,
      type: input.type || null,
      amount: input.amount,
      transaction_date: input.transaction_date || new Date().toISOString(),
    }
    
    // appointment_id가 명시적으로 제공된 경우에만 포함
    if (input.appointment_id !== undefined) {
      payload.appointment_id = input.appointment_id || null
    }
    
    // payment_method는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    const paymentMethodValue = input.payment_method
    if (paymentMethodValue !== undefined && paymentMethodValue !== null && paymentMethodValue !== '' && String(paymentMethodValue).trim() !== '') {
      payload.payment_method = String(paymentMethodValue).trim()
    }
    if (payload.payment_method === undefined || payload.payment_method === null || payload.payment_method === '' || String(payload.payment_method).trim() === '') {
      delete payload.payment_method
    }
    
    // notes는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    // undefined, null, 빈 문자열, 공백만 있는 경우 제외
    const notesValue = input.notes
    if (notesValue !== undefined && notesValue !== null && notesValue !== '' && String(notesValue).trim() !== '') {
      payload.notes = String(notesValue).trim()
    }
    // notes가 없거나 빈 값이면 payload에 포함하지 않음 (속성 자체를 추가하지 않음)
    
    // notes 속성이 빈 값이면 명시적으로 제거
    if (payload.notes === undefined || payload.notes === null || payload.notes === '' || String(payload.notes).trim() === '') {
      delete payload.notes
    }
    
    return this.create(payload as Transaction)
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
    if (input.customer_id !== undefined) payload.customer_id = input.customer_id || undefined
    if (input.type !== undefined) payload.type = input.type || undefined
    if (input.amount !== undefined) payload.amount = input.amount
    // payment_method는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const paymentMethodValue = input.payment_method
    if (paymentMethodValue !== undefined && paymentMethodValue !== null && paymentMethodValue !== '' && String(paymentMethodValue).trim() !== '') {
      payload.payment_method = String(paymentMethodValue).trim()
    }
    if (payload.payment_method === undefined || payload.payment_method === null || payload.payment_method === '' || String(payload.payment_method).trim() === '') {
      delete payload.payment_method
    }
    if (input.transaction_date !== undefined) payload.transaction_date = input.transaction_date || undefined
    // notes는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const notesValue = input.notes
    if (notesValue !== undefined && notesValue !== null && notesValue !== '' && String(notesValue).trim() !== '') {
      payload.notes = String(notesValue).trim()
    }
    // notes가 없거나 빈 값이면 payload에 포함하지 않음
    if (payload.notes === undefined || payload.notes === null || payload.notes === '' || String(payload.notes).trim() === '') {
      delete payload.notes
    }

    return this.update(id, payload)
  }
}

