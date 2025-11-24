import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { customerProductCreateSchema } from '@/app/lib/api/schemas'
import { CustomerProductsRepository } from '@/app/lib/repositories/customer-products.repository'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customer_id')
  
  if (!customerId) {
    return createErrorResponse(new Error('customer_id required'))
  }

  const repository = new CustomerProductsRepository(userId)
  const data = await repository.findByCustomerId(customerId)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await parseAndValidateBody(req, customerProductCreateSchema)
    const repository = new CustomerProductsRepository(userId)
    const data = await repository.createHolding(body)
    return createSuccessResponse(data, 201)
  } catch (error) {
    return createErrorResponse(error)
  }
})


