import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { CustomersRepository } from '@/app/lib/repositories/customers.repository'
import type { CustomerUpdateInput } from '@/types/entities'

export const GET = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid customer ID" })
  }
  const repository = new CustomersRepository(userId)
  const data = await repository.findById(params.id)
  return createSuccessResponse(data)
})

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid customer ID" })
  }
  const body = await parseBody<CustomerUpdateInput>(req)
  const repository = new CustomersRepository(userId)
  const data = await repository.updateCustomer(params.id, body)
  return createSuccessResponse(data)
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid customer ID" })
  }
  const repository = new CustomersRepository(userId)
  await repository.delete(params.id)
  return createSuccessResponse({ ok: true })
})
