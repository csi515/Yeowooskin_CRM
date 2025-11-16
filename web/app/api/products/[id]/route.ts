import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { ProductsRepository } from '@/app/lib/repositories/products.repository'
import type { ProductUpdateInput } from '@/types/entities'

export const GET = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid product ID" })
  }
  const repository = new ProductsRepository(userId)
  const data = await repository.findById(params.id)
  return createSuccessResponse(data)
})

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid product ID" })
  }
  const body = await parseBody<ProductUpdateInput>(req)
  const repository = new ProductsRepository(userId)
  const data = await repository.updateProduct(params.id, body)
  return createSuccessResponse(data)
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid product ID" })
  }
  const repository = new ProductsRepository(userId)
  await repository.delete(params.id)
  return createSuccessResponse({ ok: true })
})
