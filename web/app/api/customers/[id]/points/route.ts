import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseAndValidateBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { PointsRepository } from '@/app/lib/repositories/points.repository'
import { pointsLedgerCreateSchema } from '@/app/lib/api/schemas'
import { ValidationError } from '@/app/lib/api/errors'

// Vercel 배포를 위한 동적 렌더링 설정
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = withAuth(async (req: NextRequest, { userId, params }) => {
  const id = params?.['id']
  if (!id || typeof id !== "string") {
    throw new ValidationError("Missing or invalid customer ID")
  }
  const queryParams = parseQueryParams(req)
  const { searchParams } = new URL(req.url)
  const withLedger = (searchParams.get('with_ledger') || 'true') === 'true'
  
  const repository = new PointsRepository(userId)
  const options: Parameters<typeof repository.getBalance>[1] = {
    ...queryParams,
    withLedger,
  }
  if (queryParams.from) {
    options.from = queryParams.from
  }
  if (queryParams.to) {
    options.to = queryParams.to
  }
  const data = await repository.getBalance(id, options)
  
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId, params }) => {
  const id = params?.['id']
  if (!id || typeof id !== "string") {
    throw new ValidationError("Missing or invalid customer ID")
  }
  const validatedBody = await parseAndValidateBody(req, pointsLedgerCreateSchema)
  const repository = new PointsRepository(userId)
  // exactOptionalPropertyTypes를 위한 타입 변환
  const body: Parameters<typeof repository.addLedgerEntry>[1] = {
    delta: validatedBody.delta,
  }
  if (validatedBody.reason !== undefined) {
    body.reason = validatedBody.reason
  }
  const data = await repository.addLedgerEntry(id, body)
  return createSuccessResponse(data, 201)
})


