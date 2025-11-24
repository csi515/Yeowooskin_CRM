import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseAndValidateBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { TransactionsRepository } from '@/app/lib/repositories/transactions.repository'
import { transactionCreateSchema } from '@/app/lib/api/schemas'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = parseQueryParams(req)
  const customerId = new URL(req.url).searchParams.get('customer_id')
  const repository = new TransactionsRepository(userId)
  const options: Parameters<typeof repository.findAll>[0] = {
    ...params,
    ...(customerId && { customer_id: customerId }),
  }
  const data = await repository.findAll(options)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const validatedBody = await parseAndValidateBody(req, transactionCreateSchema)
  const repository = new TransactionsRepository(userId)
  // exactOptionalPropertyTypes를 위한 타입 변환
  const body: Parameters<typeof repository.createTransaction>[0] = {
    amount: validatedBody.amount,
    transaction_date: validatedBody.transaction_date,
  }
  if (validatedBody.customer_id !== undefined) {
    body.customer_id = validatedBody.customer_id
  }
  if (validatedBody.notes !== undefined) {
    body.notes = validatedBody.notes
  }
  const data = await repository.createTransaction(body)
  return createSuccessResponse(data, 201)
})
