import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { TreatmentRoomsRepository } from '@/app/lib/repositories/treatment-rooms.repository'
import type { TreatmentRoomCreateInput } from '@/types/entities'

/**
 * GET /api/treatment-rooms
 * 시술실 목록 조회
 */
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const params = parseQueryParams(req)
    const { active_only } = params

    const repo = new TreatmentRoomsRepository(userId)

    let rooms
    if (active_only === 'true') {
      rooms = await repo.findActive({ limit: 100 })
    } else {
      rooms = await repo.findAll({ limit: 100 })
    }

    return createSuccessResponse(rooms)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * POST /api/treatment-rooms
 * 시술실 생성
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await parseAndValidateBody(req, {} as any) // TODO: 스키마 추가
    const repo = new TreatmentRoomsRepository(userId)

    // branch_id 자동 설정
    const { createSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = createSupabaseServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', userId)
      .single()

    const input: TreatmentRoomCreateInput = {
      ...body,
      branch_id: profile?.branch_id || null,
    }

    const room = await repo.createTreatmentRoom(input)

    return createSuccessResponse(room)
  } catch (error) {
    return createErrorResponse(error)
  }
})

