import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { TransactionsRepository } from '@/app/lib/repositories/transactions.repository'
import { transactionUpdateSchema } from '@/app/lib/api/schemas'
import { NotFoundError } from '@/app/lib/api/errors'

export const GET = withAuth(async (_req: NextRequest, { userId, supabase, params }) => {
  const id = params?.['id']
  if (!id || typeof id !== "string") {
    throw new NotFoundError("Missing or invalid transaction ID")
  }
  const repository = new TransactionsRepository(userId, supabase)
  const data = await repository.findById(id)
  if (!data) {
    throw new NotFoundError("Transaction not found")
  }
  return createSuccessResponse(data)
})

export const PUT = withAuth(async (req: NextRequest, { userId, supabase, params }) => {
  const id = params?.['id']
  if (!id || typeof id !== "string") {
    throw new NotFoundError("Missing or invalid transaction ID")
  }
  const validatedBody = await parseAndValidateBody(req, transactionUpdateSchema)
  const repository = new TransactionsRepository(userId, supabase)
  // exactOptionalPropertyTypes를 위한 타입 변환
  const body: Parameters<typeof repository.updateTransaction>[1] = {}
  if (validatedBody.customer_id !== undefined) {
    body.customer_id = validatedBody.customer_id
  }
  // notes 필드는 데이터베이스에 컬럼이 없으므로 제외
  // if (validatedBody.notes !== undefined) {
  //   body.notes = validatedBody.notes
  // }
  if (validatedBody.amount !== undefined) {
    body.amount = validatedBody.amount
  }
  if (validatedBody.transaction_date !== undefined) {
    body.transaction_date = validatedBody.transaction_date
  }
  const data = await repository.updateTransaction(id, body)
  return createSuccessResponse(data)
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, supabase, params }) => {
  const id = params?.['id']
  if (!id || typeof id !== "string") {
    throw new NotFoundError("Missing or invalid transaction ID")
  }
  const repository = new TransactionsRepository(userId, supabase)
  await repository.delete(id)
  return createSuccessResponse({ ok: true })
})
