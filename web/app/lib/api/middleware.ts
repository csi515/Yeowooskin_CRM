/**
 * API 미들웨어
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { UnauthorizedError } from './errors'
import { createErrorResponse } from './handlers'

/**
 * 인증된 사용자 컨텍스트
 */
export interface AuthContext {
  userId: string
}

/**
 * 인증 미들웨어가 적용된 핸들러 타입
 */
export type AuthHandler = (
  req: NextRequest,
  context: AuthContext & { params?: Record<string, string> }
) => Promise<NextResponse> | NextResponse

/**
 * 인증 미들웨어 HOF (Higher Order Function)
 * 
 * @example
 * export const GET = withAuth(async (req, { userId }) => {
 *   // userId가 자동으로 주입됨
 *   return NextResponse.json({ userId })
 * })
 */
export function withAuth(handler: AuthHandler) {
  return async (
    req: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      const userId = getUserIdFromCookies()
      
      if (!userId) {
        throw new UnauthorizedError()
      }

      return await handler(req, { userId, params: context?.params || {} })
    } catch (error) {
      return createErrorResponse(error)
    }
  }
}

/**
 * 에러 처리 미들웨어 HOF
 * 
 * @example
 * export const GET = withErrorHandling(async (req) => {
 *   // 에러가 자동으로 처리됨
 *   throw new ApiError('Something went wrong', 500)
 * })
 */
export function withErrorHandling(
  handler: (req: NextRequest, context?: { params?: Record<string, string> }) => Promise<NextResponse> | NextResponse
) {
  return async (
    req: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return createErrorResponse(error)
    }
  }
}

/**
 * 인증 및 에러 처리 미들웨어 조합
 * 
 * @example
 * export const GET = withAuthAndErrorHandling(async (req, { userId }) => {
 *   // userId가 주입되고 에러가 자동 처리됨
 *   return NextResponse.json({ userId })
 * })
 */
export function withAuthAndErrorHandling(handler: AuthHandler) {
  return withErrorHandling(withAuth(handler))
}

