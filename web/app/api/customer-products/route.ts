import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { CustomerProductsRepository } from '@/app/lib/repositories/customer-products.repository'
import type { CustomerProductCreateInput } from '@/app/lib/repositories/customer-products.repository'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customer_id')
  
  if (!customerId) {
    return createSuccessResponse({ message: 'customer_id required' }, 400)
  }

  const repository = new CustomerProductsRepository(userId)
  const data = await repository.findByCustomerId(customerId)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await parseBody<CustomerProductCreateInput>(req)
  const repository = new CustomerProductsRepository(userId)
  const data = await repository.createHolding(body)
  return createSuccessResponse(data, 201)
})


