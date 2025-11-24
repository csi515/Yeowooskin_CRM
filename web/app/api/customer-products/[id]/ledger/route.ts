import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { customerProductLedgerUpdateSchema } from '@/app/lib/api/schemas'
import { customerProductLedgerCreateSchema } from '@/app/lib/api/schemas'
import { CustomerProductsRepository } from '@/app/lib/repositories/customer-products.repository'

export const GET = withAuth(async (req: NextRequest, { userId, params }) => {
  try {
    const queryParams = parseQueryParams(req)
    const id = params?.['id']
    if (!id || typeof id !== "string") {
      return createErrorResponse(new Error("Missing or invalid product ID"))
    }
    const repository = new CustomerProductsRepository(userId)
    const data = await repository.getLedger(id, queryParams)
    return createSuccessResponse(data)
  } catch (error) {
    return createErrorResponse(error)
  }
})

export const POST = withAuth(async (req: NextRequest, { userId, params }) => {
  try {
    const id = params?.['id']
    if (!id || typeof id !== "string") {
      return createErrorResponse(new Error("Missing or invalid product ID"))
    }
    const body = await parseAndValidateBody(req, customerProductLedgerCreateSchema)
    const repository = new CustomerProductsRepository(userId)
    await repository.addLedgerEntry(id, body.delta, body.reason || '')
    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
})

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  try {
    const id = params?.['id']
    if (!id || typeof id !== "string") {
      return createErrorResponse(new Error("Missing or invalid product ID"))
    }
    const body = await parseAndValidateBody(req, customerProductLedgerUpdateSchema)
    const repository = new CustomerProductsRepository(userId)
    await repository.updateLedgerEntry(
      id,
      body.replace_from || '',
      body.replace_to || '',
      body.delta_override
    )
    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
})

