import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { ExpensesRepository } from '@/app/lib/repositories/expenses.repository'
import type { ExpenseCreateInput } from '@/types/entities'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = parseQueryParams(req)
  const repository = new ExpensesRepository(userId)
  const data = await repository.findAll({
    ...params,
    from: params.from,
    to: params.to,
  })
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await parseBody<ExpenseCreateInput>(req)
  const repository = new ExpensesRepository(userId)
  const data = await repository.createExpense(body)
  return createSuccessResponse(data, 201)
})


