import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { TreatmentProgramsRepository } from '@/app/lib/repositories/treatment-programs.repository'

/**
 * POST /api/treatment-programs/[id]/complete-session
 * 시술 프로그램 세션 완료 처리
 */
export const POST = withAuth(async (req: NextRequest, { userId }, { params }) => {
  try {
    const { id } = params
    if (!id) {
      return createErrorResponse(new Error('시술 프로그램 ID가 필요합니다.'))
    }

    const body = await parseAndValidateBody(req, {} as any)
    const repo = new TreatmentProgramsRepository(userId)

    await repo.completeSession(
      id,
      body.session_number,
      body.treatment_record_id,
      body.appointment_id
    )

    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
})

