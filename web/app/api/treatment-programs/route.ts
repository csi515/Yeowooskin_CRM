import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { TreatmentProgramsRepository } from '@/app/lib/repositories/treatment-programs.repository'
import type { TreatmentProgramCreateInput } from '@/types/entities'

/**
 * GET /api/treatment-programs
 * 시술 프로그램 목록 조회
 */
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const params = parseQueryParams(req)
    const { customer_id } = params

    const repo = new TreatmentProgramsRepository(userId)

    let programs
    if (customer_id) {
      programs = await repo.findByCustomerId(customer_id as string, { limit: 100 })
    } else {
      programs = await repo.findAll({ limit: 100 })
    }

    return createSuccessResponse(programs)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * POST /api/treatment-programs
 * 시술 프로그램 생성
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await parseAndValidateBody(req, {} as any) // TODO: 스키마 추가
    const repo = new TreatmentProgramsRepository(userId)

    // branch_id 자동 설정
    const { createSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = createSupabaseServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', userId)
      .single()

    const input: TreatmentProgramCreateInput = {
      ...body,
      branch_id: profile?.branch_id || null,
    }

    const program = await repo.createTreatmentProgram(input)

    return createSuccessResponse(program)
  } catch (error) {
    return createErrorResponse(error)
  }
})

