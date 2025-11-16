import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { PointsRepository } from '@/app/lib/repositories/points.repository'
import type { PointsLedgerCreateInput } from '@/app/lib/repositories/points.repository'

export const GET = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid customer ID" })
  }
  const queryParams = parseQueryParams(req)
  const { searchParams } = new URL(req.url)
  const withLedger = (searchParams.get('with_ledger') || 'true') === 'true'
  
  const repository = new PointsRepository(userId)
  const data = await repository.getBalance(params.id, {
    ...queryParams,
    withLedger,
    from: queryParams.from,
    to: queryParams.to,
  })
  
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid customer ID" })
  }
  const body = await parseBody<PointsLedgerCreateInput>(req)
  const repository = new PointsRepository(userId)
  const data = await repository.addLedgerEntry(params.id, body)
  return createSuccessResponse({ ok: true, ...data })
})


