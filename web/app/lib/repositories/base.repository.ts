/**
 * 기본 Repository 클래스
 * 공통 CRUD 로직을 제공합니다.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NotFoundError, ApiError } from '../api/errors'
import type { PaginationParams, SearchParams } from '@/types/common'

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

  constructor(userId: string, tableName: string) {
    this.userId = userId
    this.tableName = tableName
    this.supabase = createSupabaseServerClient()
  }

  /**
   * 모든 레코드 조회 (페이지네이션 지원)
   */
  async findAll(options: QueryOptions = {}): Promise<T[]> {
    // limit 기본값 50, 최대값 200으로 제한
    const {
      limit: rawLimit = 50,
      offset = 0,
      search,
      orderBy = 'created_at',
      ascending = false,
    } = options
    const limit = Math.min(Math.max(1, rawLimit || 50), 200)

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
      throw new ApiError(error.message, 500)
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
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`${this.tableName} not found`)
      }
      throw new ApiError(error.message, 500)
    }

    return data as T
  }

  /**
   * 레코드 생성
   */
  async create(payload: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({ ...payload, owner_id: this.userId } as Record<string, unknown>)
      .select('*')
      .single()

    if (error) {
      throw new ApiError(error.message, 400)
    }

    return data as T
  }

  /**
   * 레코드 업데이트
   */
  async update(id: string, payload: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .eq('owner_id', this.userId)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`${this.tableName} not found`)
      }
      throw new ApiError(error.message, 400)
    }

    return data as T
  }

  /**
   * 레코드 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('owner_id', this.userId)

    if (error) {
      throw new ApiError(error.message, 400)
    }
  }

  /**
   * 검색 필드 목록 (하위 클래스에서 오버라이드)
   */
  protected getSearchFields?(): string[]
}

