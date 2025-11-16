/**
 * 포인트 Repository
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ApiError } from '../api/errors'
import type { QueryOptions } from './base.repository'

export interface PointsLedger {
  id: string
  owner_id: string
  customer_id: string
  delta: number
  reason?: string | null
  created_at?: string
}

export interface PointsBalance {
  balance: number
  ledger?: PointsLedger[]
}

export interface PointsReport {
  total_add: number
  total_deduct: number
  net: number
  by_reason: Array<{
    reason: string
    sum: number
    count: number
  }>
}

export interface PointsLedgerCreateInput {
  delta: number
  reason?: string
}

export class PointsRepository {
  protected supabase: ReturnType<typeof createSupabaseServerClient>
  protected userId: string

  constructor(userId: string) {
    this.userId = userId
    this.supabase = createSupabaseServerClient()
  }

  /**
   * 고객의 포인트 잔액 및 ledger 조회
   */
  async getBalance(
    customerId: string,
    options: QueryOptions & { withLedger?: boolean; from?: string; to?: string } = {}
  ): Promise<PointsBalance> {
    const { withLedger = true, limit = 50, offset = 0, from, to } = options

    // 전체 잔액 계산 (기간 무관)
    const { data: allRows, error: e1 } = await this.supabase
      .from('points_ledger')
      .select('delta, created_at')
      .eq('customer_id', customerId)
      .eq('owner_id', this.userId)
      .order('created_at', { ascending: false })

    if (e1) {
      throw new ApiError(e1.message, 500)
    }

    const balance = (allRows || []).reduce((s: number, r: any) => s + Number(r.delta || 0), 0)

    if (!withLedger) {
      return { balance }
    }

    // 기간 필터가 있으면 ledger 범위를 제한
    let query = this.supabase
      .from('points_ledger')
      .select('*')
      .eq('customer_id', customerId)
      .eq('owner_id', this.userId)
      .order('created_at', { ascending: false })

    if (from) {
      query = query.gte('created_at', from)
    }
    if (to) {
      query = query.lt('created_at', to)
    }

    const { data: ledger, error: e2 } = await query.range(offset, offset + limit - 1)

    if (e2) {
      throw new ApiError(e2.message, 500)
    }

    return {
      balance,
      ledger: (ledger || []) as PointsLedger[],
    }
  }

  /**
   * 포인트 ledger 항목 추가
   */
  async addLedgerEntry(customerId: string, input: PointsLedgerCreateInput): Promise<PointsBalance> {
    const { delta, reason = '' } = input

    if (!delta || delta === 0) {
      throw new Error('delta must be non-zero')
    }

    const { error: insErr } = await this.supabase.from('points_ledger').insert({
      customer_id: customerId,
      delta,
      reason,
      owner_id: this.userId,
    })

    if (insErr) {
      throw new ApiError(insErr.message, 400)
    }

    // 새로운 잔액 계산
    const { data: ledger, error } = await this.supabase
      .from('points_ledger')
      .select('delta')
      .eq('customer_id', customerId)
      .eq('owner_id', this.userId)

    if (error) {
      throw new ApiError(error.message, 500)
    }

    const balance = (ledger || []).reduce((s: number, r: any) => s + Number(r.delta || 0), 0)

    return { balance }
  }

  /**
   * 포인트 리포트 생성
   */
  async getReport(customerId: string, from?: string, to?: string): Promise<PointsReport> {
    let query = this.supabase
      .from('points_ledger')
      .select('delta, reason, created_at')
      .eq('customer_id', customerId)
      .eq('owner_id', this.userId)

    if (from) {
      query = query.gte('created_at', from)
    }
    if (to) {
      query = query.lt('created_at', to)
    }

    const { data, error } = await query

    if (error) {
      throw new ApiError(error.message, 500)
    }

    const rows = data || []

    let total_add = 0
    let total_deduct = 0
    const by_reason_map: Record<string, { sum: number; count: number }> = {}

    for (const r of rows) {
      const d = Number((r as any).delta || 0)
      if (d >= 0) {
        total_add += d
      } else {
        total_deduct += Math.abs(d)
      }
      const reason = String((r as any).reason || '기타')
      if (!by_reason_map[reason]) {
        by_reason_map[reason] = { sum: 0, count: 0 }
      }
      by_reason_map[reason].sum += Math.abs(d)
      by_reason_map[reason].count += 1
    }

    const by_reason = Object.entries(by_reason_map).map(([reason, { sum, count }]) => ({
      reason,
      sum,
      count,
    }))

    const net = total_add - total_deduct

    return {
      total_add,
      total_deduct,
      net,
      by_reason,
    }
  }
}

