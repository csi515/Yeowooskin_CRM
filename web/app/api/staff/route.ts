import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { StaffRepository } from '@/app/lib/repositories/staff.repository'
import type { StaffCreateInput } from '@/types/entities'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = parseQueryParams(req)
  const repository = new StaffRepository(userId)
  const data = await repository.findAll(params)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await parseBody<StaffCreateInput>(req)
  const repository = new StaffRepository(userId)
  const data = await repository.createStaff(body)
  return createSuccessResponse(data, 201)
})


