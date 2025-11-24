import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { BranchesRepository } from '@/app/lib/repositories/branches.repository'
import { branchUpdateSchema } from '@/app/lib/api/schemas'
import { requireHQ } from '@/app/lib/api/roleGuard'

/**
 * GET /api/branches/[id]
 * 지점 상세 조회 (HQ 전용)
 */
export const GET = withAuth(async (req: NextRequest, { userId }, { params }) => {
  await requireHQ(req)
  
  const { id } = params
  const repository = new BranchesRepository()
  const data = await repository.findById(id)
  return createSuccessResponse(data)
})

/**
 * PUT /api/branches/[id]
 * 지점 수정 (HQ 전용)
 */
export const PUT = withAuth(async (req: NextRequest, { userId }, { params }) => {
  await requireHQ(req)
  
  const { id } = params
  const validatedBody = await parseAndValidateBody(req, branchUpdateSchema)
  const repository = new BranchesRepository()
  const data = await repository.update(id, validatedBody)
  return createSuccessResponse(data)
})

/**
 * DELETE /api/branches/[id]
 * 지점 삭제 (소프트 삭제, HQ 전용)
 */
export const DELETE = withAuth(async (req: NextRequest, { userId }, { params }) => {
  await requireHQ(req)
  
  const { id } = params
  const repository = new BranchesRepository()
  await repository.delete(id)
  return createSuccessResponse({ ok: true })
})

