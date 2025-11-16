/**
 * 바우처 Repository
 */

import { BaseRepository } from './base.repository'
import { ApiError, NotFoundError } from '../api/errors'

export interface Voucher {
  id: string
  owner_id: string
  customer_id: string
  name: string
  total_amount: number
  remaining_amount: number
  expires_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface VoucherUse {
  id: string
  owner_id: string
  voucher_id: string
  amount: number
  transaction_id?: string | null
  created_at?: string
}

export interface VoucherCreateInput {
  customer_id: string
  name: string
  total_amount: number
  expires_at?: string | null
}

export interface VoucherUseInput {
  amount: number
  transaction_id?: string | null
}

export interface VoucherUseResult {
  ok: boolean
  remaining_amount: number
  use: VoucherUse
}

export class VouchersRepository extends BaseRepository<Voucher> {
  constructor(userId: string) {
    super(userId, 'vouchers')
  }

  /**
   * 고객별 바우처 조회
   */
  async findByCustomerId(customerId: string): Promise<Voucher[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('customer_id', customerId)
      .eq('owner_id', this.userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return (data || []) as Voucher[]
  }

  /**
   * 바우처 생성
   */
  async createVoucher(input: VoucherCreateInput): Promise<Voucher> {
    const { customer_id, name, total_amount, expires_at } = input

    if (!name || !total_amount || total_amount <= 0) {
      throw new Error('invalid voucher')
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        customer_id,
        name,
        total_amount,
        remaining_amount: total_amount,
        expires_at: expires_at || null,
        owner_id: this.userId,
      } as any)
      .select('*')
      .single()

    if (error) {
      throw new ApiError(error.message, 400)
    }

    return data as Voucher
  }

  /**
   * 바우처 사용
   */
  async useVoucher(voucherId: string, input: VoucherUseInput): Promise<VoucherUseResult> {
    const { amount, transaction_id } = input

    if (!amount || amount <= 0) {
      throw new Error('invalid amount')
    }

    // 바우처 조회
    const { data: voucher, error: vErr } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', voucherId)
      .eq('owner_id', this.userId)
      .single()

    if (vErr || !voucher) {
      throw new NotFoundError(vErr?.message || 'not found')
    }

    if (Number(voucher.remaining_amount || 0) < amount) {
      throw new Error('잔액 부족')
    }

    const newRemaining = Number(voucher.remaining_amount) - amount

    // 바우처 잔액 업데이트
    const { error: upErr } = await this.supabase
      .from(this.tableName)
      .update({ remaining_amount: newRemaining })
      .eq('id', voucherId)
      .eq('owner_id', this.userId)

    if (upErr) {
      throw new ApiError(upErr.message, 400)
    }

    // 사용 내역 기록
    const { data: useRow, error: useErr } = await this.supabase
      .from('voucher_uses')
      .insert({
        voucher_id: voucherId,
        amount,
        transaction_id: transaction_id || null,
        owner_id: this.userId,
      } as any)
      .select('*')
      .single()

    if (useErr) {
      throw new ApiError(useErr.message, 400)
    }

    return {
      ok: true,
      remaining_amount: newRemaining,
      use: useRow as VoucherUse,
    }
  }
}

