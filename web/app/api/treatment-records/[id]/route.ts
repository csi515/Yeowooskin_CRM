import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { TreatmentRecordsRepository } from '@/app/lib/repositories/treatment-records.repository'
import type { TreatmentRecordUpdateInput } from '@/types/entities'

/**
 * GET /api/treatment-records/[id]
 * 시술 기록 상세 조회
 */
export const GET = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술 기록 ID가 필요합니다.'))
    }

    const repo = new TreatmentRecordsRepository(userId)
    const record = await repo.findById(id)

    return createSuccessResponse(record)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * PUT /api/treatment-records/[id]
 * 시술 기록 수정
 */
export const PUT = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술 기록 ID가 필요합니다.'))
    }

    const body = await parseAndValidateBody(req, {} as any) // TODO: 스키마 추가
    const repo = new TreatmentRecordsRepository(userId)

    const record = await repo.updateTreatmentRecord(id, body as TreatmentRecordUpdateInput)

    return createSuccessResponse(record)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * DELETE /api/treatment-records/[id]
 * 시술 기록 삭제
 */
export const DELETE = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술 기록 ID가 필요합니다.'))
    }

    const repo = new TreatmentRecordsRepository(userId)
    await repo.delete(id)

    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
})

