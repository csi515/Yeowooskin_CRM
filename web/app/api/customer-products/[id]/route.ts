import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { customerProductUpdateSchema } from '@/app/lib/api/schemas'
import { CustomerProductsRepository } from '@/app/lib/repositories/customer-products.repository'

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  const id = params?.['id']
  if (!id || typeof id !== "string") {
    return createErrorResponse(new Error("Missing or invalid product ID"))
  }
  try {
    const body = await parseAndValidateBody(req, customerProductUpdateSchema)
    const repository = new CustomerProductsRepository(userId)
    const data = await repository.updateHolding(id, body)
    return createSuccessResponse(data)
  } catch (error) {
    return createErrorResponse(error)
  }
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, params }) => {
  try {
    const id = params?.['id']
    if (!id || typeof id !== "string") {
      return createErrorResponse(new Error("Missing or invalid product ID"))
    }
    const repository = new CustomerProductsRepository(userId)
    await repository.delete(id)
    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
})


