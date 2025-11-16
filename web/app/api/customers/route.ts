import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { CustomersRepository } from '@/app/lib/repositories/customers.repository'
import type { CustomerCreateInput } from '@/types/entities'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = parseQueryParams(req)
  const repository = new CustomersRepository(userId)
  const data = await repository.findAll(params)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await parseBody<CustomerCreateInput>(req)
  const repository = new CustomersRepository(userId)
  const data = await repository.createCustomer(body)
  return createSuccessResponse(data, 201)
})
