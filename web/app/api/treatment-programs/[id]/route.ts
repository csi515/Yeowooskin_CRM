import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { TreatmentProgramsRepository } from '@/app/lib/repositories/treatment-programs.repository'
import type { TreatmentProgramUpdateInput } from '@/types/entities'

/**
 * GET /api/treatment-programs/[id]
 * 시술 프로그램 상세 조회
 */
export const GET = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술 프로그램 ID가 필요합니다.'))
    }

    const repo = new TreatmentProgramsRepository(userId)
    const program = await repo.findById(id)

    return createSuccessResponse(program)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * PUT /api/treatment-programs/[id]
 * 시술 프로그램 수정
 */
export const PUT = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술 프로그램 ID가 필요합니다.'))
    }

    const body = await parseAndValidateBody(req, {} as any) // TODO: 스키마 추가
    const repo = new TreatmentProgramsRepository(userId)

    const program = await repo.updateTreatmentProgram(id, body as TreatmentProgramUpdateInput)

    return createSuccessResponse(program)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * DELETE /api/treatment-programs/[id]
 * 시술 프로그램 삭제
 */
export const DELETE = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술 프로그램 ID가 필요합니다.'))
    }

    const repo = new TreatmentProgramsRepository(userId)
    await repo.delete(id)

    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
})

