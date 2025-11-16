import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { VouchersRepository } from '@/app/lib/repositories/vouchers.repository'
import type { VoucherUseInput } from '@/app/lib/repositories/vouchers.repository'

export const POST = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid voucher ID" })
  }
  const body = await parseBody<VoucherUseInput>(req)
  const repository = new VouchersRepository(userId)
  const data = await repository.useVoucher(params.id, body)
  return createSuccessResponse(data)
})


