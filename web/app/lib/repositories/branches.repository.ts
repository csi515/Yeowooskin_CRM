/**
 * 지점 Repository
 * HQ 전용 - 모든 지점 관리
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NotFoundError, ApiError } from '../api/errors'
import type { Branch, BranchCreateInput, BranchUpdateInput } from '@/types/entities'

export interface BranchQueryOptions {
  limit?: number
  offset?: number
  search?: string
  orderBy?: string
  ascending?: boolean
}

export class BranchesRepository {
  protected supabase: SupabaseClient

  constructor() {
    this.supabase = createSupabaseServerClient()
  }

  /**
   * 모든 지점 조회 (HQ 전용)
   */
  async findAll(options: BranchQueryOptions = {}): Promise<Branch[]> {
    const {
      limit = 50,
      offset = 0,
      search,
      orderBy = 'created_at',
      ascending = false,
    } = options

    let query = this.supabase
      .from('branches')
      .select('*')
      .is('deleted_at', null) // 삭제되지 않은 지점만
      .order(orderBy, { ascending })

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,address.ilike.%${search}%`)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return (data || []) as Branch[]
  }

  /**
   * ID로 지점 조회
   */
  async findById(id: string): Promise<Branch> {
    const { data, error } = await this.supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('지점을 찾을 수 없습니다')
      }
      throw new ApiError(error.message, 500)
    }

    return data as Branch
  }

  /**
   * 코드로 지점 조회
   */
  async findByCode(code: string): Promise<Branch | null> {
    const { data, error } = await this.supabase
      .from('branches')
      .select('*')
      .eq('code', code)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) {
      throw new ApiError(error.message, 500)
    }

    return data as Branch | null
  }

  /**
   * 지점 생성
   */
  async create(input: BranchCreateInput, createdBy: string): Promise<Branch> {
    const code = String(input.code || '').trim()
    const name = String(input.name || '').trim()

    if (!code) {
      throw new Error('지점 코드는 필수입니다')
    }
    if (!name) {
      throw new Error('지점명은 필수입니다')
    }

    // 코드 중복 확인
    const existing = await this.findByCode(code)
    if (existing) {
      throw new Error('이미 사용 중인 지점 코드입니다')
    }

    const payload = {
      code,
      name,
      address: input.address || null,
      phone: input.phone || null,
      created_by: createdBy,
    }

    const { data, error } = await this.supabase
      .from('branches')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw new ApiError(error.message, 400)
    }

    return data as Branch
  }

  /**
   * 지점 업데이트
   */
  async update(id: string, input: BranchUpdateInput): Promise<Branch> {
    const payload: Partial<Branch> = {}

    if (input.code !== undefined) {
      const code = String(input.code).trim()
      if (!code) {
        throw new Error('지점 코드는 필수입니다')
      }
      // 코드 중복 확인 (자신 제외)
      const existing = await this.findByCode(code)
      if (existing && existing.id !== id) {
        throw new Error('이미 사용 중인 지점 코드입니다')
      }
      payload.code = code
    }

    if (input.name !== undefined) {
      const name = String(input.name).trim()
      if (!name) {
        throw new Error('지점명은 필수입니다')
      }
      payload.name = name
    }

    if (input.address !== undefined) payload.address = input.address || null
    if (input.phone !== undefined) payload.phone = input.phone || null

    const { data, error } = await this.supabase
      .from('branches')
      .update(payload)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('지점을 찾을 수 없습니다')
      }
      throw new ApiError(error.message, 400)
    }

    return data as Branch
  }

  /**
   * 지점 소프트 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('branches')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) {
      throw new ApiError(error.message, 400)
    }
  }

  /**
   * 지점 복구
   */
  async restore(id: string): Promise<Branch> {
    const { data, error } = await this.supabase
      .from('branches')
      .update({ deleted_at: null })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('지점을 찾을 수 없습니다')
      }
      throw new ApiError(error.message, 400)
    }

    return data as Branch
  }

  /**
   * 지점에 지점장 할당
   */
  async assignOwner(branchId: string, ownerId: string): Promise<Branch> {
    const { data, error } = await this.supabase
      .from('branches')
      .update({ owner_id: ownerId })
      .eq('id', branchId)
      .is('deleted_at', null)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('지점을 찾을 수 없습니다')
      }
      throw new ApiError(error.message, 400)
    }

    return data as Branch
  }

  /**
   * 지점장 할당 해제
   */
  async unassignOwner(branchId: string): Promise<Branch> {
    const { data, error } = await this.supabase
      .from('branches')
      .update({ owner_id: null })
      .eq('id', branchId)
      .is('deleted_at', null)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('지점을 찾을 수 없습니다')
      }
      throw new ApiError(error.message, 400)
    }

    return data as Branch
  }
}

