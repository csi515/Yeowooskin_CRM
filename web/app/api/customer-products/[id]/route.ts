import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { CustomerProductsRepository } from '@/app/lib/repositories/customer-products.repository'
import type { CustomerProductUpdateInput } from '@/app/lib/repositories/customer-products.repository'

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid product ID" })
  }
  const body = await parseBody<CustomerProductUpdateInput>(req)
  const repository = new CustomerProductsRepository(userId)
  const data = await repository.updateHolding(params.id, body)
  return createSuccessResponse(data)
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid product ID" })
  }
  const repository = new CustomerProductsRepository(userId)
  await repository.delete(params.id)
  return createSuccessResponse({ ok: true })
})


