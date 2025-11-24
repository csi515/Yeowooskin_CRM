/**
 * 공통 핸들러 함수
 */

import { NextResponse } from 'next/server'
import type { PaginationParams, SearchParams, DateRangeParams } from '@/types/common'
import { ApiError, ValidationError } from './errors'
import { queryParamsSchema } from './schemas'
import { ZodError, z } from 'zod'

/**
 * 쿼리 파라미터 파싱 (Zod 검증 포함)
 */
export function parseQueryParams(req: Request): PaginationParams & SearchParams & DateRangeParams {
  const { searchParams } = new URL(req.url)
  
  try {
    // limit 기본값 50, 최대값 200으로 제한 (데이터가 많이 쌓이는 테이블 보호)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 200) : 50
    
    const params = {
      limit: String(limit),
      offset: searchParams.get('offset') || '0',
      search: searchParams.get('search') || '',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
    }
    
    const validated = queryParamsSchema.parse(params)
    return validated as PaginationParams & SearchParams & DateRangeParams
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid query parameters', {
        query: error.errors.map(e => e.message),
      })
    }
    throw error
  }
}

/**
 * 요청 바디 파싱
 */
export async function parseBody<T = unknown>(req: Request): Promise<T> {
  try {
    return await req.json()
  } catch (error) {
    throw new ApiError('Invalid JSON body', 400)
  }
}

/**
 * Zod 스키마로 요청 바디 검증
 */
export async function parseAndValidateBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await parseBody(req)
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      throw new ValidationError('Validation failed', errors)
    }
    throw error
  }
}

/**
 * 통일된 API 응답 형식
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(error: unknown): NextResponse {
  const response: ApiResponse = { success: false }

  if (error instanceof ApiError) {
    response.error = error.message
    return NextResponse.json(response, { status: error.statusCode })
  }

  if (error instanceof Error) {
    response.error = error.message
    return NextResponse.json(response, { status: 500 })
  }

  response.error = 'Internal server error'
  return NextResponse.json(response, { status: 500 })
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  return NextResponse.json(response, { status })
}

