import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseAndValidateBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { BranchesRepository } from '@/app/lib/repositories/branches.repository'
import { branchCreateSchema } from '@/app/lib/api/schemas'
import { requireHQ } from '@/app/lib/api/roleGuard'
import { getUserIdFromCookies } from '@/lib/auth/user'

/**
 * GET /api/branches
 * 지점 목록 조회 (HQ 전용)
 */
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  // HQ 권한 확인
  await requireHQ(req)
  
  const params = parseQueryParams(req)
  const repository = new BranchesRepository()
  const data = await repository.findAll(params)
  return createSuccessResponse(data)
})

/**
 * POST /api/branches
 * 지점 생성 (HQ 전용)
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  // HQ 권한 확인
  await requireHQ(req)
  
  const validatedBody = await parseAndValidateBody(req, branchCreateSchema)
  const repository = new BranchesRepository()
  const data = await repository.create(validatedBody, userId)
  return createSuccessResponse(data)
})

