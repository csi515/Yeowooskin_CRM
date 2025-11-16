import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { VouchersRepository } from '@/app/lib/repositories/vouchers.repository'
import type { VoucherCreateInput } from '@/app/lib/repositories/vouchers.repository'

export const GET = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid customer ID" })
  }
  const repository = new VouchersRepository(userId)
  const data = await repository.findByCustomerId(params.id)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid customer ID" })
  }
  const body = await parseBody<Omit<VoucherCreateInput, 'customer_id'>>(req)
  const repository = new VouchersRepository(userId)
  const data = await repository.createVoucher({
    ...body,
    customer_id: params.id,
  })
  return createSuccessResponse(data, 201)
})


