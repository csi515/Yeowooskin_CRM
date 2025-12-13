/**
 * 기본 Repository 클래스
 * 공통 CRUD 로직을 제공합니다.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { ApiError, NotFoundError, UnauthorizedError } from '../api/errors'
import type { PaginationParams, SearchParams } from '@/types/common'

// Mock Data Load (Dynamic import to avoid circular dep issues if any, or just clean import)
import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_APPOINTMENTS } from '@/app/lib/mock-data'

export interface QueryOptions extends PaginationParams, Partial<SearchParams> {
  orderBy?: string
  ascending?: boolean
}

/**
 * 기본 Repository 클래스
 */
export abstract class BaseRepository<T> {
  protected supabase: SupabaseClient
  protected userId: string
  protected tableName: string

  constructor(userId: string, tableName: string, supabase: SupabaseClient) {
    this.userId = userId
    this.tableName = tableName
    this.supabase = supabase
  }

  // ... (handleSupabaseError remains)

  protected handleSupabaseError(error: any): never {
    console.error(`[${this.tableName}] Supabase Error:`, error)

    // 인증 관련 에러 (401, JWT expired 등)
    if (
      error.code === 'PGRST301' ||
      error.message?.includes('JWT') ||
      error.status === 401 ||
      error.message?.includes('invalid claim')
    ) {
      throw new UnauthorizedError()
    }

    if (error.code === 'PGRST116') {
      throw new NotFoundError(`${this.tableName} not found`)
    }

    // Postgres 에러 코드 처리
    if (error.code?.startsWith('23')) {
      // 23505: Unique violation
      if (error.code === '23505') {
        throw new ApiError(error.message, 409)
      }
      // 23503: Foreign key violation
      if (error.code === '23503') {
        throw new ApiError(error.message, 400)
      }
      throw new ApiError(error.message, 400)
    }

    throw new ApiError(error.message, (error.status && error.status >= 400) ? error.status : 500)
  }

  /**
   * 모든 레코드 조회 (페이지네이션 지원)
   */
  async findAll(options: QueryOptions = {}): Promise<T[]> {
    if (this.userId === 'demo-user') {
      // Mock Data 반환
      if (this.tableName === 'customers') return MOCK_CUSTOMERS as unknown as T[]
      if (this.tableName === 'products') return MOCK_PRODUCTS as unknown as T[]
      if (this.tableName === 'appointments') return MOCK_APPOINTMENTS as unknown as T[]
      return []
    }

    const {
      limit = 50,
      offset = 0,
      search,
      orderBy = 'created_at',
      ascending = false,
    } = options

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('owner_id', this.userId)
      .order(orderBy, { ascending })

    if (search && this.getSearchFields) {
      const fields = this.getSearchFields()
      if (fields.length > 0) {
        const searchPattern = fields.map(field => `${field}.ilike.%${search}%`).join(',')
        query = query.or(searchPattern)
      }
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      this.handleSupabaseError(error)
    }

    return (data || []) as T[]
  }

  /**
   * ID로 단일 레코드 조회
   */
  async findById(id: string): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('owner_id', this.userId)
      .single()

    if (error) {
      this.handleSupabaseError(error)
    }

    return data as T
  }

  /**
   * 레코드 생성
   */
  async create(payload: Partial<T>): Promise<T> {
    if (this.userId === 'demo-user') {
      throw new ApiError('데모 모드에서는 데이터를 저장할 수 없습니다.', 403)
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({ ...payload, owner_id: this.userId } as Record<string, unknown>)
      .select('*')
      .single()

    if (error) {
      this.handleSupabaseError(error)
    }

    return data as T
  }

  /**
   * 레코드 업데이트
   */
  async update(id: string, payload: Partial<T>): Promise<T> {
    if (this.userId === 'demo-user') {
      throw new ApiError('데모 모드에서는 데이터를 수정할 수 없습니다.', 403)
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .eq('owner_id', this.userId)
      .select('*')
      .single()

    if (error) {
      this.handleSupabaseError(error)
    }

    return data as T
  }

  /**
   * 레코드 삭제
   */
  async delete(id: string): Promise<void> {
    if (this.userId === 'demo-user') {
      throw new ApiError('데모 모드에서는 데이터를 삭제할 수 없습니다.', 403)
    }

    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('owner_id', this.userId)

    if (error) {
      this.handleSupabaseError(error)
    }
  }

  /**
   * 검색 필드 목록 (하위 클래스에서 오버라이드)
   */
  protected getSearchFields?(): string[]
}

