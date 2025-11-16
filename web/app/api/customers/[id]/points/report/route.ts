import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, createSuccessResponse } from '@/app/lib/api/handlers'
import { PointsRepository } from '@/app/lib/repositories/points.repository'

export const GET = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid customer ID" })
  }
  const queryParams = parseQueryParams(req)
  const repository = new PointsRepository(userId)
  const data = await repository.getReport(params.id, queryParams.from, queryParams.to)
  return createSuccessResponse(data)
})


