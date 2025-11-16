/**
 * 공통 핸들러 함수
 */

import { NextResponse } from 'next/server'
import type { PaginationParams, SearchParams, DateRangeParams } from '@/types/common'
import { ApiError } from './errors'

/**
 * 쿼리 파라미터 파싱
 */
export function parseQueryParams(req: Request): PaginationParams & SearchParams & DateRangeParams {
  const { searchParams } = new URL(req.url)
  
  return {
    limit: Number(searchParams.get('limit') || 50),
    offset: Number(searchParams.get('offset') || 0),
    search: searchParams.get('search') || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
  }
}

/**
 * 요청 바디 파싱
 */
export async function parseBody<T = any>(req: Request): Promise<T> {
  try {
    return await req.json()
  } catch (error) {
    throw new ApiError('Invalid JSON body', 400)
  }
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 }
  )
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

