import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { CustomerProductsRepository } from '@/app/lib/repositories/customer-products.repository'

export const GET = withAuth(async (req: NextRequest, { userId, params }) => {
  const queryParams = parseQueryParams(req)
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid product ID" })
  }
  const repository = new CustomerProductsRepository(userId)
  const data = await repository.getLedger(params.id, queryParams)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid product ID" })
  }
  const body = await parseBody<{ delta: number; reason?: string }>(req)
  const repository = new CustomerProductsRepository(userId)
  await repository.addLedgerEntry(params.id, body.delta, body.reason || '')
  return createSuccessResponse({ ok: true })
})

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid product ID" })
  }
  const body = await parseBody<{ replace_from?: string; replace_to?: string; delta_override?: number }>(req)
  const repository = new CustomerProductsRepository(userId)
  await repository.updateLedgerEntry(
    params.id,
    body.replace_from || '',
    body.replace_to || '',
    body.delta_override
  )
  return createSuccessResponse({ ok: true })
})

