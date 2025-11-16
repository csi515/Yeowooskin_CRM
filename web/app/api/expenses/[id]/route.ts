import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { ExpensesRepository } from '@/app/lib/repositories/expenses.repository'
import type { ExpenseUpdateInput } from '@/types/entities'

export const GET = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid expense ID" })
  }
  const repository = new ExpensesRepository(userId)
  const data = await repository.findById(params.id)
  return createSuccessResponse(data)
})

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid expense ID" })
  }
  const body = await parseBody<ExpenseUpdateInput>(req)
  const repository = new ExpensesRepository(userId)
  const data = await repository.updateExpense(params.id, body)
  return createSuccessResponse(data)
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid expense ID" })
  }
  const repository = new ExpensesRepository(userId)
  await repository.delete(params.id)
  return createSuccessResponse({ ok: true })
})


