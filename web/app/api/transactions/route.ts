import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { TransactionsRepository } from '@/app/lib/repositories/transactions.repository'
import type { TransactionCreateInput } from '@/types/entities'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = parseQueryParams(req)
  const customerId = new URL(req.url).searchParams.get('customer_id') || undefined
  const repository = new TransactionsRepository(userId)
  const data = await repository.findAll({
    ...params,
    customer_id: customerId,
  })
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await parseBody<TransactionCreateInput>(req)
  const repository = new TransactionsRepository(userId)
  const data = await repository.createTransaction(body)
  return createSuccessResponse(data, 201)
})
