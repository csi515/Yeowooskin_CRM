import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { TransactionsRepository } from '@/app/lib/repositories/transactions.repository'
import type { TransactionUpdateInput } from '@/types/entities'

export const GET = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid transaction ID" })
  }
  const repository = new TransactionsRepository(userId)
  const data = await repository.findById(params.id)
  return createSuccessResponse(data)
})

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid transaction ID" })
  }
  const body = await parseBody<TransactionUpdateInput>(req)
  const repository = new TransactionsRepository(userId)
  const data = await repository.updateTransaction(params.id, body)
  return createSuccessResponse(data)
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid transaction ID" })
  }
  const repository = new TransactionsRepository(userId)
  await repository.delete(params.id)
  return createSuccessResponse({ ok: true })
})
