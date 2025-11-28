/**
 * 지출 Repository
 */

import { BaseRepository } from './base.repository'
import type { Expense, ExpenseCreateInput, ExpenseUpdateInput } from '@/types/entities'
import type { QueryOptions } from './base.repository'
import { ApiError } from '../api/errors'

export class ExpensesRepository extends BaseRepository<Expense> {
  constructor(userId: string) {
    super(userId, 'expenses')
  }

  /**
   * 날짜 범위로 지출 조회
   */
  override async findAll(options: QueryOptions & { from?: string; to?: string } = {}): Promise<Expense[]> {
    const {
      limit = 50,
      offset = 0,
      from,
      to,
      orderBy = 'expense_date',
      ascending = false,
    } = options

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('owner_id', this.userId)
      .order(orderBy, { ascending })

    if (from) {
      query = query.gte('expense_date', from)
    }
    if (to) {
      query = query.lte('expense_date', to)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return (data || []) as Expense[]
  }

  /**
   * 지출 생성
   */
  async createExpense(input: ExpenseCreateInput): Promise<Expense> {
    const expense_date = input.expense_date
    const amount = Number(input.amount || 0)
    const category = String(input.category || '').trim()

    if (!expense_date) {
      throw new Error('date required')
    }
    if (Number.isNaN(amount) || amount <= 0) {
      throw new Error('invalid amount')
    }
    if (!category) {
      throw new Error('category required')
    }

    const payload: Record<string, unknown> = {
      expense_date,
      amount,
      category,
    }

    // memo는 값이 있을 때만 포함 (스키마에 없을 수 있음)
    const memoValue = input.memo
    if (memoValue !== undefined && memoValue !== null && memoValue !== '' && String(memoValue).trim() !== '') {
      payload['memo'] = String(memoValue).trim()
    }
    if (payload['memo'] === undefined || payload['memo'] === null || payload['memo'] === '' || String(payload['memo']).trim() === '') {
      delete payload['memo']
    }

    return this.create(payload as unknown as Expense)
  }

  /**
   * 지출 업데이트
   */
  async updateExpense(id: string, input: ExpenseUpdateInput): Promise<Expense> {
    const payload: Partial<Expense> = {}

    if (input.expense_date !== undefined) payload.expense_date = input.expense_date
    if (input.amount !== undefined) {
      const amount = Number(input.amount)
      if (Number.isNaN(amount) || amount <= 0) {
        throw new Error('invalid amount')
      }
      payload.amount = amount
    }
    if (input.category !== undefined) {
      const category = String(input.category).trim()
      if (!category) {
        throw new Error('category cannot be empty')
      }
      payload.category = category
    }
    // memo는 값이 있을 때만 업데이트 (스키마에 없을 수 있음)
    const memoValue = input.memo
    if (memoValue !== undefined && memoValue !== null && memoValue !== '' && String(memoValue).trim() !== '') {
      payload.memo = String(memoValue).trim()
    }
    if (payload.memo === undefined || payload.memo === null || payload.memo === '' || String(payload.memo).trim() === '') {
      delete payload.memo
    }

    return this.update(id, payload)
  }
}

