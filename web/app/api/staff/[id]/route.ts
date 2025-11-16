import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { StaffRepository } from '@/app/lib/repositories/staff.repository'
import type { StaffUpdateInput } from '@/types/entities'

export const GET = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid staff ID" })
  }
  const repository = new StaffRepository(userId)
  const data = await repository.findById(params.id)
  return createSuccessResponse(data)
})

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid staff ID" })
  }
  const body = await parseBody<StaffUpdateInput>(req)
  const repository = new StaffRepository(userId)
  const data = await repository.updateStaff(params.id, body)
  return createSuccessResponse(data)
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid staff ID" })
  }
  const repository = new StaffRepository(userId)
  await repository.delete(params.id)
  return createSuccessResponse({ ok: true })
})


