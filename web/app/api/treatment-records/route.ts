import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { TreatmentRecordsRepository } from '@/app/lib/repositories/treatment-records.repository'
import type { TreatmentRecordCreateInput } from '@/types/entities'

/**
 * GET /api/treatment-records
 * 시술 기록 목록 조회
 */
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const params = parseQueryParams(req)
    const { customer_id } = params

    const repo = new TreatmentRecordsRepository(userId)

    let records
    if (customer_id) {
      records = await repo.findByCustomerId(customer_id as string, { limit: 100 })
    } else {
      records = await repo.findAll({ limit: 100 })
    }

    return createSuccessResponse(records)
  } catch (error) {
    return createErrorResponse(error)
  }
})

/**
 * POST /api/treatment-records
 * 시술 기록 생성
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await parseAndValidateBody(req, {} as any) // TODO: 스키마 추가
    const repo = new TreatmentRecordsRepository(userId)

    // branch_id 자동 설정
    const { createSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = createSupabaseServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', userId)
      .single()

    const input: TreatmentRecordCreateInput = {
      ...body,
      branch_id: profile?.branch_id || null,
    }

    const record = await repo.createTreatmentRecord(input)

    // 고객의 last_visit_date 업데이트
    if (body.customer_id) {
      await supabase
        .from('customers')
        .update({ last_visit_date: new Date().toISOString() })
        .eq('id', body.customer_id)
    }

    return createSuccessResponse(record)
  } catch (error) {
    return createErrorResponse(error)
  }
})

