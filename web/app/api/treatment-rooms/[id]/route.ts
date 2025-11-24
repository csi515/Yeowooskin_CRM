import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { TreatmentRoomsRepository } from '@/app/lib/repositories/treatment-rooms.repository'
import type { TreatmentRoomUpdateInput } from '@/types/entities'

/**
 * GET /api/treatment-rooms/[id]
 * 시술실 상세 조회
 */
export const GET = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술실 ID가 필요합니다.'))
    }

    const repo = new TreatmentRoomsRepository(userId)
    const room = await repo.findById(id)

    return createSuccessResponse(room)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * PUT /api/treatment-rooms/[id]
 * 시술실 수정
 */
export const PUT = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술실 ID가 필요합니다.'))
    }

    const body = await parseAndValidateBody(req, {} as any) // TODO: 스키마 추가
    const repo = new TreatmentRoomsRepository(userId)

    const room = await repo.updateTreatmentRoom(id, body as TreatmentRoomUpdateInput)

    return createSuccessResponse(room)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * DELETE /api/treatment-rooms/[id]
 * 시술실 삭제 (소프트 삭제)
 */
export const DELETE = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술실 ID가 필요합니다.'))
    }

    const repo = new TreatmentRoomsRepository(userId)
    await repo.softDeleteRoom(id)

    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
})

