import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { ProductsRepository } from '@/app/lib/repositories/products.repository'
import type { ProductCreateInput } from '@/types/entities'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = parseQueryParams(req)
  const repository = new ProductsRepository(userId)
  const data = await repository.findAll(params)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await parseBody<ProductCreateInput>(req)
  const repository = new ProductsRepository(userId)
  const data = await repository.createProduct(body)
  return createSuccessResponse(data, 201)
})
