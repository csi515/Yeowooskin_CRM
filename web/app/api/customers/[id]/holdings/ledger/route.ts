import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, createSuccessResponse } from '@/app/lib/api/handlers'
import { CustomerProductsRepository } from '@/app/lib/repositories/customer-products.repository'

export const GET = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid customer ID" })
  }
  const queryParams = parseQueryParams(req)
  const repository = new CustomerProductsRepository(userId)
  const data = await repository.getCustomerLedger(params.id, queryParams)
  return createSuccessResponse(data)
})




