import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { createSuccessResponse } from '@/app/lib/api/handlers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NotFoundError, ApiError } from '@/app/lib/api/errors'

export const DELETE = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid voucher ID" })
  }
  if (!params?.useId || typeof params.useId !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid use ID" })
  }
  const supabase = createSupabaseServerClient()

  // 사용 내역 조회
  const { data: useRow, error: uErr } = await supabase
    .from('voucher_uses')
    .select('*')
    .eq('id', params.useId)
    .single()

  if (uErr || !useRow) {
    throw new NotFoundError(uErr?.message || 'not found')
  }

  // 바우처 조회
  const { data: voucher, error: vErr } = await supabase
    .from('vouchers')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', userId)
    .single()

  if (vErr || !voucher) {
    throw new NotFoundError(vErr?.message || 'not found')
  }

  // 잔액 복구
  const newRemaining = Number(voucher.remaining_amount || 0) + Number(useRow.amount || 0)

  const { error: upErr } = await supabase
    .from('vouchers')
    .update({ remaining_amount: newRemaining })
    .eq('id', params.id)
    .eq('owner_id', userId)

  if (upErr) {
    throw new ApiError(upErr.message, 400)
  }

  // 사용 내역 삭제
  const { error: delErr } = await supabase.from('voucher_uses').delete().eq('id', params.useId)

  if (delErr) {
    throw new ApiError(delErr.message, 400)
  }

  return createSuccessResponse({ ok: true, remaining_amount: newRemaining })
})


