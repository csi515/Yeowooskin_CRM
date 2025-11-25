/**
 * HQ 전용 API 라우트 래퍼
 * 반복되는 에러 핸들링 패턴을 통합
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireHQ } from './roleGuard'

type HQHandler = (req: NextRequest, hqProfile: Awaited<ReturnType<typeof requireHQ>>) => Promise<NextResponse>

/**
 * HQ 전용 API 핸들러 래퍼
 * 
 * @example
 * export const GET = withHQ(async (req, hqProfile) => {
 *   // hqProfile은 이미 검증됨
 *   return NextResponse.json({ data: '...' })
 * })
 */
export function withHQ(handler: HQHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const hqProfile = await requireHQ(req)
      return await handler(req, hqProfile)
    } catch (e: unknown) {
      // 인증/권한 에러 처리
      if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
        return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
      }
      // 기타 에러 처리
      return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
    }
  }
}

